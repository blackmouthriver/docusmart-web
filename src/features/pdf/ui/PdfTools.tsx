import { useCallback, useEffect, useRef, useState, type CSSProperties, type ComponentType } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Segmented, errorMessage } from '../../../shared/ui/ui'
import { baseName, chunkPages, formatPageRanges, moveItem, parsePageRanges, parseRangeGroups } from '../../../shared/files/files'
import { closePdf, openPdf, renderPage } from '../../../shared/pdf/pdf'
import { bookmarkGroups, composePages, extractPages, fileSafe, mergePdfs, numberPages, pageCount, rotate, splitBySize, splitEach, splitGroups, topBookmarks, watermarkPdf, NUMBER_POSITIONS, DEFAULT_NUMBER_OPTIONS, type BookmarkGroup, type NumberPosition, type Sheet } from '../core/pdfTools'
import { useSortable } from '../../../shared/ui/useSortable'
import { WatermarkOptionsPanel, toWatermarkOptions, watermarkReady, watermarkUiDefault, type WatermarkUi } from './WatermarkOptions'
import { track } from '../../../shared/platform/analytics'
import { CompressTool, ProtectTool, RepairTool, UnlockTool } from '../../security/ui/PdfSecurityTools'
import { OcrTool } from '../../ocr/ui/OcrTool'
import { CropTool } from './CropTool'
import { SignTool } from './SignTool'
import { RedactTool } from './RedactTool'
import { CompareTool } from './CompareTool'
import { ExtractImagesTool } from './ExtractImagesTool'
import { EditTool } from './EditTool'
import { FormTool } from './FormTool'
import { ScanTool } from '../../scan/ui/ScanTool'
import { PdfATool } from '../../pdfa/ui/PdfATool'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'

/** Nombre y descripción de cada herramienta, en el idioma de la página. */
export const toolName = (id: string) => tr(`tool.${id}` as MessageKey)
export const toolDesc = (id: string) => tr(`tool.${id}.desc` as MessageKey)
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { bundleFiles, resultFile } from '../../../shared/files/share'

/** "1 página" o "N páginas". */
const pagesLabel = (n: number) => (n === 1 ? tr('common.onePage') : tr('single.pagesN', { n }))

const TOOLS: Array<{ id: string; icon: IconName; cls: string }> = [
  { id: 'editar', icon: 'edit', cls: 'ico-blue' },
  { id: 'formulario', icon: 'form', cls: 'ico-green' },
  { id: 'escanear', icon: 'camera', cls: 'ico-cyan' },
  { id: 'unir', icon: 'merge', cls: 'ico-red' },
  { id: 'dividir', icon: 'split', cls: 'ico-violet' },
  { id: 'rotar', icon: 'rotate', cls: 'ico-blue' },
  { id: 'reordenar', icon: 'reorder', cls: 'ico-cyan' },
  { id: 'recortar', icon: 'crop', cls: 'ico-amber' },
  { id: 'firmar', icon: 'pen', cls: 'ico-blue' },
  { id: 'censurar', icon: 'redact', cls: 'ico-red' },
  { id: 'comparar', icon: 'compare', cls: 'ico-violet' },
  { id: 'imagenes', icon: 'images', cls: 'ico-violet' },
  { id: 'numerar', icon: 'hash', cls: 'ico-green' },
  { id: 'marca', icon: 'stamp', cls: 'ico-amber' },
  { id: 'comprimir', icon: 'compress', cls: 'ico-green' },
  { id: 'proteger', icon: 'lock', cls: 'ico-amber' },
  { id: 'desbloquear', icon: 'unlock', cls: 'ico-blue' },
  { id: 'reparar', icon: 'wrench', cls: 'ico-violet' },
  { id: 'pdfa', icon: 'archive', cls: 'ico-cyan' },
  { id: 'ocr', icon: 'text', cls: 'ico-cyan' },
]

const PDF_TYPE = 'application/pdf'

/** Título del resultado, propio de cada herramienta. */
const title = (toolId: string) => tr(`single.title.${toolId}` as MessageKey)

/** Herramientas con su propio componente (las demás usan SingleFileTool). */
export const OWN_TOOLS: Record<string, ComponentType> = {
  unir: MergeTool,
  comprimir: CompressTool,
  proteger: ProtectTool,
  desbloquear: UnlockTool,
  reparar: RepairTool,
  ocr: OcrTool,
  recortar: CropTool,
  firmar: SignTool,
  censurar: RedactTool,
  comparar: CompareTool,
  imagenes: ExtractImagesTool,
  editar: EditTool,
  formulario: FormTool,
  escanear: ScanTool,
  pdfa: PdfATool,
}

export function PdfTools({ sub }: { sub?: string }) {
  const tool = TOOLS.find((t) => t.id === sub)
  const Own = tool ? OWN_TOOLS[tool.id] : undefined
  return (
    <>
      <HeroCard title={tr('pdf.heroTitle')} subtitle={tr('pdf.heroSub')} />
      {tool ? (
        <>
          <BackButton label={tr('pdf.back')} onClick={() => go('pdf')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{toolName(tool.id)}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{toolDesc(tool.id)}</p>
          {Own ? <Own /> : <SingleFileTool key={tool.id} toolId={tool.id} />}
        </>
      ) : (
        <>
          <h2 className="section-title">{tr('pdf.choose')}</h2>
          <div className="tool-grid">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" className="tool-card" onClick={() => go('pdf', t.id)}>
                <span className={'ico ' + t.cls}><Icon name={t.icon} /></span>
                <span>
                  <b>{toolName(t.id)}</b>
                  <small>{toolDesc(t.id)}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function useRun(toolName: string) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<void>, okMsg = tr('pdf.downloadedToast')) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      track('pdf_tool_used', { tool_name: toolName })
      toast(okMsg)
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_' + toolName, error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

let nextId = 0
/** Un PDF para unir: `pages` es el texto de las páginas que entran ("" = todas); `count`, cuántas tiene. */
type MergeItem = { id: number; file: File; pages: string; count: number | null }
const withId = (file: File): MergeItem => ({ id: ++nextId, file, pages: '', count: null })

export function MergeTool() {
  const [files, setFiles] = useState<MergeItem[]>([])
  const [bookmarks, setBookmarks] = useState<'keep' | 'perFile'>('keep')
  const { busy, error, run } = useRun('merge')
  const [output, setOutput] = useState<File | null>(null)
  // Agregar, quitar u ordenar los PDF (o cambiar los marcadores) invalida el resultado anterior.
  useEffect(() => setOutput(null), [files, bookmarks])
  const move = (i: number, j: number) => setFiles((p) => moveItem(p, i, j))
  const sort = useSortable(files.length, move)
  const patch = (id: number, change: Partial<MergeItem>) => setFiles((p) => p.map((x) => (x.id === id ? { ...x, ...change } : x)))
  /** Páginas elegidas de cada archivo (W-147.6): null si el texto no es válido, undefined si son todas. */
  const picked = files.map((x) => (x.pages.trim() && x.count ? parsePageRanges(x.pages, x.count) : undefined))
  const invalid = files.some((x, i) => x.pages.trim() && (picked[i] === null || picked[i]?.length === 0))
  const add = (list: File[]) => {
    const items = list.map(withId)
    setFiles((p) => [...p, ...items])
    // Cuántas páginas tiene cada uno, para elegir y validar.
    items.forEach((it) => void it.file.arrayBuffer().then(pageCount).then((count) => patch(it.id, { count }), () => patch(it.id, { count: 0 })))
  }
  return (
    <div className="card stack">
      <DropZone accept="application/pdf" multiple title={tr('merge.pick')} hint={tr('merge.pickHint')} onFiles={add} />
      {files.length > 0 && (
        <ul className={'file-list sortable' + (sort.dragging ? ' is-sorting' : '')}>
          {files.map(({ id, file: f, count }, i) => (
            <FileRow
              key={id}
              file={f}
              extra={[`#${i + 1}`, count ? (picked[i] ? tr('merge.pagesOf', { n: picked[i]!.length, total: count }) : pagesLabel(count)) : ''].filter(Boolean).join(' · ')}
              rowProps={sort.item(i)}
              lead={
                files.length > 1 && (
                  <button type="button" className="icon-btn drag-handle" aria-label={tr('merge.drag', { name: f.name })} title={tr('merge.drag', { name: f.name })} {...sort.handle(i)}>
                    <Icon name="grip" />
                  </button>
                )
              }
              actions={
                <>
                  <button type="button" className="icon-btn" aria-label={tr('merge.up')} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('merge.down')} disabled={i === files.length - 1} onClick={() => move(i, i + 1)}><Icon name="downArrow" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} onClick={() => setFiles((p) => p.filter((x) => x.id !== id))}><Icon name="close" /></button>
                </>
              }
            />
          ))}
        </ul>
      )}
      {files.length > 1 && (
        <div className="stack" style={{ gap: 6 }}>
          <Segmented
            label={tr('merge.bookmarks')}
            value={bookmarks}
            onChange={setBookmarks}
            options={[
              { value: 'keep', label: tr('merge.bookmarks.keep') },
              { value: 'perFile', label: tr('merge.bookmarks.perFile') },
            ]}
          />
          <small className="faint">{tr('merge.keepsHint')}</small>
        </div>
      )}
      {files.length > 0 && (
        <details className="qr-design merge-pages" open={files.some((x) => x.pages.trim()) || undefined}>
          <summary>{tr('merge.pagesTitle')}</summary>
          <p className="faint" style={{ margin: '4px 0 10px' }}>{tr('merge.pagesHint')}</p>
          <div className="stack" style={{ gap: 10 }}>
            {files.map((x, i) => (
              <label key={x.id} className="field">
                <span>{`#${i + 1} ${x.file.name}`}{x.count ? ` (${pagesLabel(x.count)})` : ''}</span>
                <input className="input" value={x.pages} placeholder={tr('merge.pagesAll')} onChange={(e) => patch(x.id, { pages: e.target.value })} />
                {x.pages.trim() && x.count !== null && (picked[i] === null || picked[i]?.length === 0) && <small style={{ color: 'var(--danger)' }}>{tr('single.rangeBad', { n: x.count })}</small>}
              </label>
            ))}
          </div>
        </details>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton
          busy={busy}
          disabled={files.length < 2 || invalid}
          icon="merge"
          onClick={() =>
            run(async () => {
              const inputs = await Promise.all(files.map(async ({ file }, i) => ({ bytes: await file.arrayBuffer(), name: file.name, pages: picked[i] ?? undefined })))
              const out = await mergePdfs(inputs, { bookmarks })
              setOutput(resultFile(out, `${baseName(files[0].file.name)}-${tr('file.merged')}.pdf`, PDF_TYPE))
            }, tr('common.doneReview'))
          }
        >
          {files.length < 2 ? tr('merge.needTwo') : tr('merge.go', { n: files.length })}
        </BusyButton>
      </div>
      {files.length > 0 && (
        <BeforeAfter
          originals={files.map((x) => x.file)}
          result={output}
          labels={[tr('merge.labelIn'), tr('merge.labelOut')]}
          toolName="merge"
          title={tr('merge.title')}
          previewTitle={tr('merge.previewTitle')}
          placeholder={busy ? tr('merge.busy') : files.length < 2 ? tr('merge.addAnother') : tr('merge.press', { n: files.length })}
        />
      )}
    </div>
  )
}

/**
 * Miniaturas que se dibujan solo cuando se van a ver (W-147.6): en un PDF de cientos de páginas
 * no se dibujan todas al abrirlo. El documento queda abierto mientras se usa la herramienta.
 */
type PdfDoc = Awaited<ReturnType<typeof openPdf>>

function useThumbs(file: File | null) {
  const [count, setCount] = useState(0)
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const state = useRef<{ doc: PdfDoc | null; queue: number[]; asked: Set<number>; busy: boolean; alive: boolean }>({ doc: null, queue: [], asked: new Set(), busy: false, alive: false })

  const pump = useCallback(async () => {
    const st = state.current
    if (st.busy || !st.doc) return
    st.busy = true
    try {
      while (st.alive && st.doc && st.queue.length) {
        const i = st.queue.shift()!
        const doc: PdfDoc = st.doc
        const canvas = await renderPage(doc, i + 1, 220, 'print')
        const url = canvas.toDataURL('image/jpeg', 0.75)
        canvas.width = canvas.height = 0
        if (st.alive && st.doc === doc) setThumbs((t) => ({ ...t, [i]: url }))
      }
    } catch (e) {
      if (st.alive) setError(errorMessage(e))
    } finally {
      st.busy = false
    }
  }, [])

  const request = useCallback(
    (i: number) => {
      const st = state.current
      if (st.asked.has(i)) return
      st.asked.add(i)
      st.queue.push(i)
      void pump()
    },
    [pump],
  )

  useEffect(() => {
    setCount(0)
    setThumbs({})
    setError(null)
    if (!file) return
    const st = { doc: null, queue: [], asked: new Set<number>(), busy: false, alive: true } as typeof state.current
    state.current = st
    void (async () => {
      try {
        const doc = await openPdf(await file.arrayBuffer())
        if (!st.alive) return void closePdf(doc)
        st.doc = doc
        setCount(doc.numPages)
        void pump()
      } catch (e) {
        if (st.alive) setError(errorMessage(e))
      }
    })()
    return () => {
      st.alive = false
      if (st.doc) void closePdf(st.doc)
      st.doc = null
    }
  }, [file, pump])
  return { count, thumbs, request, error }
}

/** La miniatura de una página: un espacio en blanco hasta que se acerca a la pantalla. */
function LazyThumb({ page, src, request, style }: { page: number; src: string | undefined; request: (i: number) => void; style?: CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (src) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return request(page)
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        request(page)
        io.disconnect()
      }
    }, { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [src, page, request])
  return src ? <img src={src} alt="" draggable={false} style={style} data-page={page + 1} /> : <span ref={ref} className="thumb-blank thumb-pending" aria-hidden="true" />
}

type SplitMode = 'range' | 'groups' | 'every' | 'bookmarks' | 'size' | 'each'
type SheetItem = { id: number; sheet: Sheet }
const sheetsOf = (count: number): SheetItem[] => Array.from({ length: count }, (_, i) => ({ id: ++nextId, sheet: i }))
/** Grados de 0 a 359 (las rotaciones a la izquierda suman negativos). */
const norm = (deg: number) => ((deg % 360) + 360) % 360
/** Nombre de cada parte al dividir: "informe-4-8.pdf". */
/** Colores rápidos del número de página (W-147.6); el selector permite cualquier otro. */
const NUMBER_COLORS = ['#555555', '#000000', '#1E3A8A', '#2563EB', '#B91C1C', '#047857']
const partName = (name: string, group: number[]) => `${name}-${group[0] + 1}${group.length > 1 ? `-${group[group.length - 1] + 1}` : ''}.pdf`

export function SingleFileTool({ toolId }: { toolId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const { count, thumbs, request, error: loadError } = useThumbs(file)
  const trackName = { dividir: 'split', rotar: 'rotate', reordenar: 'reorder_pages', numerar: 'number_pages', marca: 'watermark' }[toolId] ?? toolId
  const { busy, error, run } = useRun(trackName)

  // Estado por herramienta
  const [splitMode, setSplitMode] = useState<SplitMode>('range')
  const [range, setRange] = useState('')
  const [groupsText, setGroupsText] = useState('')
  const [every, setEvery] = useState(2)
  /** Dividir por marcadores: los grupos de páginas de cada capítulo (null mientras se leen). */
  const [chapters, setChapters] = useState<BookmarkGroup[] | null>(null)
  /** Dividir por tamaño: máximo de cada parte, en MB. */
  const [maxMb, setMaxMb] = useState(10)
  const [sizeProgress, setSizeProgress] = useState<string | null>(null)
  const [color, setColor] = useState(DEFAULT_NUMBER_OPTIONS.color)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rotations, setRotations] = useState<number[]>([])
  const [order, setOrder] = useState<SheetItem[]>([])
  const [position, setPosition] = useState<NumberPosition>(DEFAULT_NUMBER_OPTIONS.position)
  const [template, setTemplate] = useState(DEFAULT_NUMBER_OPTIONS.template)
  const [start, setStart] = useState(1)
  const [skip, setSkip] = useState(0)
  const [size, setSize] = useState<'9' | '11' | '14'>('11')
  const [wm, setWm] = useState<WatermarkUi>(() => watermarkUiDefault(tr('out.watermarkDefault')))
  /** Resultado listo para ver y guardar (ya no se descarga solo). */
  const [output, setOutput] = useState<File | null>(null)
  /** Dividir en varios archivos: los PDF de cada parte y el ZIP para guardarlos. */
  const [parts, setParts] = useState<{ files: File[]; zip: File | null; oversize?: number[] } | null>(null)

  const withThumbs = toolId === 'dividir' || toolId === 'rotar' || toolId === 'reordenar'
  useEffect(() => {
    setSelected(new Set())
    setRange('')
    setGroupsText('')
  }, [file])
  // Cualquier cambio de archivo u opciones invalida el resultado anterior.
  useEffect(() => {
    setOutput(null)
    setParts(null)
  }, [file, splitMode, range, groupsText, every, maxMb, selected, rotations, order, position, template, start, skip, size, color, wm])
  // Los capítulos del PDF, al elegir dividir por marcadores.
  useEffect(() => {
    setChapters(null)
    if (!file || toolId !== 'dividir' || splitMode !== 'bookmarks') return
    let alive = true
    void file
      .arrayBuffer()
      .then(topBookmarks)
      .then(({ count: n, marks }) => alive && setChapters(bookmarkGroups(n, marks)), () => alive && setChapters([]))
    return () => {
      alive = false
    }
  }, [file, toolId, splitMode])
  useEffect(() => {
    setRotations(Array(count).fill(0))
    setOrder(sheetsOf(count))
  }, [count])
  const sort = useSortable(order.length, (from, to) => setOrder((o) => moveItem(o, from, to)))

  const name = file ? baseName(file.name) : ''
  const bytes = () => file!.arrayBuffer()

  const ranges = range.trim() ? parsePageRanges(range, count) : null
  const pagesFromSelection = [...selected].sort((a, b) => a - b)
  const groups = splitMode === 'groups' ? (groupsText.trim() ? parseRangeGroups(groupsText, count) : null) : splitMode === 'every' ? chunkPages(count, every) : null

  const wmPages = wm.pages.trim() ? parsePageRanges(wm.pages, count) : undefined
  const wmPagesInvalid = wmPages === null

  const splitInto = async (list: number[][]) => {
    const files = (await splitGroups(await bytes(), list)).map((d, i) => resultFile(d, partName(name, list[i]), PDF_TYPE))
    setParts({ files, zip: await bundleFiles(files, `${name}-${tr('file.pages')}.zip`) })
  }

  let action: { label: string; disabled: boolean; go: () => Promise<void> } = { label: '', disabled: true, go: async () => {} }
  if (toolId === 'dividir') {
    if (splitMode === 'each')
      action = {
        label: tr('single.splitEach', { n: count }),
        disabled: count < 2,
        go: async () => {
          const files = (await splitEach(await bytes())).map((d, i) => resultFile(d, `${name}-${tr('file.page')}-${i + 1}.pdf`, PDF_TYPE))
          setParts({ files, zip: await bundleFiles(files, `${name}-${tr('file.pages')}.zip`) })
        },
      }
    else if (splitMode === 'bookmarks')
      action = {
        label: tr('single.splitFiles', { n: chapters?.length ?? 0 }),
        disabled: !chapters || chapters.length < 2,
        go: async () => {
          const list = chapters!
          const data = await splitGroups(await bytes(), list.map((c) => c.pages))
          const files = data.map((d, i) => {
            const title = list[i].title ? fileSafe(list[i].title!) : ''
            return resultFile(d, `${name}-${String(i + 1).padStart(2, '0')}${title ? '-' + title : ''}.pdf`, PDF_TYPE)
          })
          setParts({ files, zip: await bundleFiles(files, `${name}-${tr('file.chapters')}.zip`) })
        },
      }
    else if (splitMode === 'size')
      action = {
        label: tr('single.splitSize', { n: maxMb }),
        disabled: !count || !(maxMb > 0),
        go: async () => {
          setSizeProgress(tr('single.sizeProgress', { n: 0, total: count }))
          try {
            const r = await splitBySize(await bytes(), Math.round(maxMb * 1024 * 1024), (done, total) => setSizeProgress(tr('single.sizeProgress', { n: done, total })))
            const files = r.files.map((d, i) => resultFile(d, partName(name, r.groups[i]), PDF_TYPE))
            setParts({ files, zip: await bundleFiles(files, `${name}-${tr('file.pages')}.zip`), oversize: r.oversize.map((i) => r.groups[i][0] + 1) })
          } finally {
            setSizeProgress(null)
          }
        },
      }
    else if (splitMode === 'groups' || splitMode === 'every')
      action = {
        label: tr('single.splitFiles', { n: groups?.length ?? 0 }),
        disabled: !groups || groups.length < (splitMode === 'every' ? 2 : 1),
        go: () => splitInto(groups!),
      }
    else
      action = {
        label: tr('single.extract'),
        disabled: !(ranges ?? pagesFromSelection).length,
        go: async () => setOutput(resultFile(await extractPages(await bytes(), ranges ?? pagesFromSelection), `${name}-${tr('file.extract')}.pdf`, PDF_TYPE)),
      }
  } else if (toolId === 'rotar') {
    const changed = rotations.some((r) => norm(r) !== 0)
    action = {
      label: tr('single.rotate'),
      disabled: !changed,
      go: async () => {
        let data: ArrayBuffer | Uint8Array = await bytes()
        for (const angle of [90, 180, 270] as const) {
          const idx = rotations.map((r, i) => (norm(r) === angle ? i : -1)).filter((i) => i >= 0)
          if (idx.length) data = await rotate(toArrayBuffer(data), idx, angle)
        }
        setOutput(resultFile(data as Uint8Array, `${name}-${tr('file.rotated')}.pdf`, PDF_TYPE))
      },
    }
  } else if (toolId === 'reordenar') {
    const same = order.length === count && order.every((o, i) => o.sheet === i)
    action = {
      label: tr('single.reorder'),
      disabled: same || order.length === 0,
      go: async () => setOutput(resultFile(await composePages(await bytes(), order.map((o) => o.sheet)), `${name}-${tr('file.reordered')}.pdf`, PDF_TYPE)),
    }
  } else if (toolId === 'numerar') {
    action = {
      label: tr('single.number'),
      disabled: !count || !template.trim(),
      go: async () =>
        setOutput(resultFile(await numberPages(await bytes(), { position, template, start, skip, size: Number(size), color }), `${name}-${tr('file.numbered')}.pdf`, PDF_TYPE)),
    }
  } else if (toolId === 'marca') {
    action = {
      label: tr('single.watermark'),
      disabled: !count || !watermarkReady(wm) || wmPagesInvalid,
      go: async () => setOutput(resultFile(await watermarkPdf(await bytes(), await toWatermarkOptions(wm, wmPages ?? undefined)), `${name}-${tr('file.watermark')}.pdf`, PDF_TYPE)),
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  // Miniaturas y campo de páginas van juntos: tocar una miniatura escribe el rango ("2-3, 5") y
  // escribir un rango marca sus miniaturas.
  const toggle = (i: number) => {
    const n = new Set(selected)
    if (n.has(i)) n.delete(i)
    else n.add(i)
    setSelected(n)
    setRange(formatPageRanges([...n]))
  }
  const typeRange = (text: string) => {
    setRange(text)
    setSelected(new Set(parsePageRanges(text, count) ?? []))
  }
  const turn = (pageIdx: number, by: number) => setRotations((r) => r.map((v, i) => (i === pageIdx ? v + by : v)))
  const templates = ['{n}', '{n} / {total}', tr('number.tplPage')]

  return (
    <div className="card stack">
      <ul className="file-list" style={{ marginTop: 0 }}>
        <FileRow
          file={file}
          extra={count ? pagesLabel(count) : tr('single.reading')}
          actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>{tr('common.change')}</button>}
        />
      </ul>

      {/* Numerar y marca de agua no tienen miniaturas: se ve el documento y el resultado al lado. */}
      {!withThumbs && (
        <BeforeAfter
          original={file}
          result={output}
          toolName={trackName}
          title={title(toolId)}
          previewTitle={tr('common.previewPdf')}
          placeholder={busy ? tr('common.processing') : tr('common.chooseApply')}
        />
      )}

      {toolId === 'dividir' && (
        <>
          <Segmented
            label={tr('single.splitMode')}
            value={splitMode}
            onChange={setSplitMode}
            options={[
              { value: 'range', label: tr('single.splitPick') },
              { value: 'groups', label: tr('single.splitGroupsOpt') },
              { value: 'every', label: tr('single.splitEveryOpt') },
              { value: 'bookmarks', label: tr('single.splitBookmarksOpt') },
              { value: 'size', label: tr('single.splitSizeOpt') },
              { value: 'each', label: tr('single.splitEachOpt') },
            ]}
          />
          {splitMode === 'range' && (
            <label className="field">
              <span>{tr('single.rangeLabel')}</span>
              <input className="input" value={range} placeholder="1-3, 5, 8-" onChange={(e) => typeRange(e.target.value)} />
              {range.trim() && !ranges && <small style={{ color: 'var(--danger)' }}>{tr('single.rangeBad', { n: count })}</small>}
            </label>
          )}
          {splitMode === 'groups' && (
            <label className="field">
              <span>{tr('single.groupsLabel')}</span>
              <input className="input" value={groupsText} placeholder="1-3, 4-8, 9-" onChange={(e) => setGroupsText(e.target.value)} />
              {groupsText.trim() && !groups ? (
                <small style={{ color: 'var(--danger)' }}>{tr('single.rangeBad', { n: count })}</small>
              ) : (
                groups && <small className="faint">{tr('single.groupsHint', { n: groups.length })}</small>
              )}
            </label>
          )}
          {splitMode === 'every' && (
            <label className="field">
              <span>{tr('single.everyLabel')}</span>
              <input className="input" type="number" inputMode="numeric" min={1} max={Math.max(1, count)} value={every} onChange={(e) => setEvery(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
              {groups && <small className="faint">{tr('single.groupsHint', { n: groups.length })}</small>}
            </label>
          )}
          {splitMode === 'bookmarks' &&
            (chapters === null ? (
              <p className="faint">{tr('single.reading')}</p>
            ) : chapters.length < 2 ? (
              <Notice kind="plain">{tr('single.noBookmarks')}</Notice>
            ) : (
              <ol className="chapter-list" aria-label={tr('single.chapters')}>
                {chapters.map((c, i) => (
                  <li key={i}>
                    <b>{c.title || tr('single.beforeFirst')}</b>
                    <small className="faint">{c.pages.length > 1 ? tr('single.pagesRange', { a: c.pages[0] + 1, b: c.pages[c.pages.length - 1] + 1 }) : tr('single.pageShort', { n: c.pages[0] + 1 })}</small>
                  </li>
                ))}
              </ol>
            ))}
          {splitMode === 'size' && (
            <label className="field" style={{ maxWidth: 260 }}>
              <span>{tr('single.maxSize')}</span>
              <input className="input" type="number" inputMode="decimal" min={0.1} step={0.5} value={maxMb} onChange={(e) => setMaxMb(Math.max(0, Number(e.target.value) || 0))} />
              <small className="faint">{sizeProgress ?? tr('single.maxSizeHint', { size: file ? (file.size / 1024 / 1024).toFixed(1) : '0' })}</small>
            </label>
          )}
        </>
      )}

      {toolId === 'numerar' && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="number-options">
            <div className="field">
              <span id="number-pos-label">{tr('single.position')}</span>
              <div className="pos-grid" role="radiogroup" aria-labelledby="number-pos-label">
                {NUMBER_POSITIONS.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={position === p} aria-label={tr(`number.pos.${p}` as MessageKey)} title={tr(`number.pos.${p}` as MessageKey)} className={'pos-cell pos-' + p} onClick={() => setPosition(p)}>
                    <span aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="stack" style={{ gap: 10, flex: 1 }}>
              <Segmented label={tr('single.format')} value={template} onChange={setTemplate} options={templates.map((v) => ({ value: v, label: v.replace('{n}', '1').replace('{total}', '10') }))} />
              <label className="field">
                <span>{tr('number.text')}</span>
                <input className="input" value={template} maxLength={60} onChange={(e) => setTemplate(e.target.value)} aria-describedby="number-text-hint" />
                <small className="faint" id="number-text-hint">{tr('number.textHint')}</small>
              </label>
            </div>
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <label className="field" style={{ width: 130 }}>
              <span>{tr('number.start')}</span>
              <input className="input" type="number" inputMode="numeric" min={0} value={start} onChange={(e) => setStart(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
            </label>
            <label className="field" style={{ width: 210 }}>
              <span>{tr('number.skip')}</span>
              <input className="input" type="number" inputMode="numeric" min={0} max={Math.max(0, count - 1)} value={skip} onChange={(e) => setSkip(Math.max(0, Math.floor(Number(e.target.value) || 0)))} aria-describedby="number-skip-hint" />
              <small className="faint" id="number-skip-hint">{tr('number.skipHint')}</small>
            </label>
            <div className="field">
              <span aria-hidden="true">{tr('number.size')}</span>
              <Segmented label={tr('number.size')} value={size} onChange={setSize} options={[{ value: '9', label: tr('number.size.s') }, { value: '11', label: tr('number.size.m') }, { value: '14', label: tr('number.size.l') }]} />
            </div>
            <div className="field">
              <span id="number-color-label">{tr('number.color')}</span>
              <div className="row" style={{ gap: 6 }} role="group" aria-labelledby="number-color-label">
                {NUMBER_COLORS.map((c) => (
                  <button key={c} type="button" className="swatch" style={{ background: c }} aria-label={tr(`number.color.${c.slice(1)}` as MessageKey)} aria-pressed={color.toLowerCase() === c.toLowerCase()} onClick={() => setColor(c)} />
                ))}
                <input type="color" className="swatch-input" value={color} aria-label={tr('number.colorOther')} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {toolId === 'marca' && <WatermarkOptionsPanel value={wm} onChange={setWm} pagesInvalid={wmPagesInvalid} />}

      {loadError && <Notice kind="error">{loadError}</Notice>}

      {toolId === 'reordenar' && count > 0 && <small className="faint">{tr('single.reorderHint')}</small>}

      {(toolId === 'dividir' && splitMode === 'range') || toolId === 'rotar' ? (
        <div className="thumbs">
          {Array.from({ length: count }, (_, pageIdx) =>
            toolId === 'dividir' ? (
              <button key={pageIdx} type="button" className="thumb" aria-pressed={selected.has(pageIdx)} aria-label={tr('single.pageAlt', { n: pageIdx + 1 })} onClick={() => toggle(pageIdx)}>
                <LazyThumb page={pageIdx} src={thumbs[pageIdx]} request={request} />
                <span aria-hidden="true">{pageIdx + 1}</span>
              </button>
            ) : (
              <div key={pageIdx} className="thumb">
                <button type="button" className="thumb-hit" onClick={() => turn(pageIdx, 90)} aria-label={tr('single.rotatePage', { n: pageIdx + 1 })}>
                  <LazyThumb page={pageIdx} src={thumbs[pageIdx]} request={request} style={{ transform: `rotate(${rotations[pageIdx] ?? 0}deg) scale(${norm(rotations[pageIdx] ?? 0) % 180 ? 0.72 : 1})` }} />
                </button>
                <span>{pageIdx + 1} · {norm(rotations[pageIdx] ?? 0)}°</span>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn flip-x" aria-label={tr('single.rotateLeft', { n: pageIdx + 1 })} onClick={() => turn(pageIdx, -90)}><Icon name="rotate" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.rotateRight', { n: pageIdx + 1 })} onClick={() => turn(pageIdx, 90)}><Icon name="rotate" /></button>
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}

      {toolId === 'reordenar' && count > 0 && (
        <div className={'thumbs sortable' + (sort.dragging ? ' is-sorting' : '')}>
          {order.map(({ id, sheet }, pos) => {
            const label = sheet === 'blank' ? tr('single.blankPage') : tr('single.pageShort', { n: sheet + 1 })
            return (
              <div key={id} className="thumb" {...sort.item(pos)}>
                <button type="button" className="drag-handle thumb-drag" aria-label={tr('single.dragPage', { name: label })} title={tr('single.dragPage', { name: label })} {...sort.handle(pos)}>
                  {sheet === 'blank' ? <span className="thumb-blank" aria-hidden="true" /> : <LazyThumb page={sheet} src={thumbs[sheet]} request={request} />}
                  <span className="thumb-grip" aria-hidden="true"><Icon name="grip" /></span>
                </button>
                <span>{label}</span>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn" aria-label={tr('single.moveBefore')} disabled={pos === 0} onClick={() => setOrder((o) => moveItem(o, pos, pos - 1))}><Icon name="back" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.moveAfter')} disabled={pos === order.length - 1} onClick={() => setOrder((o) => moveItem(o, pos, pos + 1))} style={{ transform: 'scaleX(-1)' }}><Icon name="back" /></button>
                </div>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn" aria-label={tr('single.duplicatePage', { name: label })} title={tr('single.duplicatePage', { name: label })} onClick={() => setOrder((o) => [...o.slice(0, pos + 1), { id: ++nextId, sheet }, ...o.slice(pos + 1)])}><Icon name="copy" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.addBlank', { name: label })} title={tr('single.addBlank', { name: label })} onClick={() => setOrder((o) => [...o.slice(0, pos + 1), { id: ++nextId, sheet: 'blank' }, ...o.slice(pos + 1)])}><Icon name="plus" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.removePage')} disabled={order.length === 1} onClick={() => setOrder((o) => o.filter((x) => x.id !== id))}><Icon name="trash" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toolId === 'rotar' && count > 0 && (
        <div className="row">
          <span className="faint">{tr('single.tapRotate')}</span>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setRotations((r) => r.map((v) => v - 90))}>
            <span className="flip-x" style={{ display: 'inline-flex' }}><Icon name="rotate" /></span> {tr('single.rotateAllLeft')}
          </button>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setRotations((r) => r.map((v) => v + 90))}>
            <Icon name="rotate" /> {tr('single.rotateAll')}
          </button>
        </div>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={action.disabled} onClick={() => run(action.go, tr('common.doneReview'))} icon="check">
          {action.label}
        </BusyButton>
      </div>
      {withThumbs && output && <BeforeAfter original={file} result={output} toolName={trackName} title={title(toolId)} />}
      {parts && (
        <BeforeAfter
          original={file}
          result={null}
          results={parts.files}
          saveAs={parts.zip}
          toolName={trackName}
          title={tr('single.partsTitle')}
          summary={
            <>
              <Notice kind="success">{tr(splitMode === 'each' ? 'single.partsSummary' : 'single.partsSummaryGroups', { n: parts.files.length })}</Notice>
              {!!parts.oversize?.length && <Notice kind="plain">{tr('single.oversize', { pages: parts.oversize.join(', ') })}</Notice>}
            </>
          }
        />
      )}
    </div>
  )
}

function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}
