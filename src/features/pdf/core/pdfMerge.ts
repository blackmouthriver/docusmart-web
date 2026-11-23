/**
 * Unir PDFs (W-146.1) sin perder lo que pdf-lib descarta al copiar páginas:
 * - Formularios: los campos de cada archivo pasan al formulario del PDF unido (si dos archivos
 *   tienen un campo con el mismo nombre, el segundo se renombra para que no se pisen).
 * - Marcadores (el índice lateral): se conservan apuntando a las páginas nuevas y, si se pide,
 *   cada archivo tiene su propio marcador con los suyos adentro.
 * - Título: el del primer archivo que lo tenga.
 * - Páginas de cada archivo (W-147.6): se puede elegir cuáles entran y en qué orden; los
 *   marcadores que apuntan a páginas que quedaron afuera se quitan.
 */
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObjectCopier,
  PDFRef,
  PDFString,
  type PDFObject,
} from 'pdf-lib'

export type MergeInput = {
  bytes: ArrayBuffer | Uint8Array
  name?: string
  /** Las páginas que entran (base 0, en este orden). Sin indicar: todas. */
  pages?: number[]
}
export type MergeOptions = {
  /** 'keep': los marcadores de cada archivo; 'perFile': además, uno por archivo con los suyos adentro. */
  bookmarks?: 'keep' | 'perFile'
}

/** Un marcador ya traducido al PDF unido: título, página de destino (o ninguna) e hijos. */
type Mark = { title: string; dest: PDFArray | null; children: Mark[] }

const MAX_MARKS = 5000

export async function mergePdfs(inputs: MergeInput[], opts: MergeOptions = {}): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  const marks: Mark[] = []
  const fieldRefs: PDFRef[] = []
  const usedNames = new Set<string>()
  let title: string | undefined
  let resources: PDFObject | undefined

  for (const input of inputs) {
    const src = await PDFDocument.load(input.bytes)
    title ??= src.getTitle() || undefined
    const wanted = input.pages ? pickPages(input.pages, src.getPageCount()) : src.getPageIndices()
    const pages = await out.copyPages(src, wanted)
    pages.forEach((p) => out.addPage(p))

    // Página de origen → página nueva (la primera copia), para que los marcadores apunten bien.
    const pageMap = new Map<string, PDFRef>()
    const srcPages = src.getPages()
    wanted.forEach((idx, i) => {
      const key = srcPages[idx].ref.toString()
      if (!pageMap.has(key)) pageMap.set(key, pages[i].ref)
    })

    const before = fieldRefs.length
    fieldRefs.push(...collectFields(out, pages.map((p) => p.node), usedNames))
    // Las fuentes del formulario (/DR) del primer archivo que tenga campos.
    const dr = src.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict)?.get(PDFName.of('DR'))
    if (!resources && dr && fieldRefs.length > before) resources = PDFObjectCopier.for(src.context, out.context).copy(dr)

    const outline = readOutline(src, pageMap, out)
    const own = input.pages ? pruneMarks(outline) : outline
    const first = pages[0] ? fitDest(out, pages[0].ref) : null
    if (opts.bookmarks === 'perFile') marks.push({ title: input.name?.replace(/\.pdf$/i, '') || `PDF ${marks.length + 1}`, dest: first, children: own })
    else marks.push(...own)
  }

  if (fieldRefs.length) {
    const acro = out.context.obj({ Fields: fieldRefs, NeedAppearances: true, DA: PDFString.of('/Helv 0 Tf 0 g') }) as PDFDict
    if (resources) acro.set(PDFName.of('DR'), resources)
    out.catalog.set(PDFName.of('AcroForm'), out.context.register(acro))
  }
  if (marks.length) writeOutline(out, marks)
  if (title) out.setTitle(title)
  return out.save()
}

/** Las páginas pedidas que existen en el archivo (base 0); si ninguna sirve, es un error. */
export function pickPages(pages: number[], count: number): number[] {
  const ok = pages.filter((i) => Number.isInteger(i) && i >= 0 && i < count)
  if (!ok.length) throw new RangeError('No pages selected')
  return ok
}

/** Quita los marcadores que apuntan a páginas que no entraron (salvo que tengan hijos que sí). */
function pruneMarks(list: Mark[]): Mark[] {
  return list.flatMap((m) => {
    const children = pruneMarks(m.children)
    return m.dest || children.length ? [{ ...m, children }] : []
  })
}

/** Los marcadores del primer nivel con la página (base 0) a la que llevan, para dividir por capítulos. */
export async function topBookmarks(bytes: ArrayBuffer | Uint8Array): Promise<{ count: number; marks: Array<{ title: string; page: number }> }> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const index = new Map(src.getPages().map((p, i) => [p.ref.toString(), i]))
  const marks: Array<{ title: string; page: number }> = []
  const root = src.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict)
  const seen = new Set<PDFDict>()
  let first = root?.get(PDFName.of('First'))
  let item = first ? src.context.lookupMaybe(first, PDFDict) : undefined
  let budget = MAX_MARKS
  while (item && !seen.has(item) && budget-- > 0) {
    seen.add(item)
    const target = resolveDest(src, item)
    const page = target ? index.get(target.toString()) : undefined
    if (page !== undefined) marks.push({ title: decodeText(item.get(PDFName.of('Title')))?.trim() ?? '', page })
    first = item.get(PDFName.of('Next'))
    item = first ? src.context.lookupMaybe(first, PDFDict) : undefined
  }
  return { count: src.getPageCount(), marks }
}

/** Destino "ir a esta página, ajustada a la ventana". */
const fitDest = (doc: PDFDocument, page: PDFRef) => doc.context.obj([page, PDFName.of('Fit')]) as PDFArray

/** Los campos de formulario de las páginas copiadas (la raíz de cada campo), con nombres únicos. */
function collectFields(out: PDFDocument, pages: PDFDict[], used: Set<string>): PDFRef[] {
  const roots = new Map<string, PDFRef>()
  for (const page of pages) {
    const annots = page.lookupMaybe(PDFName.of('Annots'), PDFArray)
    if (!annots) continue
    for (let i = 0; i < annots.size(); i++) {
      const widgetRef = annots.get(i)
      if (!(widgetRef instanceof PDFRef)) continue
      const widget = out.context.lookupMaybe(widgetRef, PDFDict)
      if (!widget || widget.get(PDFName.of('Subtype'))?.toString() !== '/Widget') continue
      // Sube hasta la raíz del campo (los widgets de un mismo campo comparten raíz).
      let ref: PDFRef = widgetRef
      let dict: PDFDict = widget
      for (let guard = 0; guard < 32; guard++) {
        const parent: PDFObject | undefined = dict.get(PDFName.of('Parent'))
        if (!(parent instanceof PDFRef)) break
        const up: PDFDict | undefined = out.context.lookupMaybe(parent, PDFDict)
        if (!up) break
        ref = parent
        dict = up
      }
      if (!dict.has(PDFName.of('T')) && !dict.has(PDFName.of('FT'))) continue
      if (roots.has(ref.toString())) continue
      roots.set(ref.toString(), ref)
      const name = decodeText(dict.get(PDFName.of('T'))) ?? 'campo'
      let unique = name
      for (let n = 2; used.has(unique); n++) unique = `${name}_${n}`
      used.add(unique)
      if (unique !== name || !dict.has(PDFName.of('T'))) dict.set(PDFName.of('T'), PDFHexString.fromText(unique))
    }
  }
  return [...roots.values()]
}

function decodeText(obj: PDFObject | undefined): string | undefined {
  if (obj instanceof PDFString || obj instanceof PDFHexString) return obj.decodeText()
  return undefined
}

/** Lee los marcadores del archivo de origen y los traduce a páginas del PDF unido. */
function readOutline(src: PDFDocument, pageMap: Map<string, PDFRef>, out: PDFDocument): Mark[] {
  const root = src.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict)
  if (!root) return []
  const seen = new Set<PDFDict>()
  let budget = MAX_MARKS
  const walk = (first: PDFObject | undefined): Mark[] => {
    const list: Mark[] = []
    let item = first ? src.context.lookupMaybe(first, PDFDict) : undefined
    while (item && !seen.has(item) && budget-- > 0) {
      seen.add(item)
      const target = resolveDest(src, item)
      const page = target ? pageMap.get(target.toString()) : undefined
      list.push({
        title: decodeText(item.get(PDFName.of('Title'))) ?? '',
        dest: page ? fitDest(out, page) : null,
        children: walk(item.get(PDFName.of('First'))),
      })
      const next = item.get(PDFName.of('Next'))
      item = next ? src.context.lookupMaybe(next, PDFDict) : undefined
    }
    return list
  }
  return walk(root.get(PDFName.of('First')))
}

/** La página a la que apunta un marcador: /Dest directo, acción GoTo o destino con nombre. */
function resolveDest(src: PDFDocument, item: PDFDict): PDFRef | undefined {
  let dest: PDFObject | undefined = item.get(PDFName.of('Dest'))
  if (!dest) {
    const action = item.lookupMaybe(PDFName.of('A'), PDFDict)
    if (action?.get(PDFName.of('S'))?.toString() === '/GoTo') dest = action.get(PDFName.of('D'))
  }
  if (dest instanceof PDFRef) dest = src.context.lookup(dest)
  if (dest instanceof PDFName || dest instanceof PDFString || dest instanceof PDFHexString) dest = namedDest(src, dest)
  if (dest instanceof PDFDict) dest = dest.get(PDFName.of('D'))
  if (dest instanceof PDFRef) dest = src.context.lookup(dest)
  if (dest instanceof PDFArray) {
    const page = dest.get(0)
    return page instanceof PDFRef ? page : undefined
  }
  return undefined
}

/** Busca un destino con nombre en /Dests (PDF 1.1) o en el árbol /Names /Dests. */
function namedDest(src: PDFDocument, name: PDFName | PDFString | PDFHexString): PDFObject | undefined {
  const key = name.decodeText()
  const old = src.catalog.lookupMaybe(PDFName.of('Dests'), PDFDict)
  if (old) {
    const hit = old.get(PDFName.of(key))
    if (hit) return hit
  }
  const names = src.catalog.lookupMaybe(PDFName.of('Names'), PDFDict)?.lookupMaybe(PDFName.of('Dests'), PDFDict)
  let budget = MAX_MARKS
  const search = (node: PDFDict | undefined): PDFObject | undefined => {
    if (!node || budget-- <= 0) return undefined
    const pairs = node.lookupMaybe(PDFName.of('Names'), PDFArray)
    if (pairs)
      for (let i = 0; i + 1 < pairs.size(); i += 2) {
        if (decodeText(pairs.lookup(i)) === key) return pairs.get(i + 1)
      }
    const kids = node.lookupMaybe(PDFName.of('Kids'), PDFArray)
    if (kids)
      for (let i = 0; i < kids.size(); i++) {
        const found = search(kids.lookupMaybe(i, PDFDict))
        if (found) return found
      }
    return undefined
  }
  return search(names)
}

/** Escribe el árbol de marcadores del PDF unido. */
function writeOutline(out: PDFDocument, marks: Mark[]): void {
  const ctx = out.context
  const rootRef = ctx.nextRef()
  const build = (list: Mark[], parent: PDFRef): { first: PDFRef; last: PDFRef; count: number } => {
    const refs = list.map(() => ctx.nextRef())
    let count = 0
    list.forEach((m, i) => {
      const dict = ctx.obj({}) as PDFDict
      dict.set(PDFName.of('Title'), PDFHexString.fromText(m.title || '—'))
      dict.set(PDFName.of('Parent'), parent)
      if (i > 0) dict.set(PDFName.of('Prev'), refs[i - 1])
      if (i < refs.length - 1) dict.set(PDFName.of('Next'), refs[i + 1])
      if (m.dest) dict.set(PDFName.of('Dest'), m.dest)
      if (m.children.length) {
        const kids = build(m.children, refs[i])
        dict.set(PDFName.of('First'), kids.first)
        dict.set(PDFName.of('Last'), kids.last)
        // Cerrados (cantidad negativa), como suelen mostrarse los marcadores anidados.
        dict.set(PDFName.of('Count'), PDFNumber.of(-kids.count))
      }
      ctx.assign(refs[i], dict)
      count += 1
    })
    return { first: refs[0], last: refs[refs.length - 1], count }
  }
  const top = build(marks, rootRef)
  ctx.assign(rootRef, ctx.obj({ Type: 'Outlines', First: top.first, Last: top.last, Count: top.count }))
  out.catalog.set(PDFName.of('Outlines'), rootRef)
}
