/**
 * Rescatar las páginas de un PDF cortado (W-147.9): una descarga interrumpida o un adjunto dañado
 * pierde el final del archivo, donde está la tabla que dice dónde queda cada objeto (y, a veces,
 * el catálogo y el árbol de páginas). Sin esa tabla ni pdf-lib ni qpdf lo abren.
 *
 * Aquí se recorre el archivo buscando los objetos que llegaron completos ("N G obj … endobj"),
 * también los que vienen dentro de flujos de objetos comprimidos, se reconocen las páginas y se
 * arma un PDF nuevo con ellas: en el orden del árbol de páginas original si llegó, y si no, en el
 * orden de los objetos. A cada página se le copia lo que heredaba (tamaño, recursos, giro).
 */
import { Unzlib, unzlibSync } from 'fflate'

export type Salvaged = {
  bytes: Uint8Array
  /** Páginas rescatadas. */
  pages: number
  /** Cuántas tenía el documento según su árbol de páginas (null si no llegó). */
  expected: number | null
}

export class SalvageError extends Error {
  constructor(readonly reason: 'encrypted' | 'nothing') {
    super(reason)
  }
}

type Obj = { num: number; body: string }

/** Bytes → texto de un carácter por byte (sin interpretar, para poder volver a los mismos bytes). */
function binary(b: Uint8Array): string {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return s
}
const toBytes = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff)

const HEADER = /(\d+)\s+(\d+)\s+obj\b/g
const isDelim = (c: string | undefined) => c === undefined || ' \t\r\n\f\0()<>[]{}/%'.includes(c)

/**
 * Los objetos completos del archivo; el último de cada número gana (actualizaciones). Si el
 * archivo termina en medio de un objeto, queda en `cut` (puede ser un flujo de objetos que se
 * descomprime en parte).
 */
export function scanObjects(text: string, cut?: { obj: Obj | null }): Map<number, Obj> {
  const out = new Map<number, Obj>()
  HEADER.lastIndex = 0
  for (let m = HEADER.exec(text); m; m = HEADER.exec(text)) {
    if (m.index > 0 && !isDelim(text[m.index - 1])) continue
    const bodyStart = m.index + m[0].length
    const endobj = text.indexOf('endobj', bodyStart)
    if (endobj < 0) {
      // El último objeto quedó cortado.
      if (cut) cut.obj = { num: Number(m[1]), body: text.slice(bodyStart) }
      break
    }
    let end = endobj
    const stream = text.indexOf('stream', bodyStart)
    if (stream >= 0 && stream < endobj && text.slice(stream - 3, stream) !== 'end') {
      // Con flujo: el "endobj" de verdad viene después de "endstream" (los datos pueden contener esas letras).
      const endstream = text.indexOf('endstream', stream + 6)
      if (endstream < 0) {
        if (cut) cut.obj = { num: Number(m[1]), body: text.slice(bodyStart) }
        break
      }
      end = text.indexOf('endobj', endstream)
      if (end < 0) break
    }
    out.set(Number(m[1]), { num: Number(m[1]), body: text.slice(bodyStart, end).trim() })
    HEADER.lastIndex = end + 6
  }
  return out
}

/** Los datos del flujo de un objeto (entre "stream" y "endstream"). */
function streamData(body: string): string | null {
  const s = body.indexOf('stream')
  const e = body.lastIndexOf('endstream')
  if (s < 0 || e < s) return null
  let from = s + 6
  if (body[from] === '\r') from++
  if (body[from] === '\n') from++
  return body.slice(from, e).replace(/\r?\n$/, '')
}

const dictOf = (body: string) => {
  const s = body.indexOf('stream')
  return s >= 0 ? body.slice(0, s) : body
}
const intKey = (dict: string, key: string) => {
  const m = new RegExp(`/${key}\\s+(\\d+)`).exec(dict)
  return m ? Number(m[1]) : null
}

/** Lo que se puede descomprimir de un flujo Flate cortado (lo que llegó). */
export function inflatePartial(data: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = []
  try {
    new Unzlib((chunk) => parts.push(chunk)).push(data, false)
  } catch {
    // Se usa lo que se alcanzó a descomprimir.
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

/**
 * Los objetos que vienen comprimidos dentro de un flujo de objetos (/Type /ObjStm). Con
 * `partial` (el flujo quedó cortado) se descomprime lo que llegó y se toman los objetos enteros.
 */
export function objectStreamObjects(body: string, partial = false): Obj[] {
  const dict = dictOf(body)
  const n = intKey(dict, 'N')
  const first = intKey(dict, 'First')
  let data = streamData(body)
  if (partial && data === null) {
    const s = body.indexOf('stream')
    if (s < 0) return []
    let from = s + 6
    if (body[from] === '\r') from++
    if (body[from] === '\n') from++
    data = body.slice(from)
  }
  if (n === null || first === null || data === null) return []
  let text: string
  try {
    const flate = /FlateDecode/.test(dict)
    text = flate ? binary(partial ? inflatePartial(toBytes(data)) : unzlibSync(toBytes(data))) : data
  } catch {
    return []
  }
  if (text.length < first) return []
  const head = text.slice(0, first).trim().split(/\s+/).map(Number)
  const out: Obj[] = []
  for (let i = 0; i < n && 2 * i + 1 < head.length; i++) {
    const start = first + head[2 * i + 1]
    const end = i + 1 < n && 2 * i + 3 < head.length ? first + head[2 * i + 3] : text.length
    // En un flujo cortado, el último objeto puede estar incompleto: solo los que terminan antes.
    if (partial && (i + 1 >= n || end > text.length)) break
    out.push({ num: head[2 * i], body: text.slice(start, end).trim() })
  }
  return out
}

const typeOf = (body: string) => /\/Type\s*\/([A-Za-z]+)/.exec(dictOf(body))?.[1] ?? ''
const refs = (s: string) => [...s.matchAll(/(\d+)\s+\d+\s+R\b/g)].map((m) => Number(m[1]))

/** El valor de una clave del diccionario (número, nombre, arreglo, diccionario o referencia), como texto. */
export function valueOf(dict: string, key: string): string | null {
  const re = new RegExp(`/${key}(?![A-Za-z0-9])`)
  const m = re.exec(dict)
  if (!m) return null
  let i = m.index + m[0].length
  while (' \t\r\n'.includes(dict[i])) i++
  const ref = /^(\d+\s+\d+\s+R)\b/.exec(dict.slice(i, i + 40))
  if (ref) return ref[1]
  const open = dict[i]
  if (open === '[' || (open === '<' && dict[i + 1] === '<')) {
    // Se busca el cierre que corresponde, contando lo que se abre adentro.
    let depth = 0
    for (let j = i; j < dict.length; j++) {
      if (dict[j] === '[' || (dict[j] === '<' && dict[j + 1] === '<')) depth++
      else if (dict[j] === ']' || (dict[j] === '>' && dict[j + 1] === '>')) depth--
      if (depth === 0) return dict.slice(i, j + (dict[j] === '>' ? 2 : 1))
      if (dict[j] === '<' && dict[j + 1] === '<') j++
      else if (dict[j] === '>' && dict[j + 1] === '>') j++
    }
    return null
  }
  const word = /^[^\s/<>[\]()]*/.exec(dict.slice(i + (open === '/' ? 1 : 0)))?.[0] ?? ''
  return open === '/' ? '/' + word : word || null
}

const INHERITED = ['MediaBox', 'Resources', 'CropBox', 'Rotate']

/** El /Length del flujo con el largo real de sus datos (el objeto con el largo pudo perderse). */
export function fixLength(body: string): string {
  const data = streamData(body)
  if (data === null) return body
  const dict = dictOf(body)
  const value = valueOf(dict, 'Length')
  const at = dict.search(/\/Length(?![A-Za-z0-9])/)
  if (value === null || at < 0) return dict.replace('<<', `<< /Length ${data.length}`) + body.slice(dict.length)
  // Se reemplaza "/Length <valor>" (número o referencia) por el largo real.
  const valueAt = dict.indexOf(value, at + 7)
  return dict.slice(0, at) + `/Length ${data.length}` + dict.slice(valueAt + value.length) + body.slice(dict.length)
}

/** Rescata las páginas que llegaron completas y arma un PDF nuevo con ellas. */
export function salvagePdf(input: Uint8Array): Salvaged {
  const text = binary(input)
  if (/\/Encrypt\s+\d+\s+\d+\s+R/.test(text) || /\/Filter\s*\/Standard/.test(text)) throw new SalvageError('encrypted')
  const cut: { obj: Obj | null } = { obj: null }
  const objects = scanObjects(text, cut)
  for (const o of [...objects.values()]) if (typeOf(o.body) === 'ObjStm') for (const inner of objectStreamObjects(o.body)) if (!objects.has(inner.num)) objects.set(inner.num, inner)
  if (cut.obj && typeOf(cut.obj.body) === 'ObjStm') for (const inner of objectStreamObjects(cut.obj.body, true)) if (!objects.has(inner.num)) objects.set(inner.num, inner)

  const pagesNodes = [...objects.values()].filter((o) => typeOf(o.body) === 'Pages')
  const isPage = (o: Obj) => typeOf(o.body) === 'Page'
  // Una página sirve si llegó su contenido entero (los flujos que dibujan la página).
  const usable = (o: Obj) => {
    const contents = valueOf(dictOf(o.body), 'Contents')
    return !contents || refs(contents).every((n) => objects.has(n))
  }

  // Orden: el del árbol de páginas (desde las raíces), y después las sueltas por número.
  const order: number[] = []
  const seen = new Set<number>()
  const walk = (num: number, depth: number) => {
    const o = objects.get(num)
    if (!o || seen.has(num) || depth > 50) return
    seen.add(num)
    if (isPage(o)) order.push(num)
    else for (const kid of refs(valueOf(dictOf(o.body), 'Kids') ?? '')) walk(kid, depth + 1)
  }
  const roots = pagesNodes.filter((o) => !valueOf(dictOf(o.body), 'Parent'))
  for (const r of roots) walk(r.num, 0)
  for (const o of [...objects.values()].sort((a, b) => a.num - b.num)) if (isPage(o) && !seen.has(o.num)) order.push(o.num)
  const pages = order.map((n) => objects.get(n)!).filter(usable)
  if (!pages.length) throw new SalvageError('nothing')
  const counts = roots.map((r) => intKey(dictOf(r.body), 'Count')).filter((n): n is number => n !== null)
  const expected = counts.length ? Math.max(...counts) : null

  const maxNum = Math.max(...objects.keys())
  const pagesNum = maxNum + 1
  const catalogNum = maxNum + 2
  const pageNums = new Set(pages.map((p) => p.num))
  const skip = new Set(['Catalog', 'Pages', 'XRef', 'ObjStm'])

  /** La página con lo que heredaba de sus nodos padres y el nuevo padre. */
  const fixPage = (o: Obj): string => {
    let body = o.body
    let dict = dictOf(body)
    const missing = INHERITED.filter((k) => valueOf(dict, k) === null)
    const additions: string[] = []
    let parent = refs(valueOf(dict, 'Parent') ?? '')[0]
    for (let depth = 0; missing.length && parent !== undefined && depth < 50; depth++) {
      const node = objects.get(parent)
      if (!node) break
      const nd = dictOf(node.body)
      for (const k of [...missing]) {
        const v = valueOf(nd, k)
        if (v !== null) {
          additions.push(`/${k} ${v}`)
          missing.splice(missing.indexOf(k), 1)
        }
      }
      parent = refs(valueOf(nd, 'Parent') ?? '')[0]
    }
    if (missing.includes('MediaBox')) additions.push('/MediaBox [0 0 612 792]')
    dict = dict.replace(/\/Parent\s+\d+\s+\d+\s+R/, '')
    const open = dict.indexOf('<<')
    dict = dict.slice(0, open + 2) + ` /Parent ${pagesNum} 0 R ${additions.join(' ')} ` + dict.slice(open + 2)
    body = dict + body.slice(dictOf(body).length)
    return body
  }

  // Archivo nuevo: los objetos que sirven, el árbol de páginas, el catálogo y la tabla.
  const chunks: Uint8Array[] = [toBytes('%PDF-1.7\n%âãÏÓ\n')]
  let size = chunks[0].length
  const offsets = new Map<number, number>()
  const write = (num: number, body: string) => {
    offsets.set(num, size)
    const b = toBytes(`${num} 0 obj\n${body}\nendobj\n`)
    chunks.push(b)
    size += b.length
  }
  for (const o of [...objects.values()].sort((a, b) => a.num - b.num)) {
    if (skip.has(typeOf(o.body))) continue
    if (isPage(o) && !pageNums.has(o.num)) continue
    write(o.num, fixLength(pageNums.has(o.num) ? fixPage(o) : o.body))
  }
  write(pagesNum, `<< /Type /Pages /Kids [${pages.map((p) => `${p.num} 0 R`).join(' ')}] /Count ${pages.length} >>`)
  write(catalogNum, `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`)
  const lines = ['xref', `0 ${catalogNum + 1}`, '0000000000 65535 f\r']
  for (let n = 1; n <= catalogNum; n++) {
    const at = offsets.get(n)
    lines.push(at === undefined ? '0000000000 65535 f\r' : `${String(at).padStart(10, '0')} 00000 n\r`)
  }
  chunks.push(toBytes(`${lines.join('\n')}\ntrailer\n<< /Size ${catalogNum + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${size}\n%%EOF\n`))
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  return { bytes: out, pages: pages.length, expected }
}
