import { useEffect, useState, type ComponentType } from 'react'
import { go, useApp } from '../state'
import { Icon, type IconName } from '../components/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Segmented, errorMessage } from '../components/ui'
import { baseName, parsePageRanges } from '../lib/files'
import { closePdf, openPdf, renderPage } from '../lib/pdf'
import { extractPages, merge, numberPages, rotate, splitEach, watermark } from '../lib/pdfTools'
import { track } from '../../shared/analytics'
import { CompressTool, ProtectTool, RepairTool, UnlockTool } from './PdfSecurityTools'
import { OcrTool } from './OcrTool'
import { CropTool } from './CropTool'
import { SignTool } from './SignTool'
import { RedactTool } from './RedactTool'
import { CompareTool } from './CompareTool'
import { ExtractImagesTool } from './ExtractImagesTool'
import { EditTool } from './EditTool'
import { FormTool } from './FormTool'
import { ScanTool } from './ScanTool'
import { PdfATool } from './PdfATool'
import { tr } from '../i18n/translate'
import type { MessageKey } from '../i18n/messages/es'

/** Nombre y descripción de cada herramienta, en el idioma de la página. */
export const toolName = (id: string) => tr(`tool.${id}` as MessageKey)
export const toolDesc = (id: string) => tr(`tool.${id}.desc` as MessageKey)
import { BeforeAfter } from '../components/DocPreview'
import { bundleFiles, resultFile } from '../lib/share'

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
          {Own ? <Own /> : <SingleFileTool toolId={tool.id} />}
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

export function MergeTool() {
  const [files, setFiles] = useState<File[]>([])
  const { busy, error, run } = useRun('merge')
  const [output, setOutput] = useState<File | null>(null)
  // Agregar, quitar u ordenar los PDF invalida el resultado anterior.
  useEffect(() => setOutput(null), [files])
  const move = (i: number, j: number) =>
    setFiles((p) => {
      const c = p.slice()
      ;[c[i], c[j]] = [c[j], c[i]]
      return c
    })
  return (
    <div className="card stack">
      <DropZone accept="application/pdf" multiple title={tr('merge.pick')} hint={tr('merge.pickHint')} onFiles={(f) => setFiles((p) => [...p, ...f])} />
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <FileRow
              key={f.name + i}
              file={f}
              extra={`#${i + 1}`}
              actions={
                <>
                  <button type="button" className="icon-btn" aria-label={tr('merge.up')} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('merge.down')} disabled={i === files.length - 1} onClick={() => move(i, i + 1)}><Icon name="downArrow" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}><Icon name="close" /></button>
                </>
              }
            />
          ))}
        </ul>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton
          busy={busy}
          disabled={files.length < 2}
          icon="merge"
          onClick={() =>
            run(async () => {
              const out = await merge(await Promise.all(files.map((f) => f.arrayBuffer())))
              setOutput(resultFile(out, `${baseName(files[0].name)}-unido.pdf`, PDF_TYPE))
            }, tr('common.doneReview'))
          }
        >
          {files.length < 2 ? tr('merge.needTwo') : tr('merge.go', { n: files.length })}
        </BusyButton>
      </div>
      {files.length > 0 && (
        <BeforeAfter
          originals={files}
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

/** Miniaturas de todas las páginas, renderizadas una vez por archivo. */
function useThumbs(file: File | null) {
  const [thumbs, setThumbs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setThumbs([])
    setError(null)
    if (!file) return
    let cancelled = false
    void (async () => {
      try {
        const doc = await openPdf(await file.arrayBuffer())
        const urls: string[] = []
        for (let i = 1; i <= doc.numPages && !cancelled; i++) {
          const canvas = await renderPage(doc, i, 220, 'print')
          urls.push(canvas.toDataURL('image/jpeg', 0.75))
          if (!cancelled) setThumbs(urls.slice())
        }
        await closePdf(doc)
      } catch (e) {
        if (!cancelled) setError(errorMessage(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file])
  return { thumbs, error }
}

export function SingleFileTool({ toolId }: { toolId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const { thumbs, error: loadError } = useThumbs(file)
  const trackName = { dividir: 'split', rotar: 'rotate', reordenar: 'reorder_pages', numerar: 'number_pages', marca: 'watermark' }[toolId] ?? toolId
  const { busy, error, run } = useRun(trackName)

  // Estado por herramienta
  const [splitMode, setSplitMode] = useState<'range' | 'each'>('range')
  const [range, setRange] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rotations, setRotations] = useState<number[]>([])
  const [order, setOrder] = useState<number[]>([])
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right'>('bottom-center')
  const [format, setFormat] = useState<'n' | 'n-of-total'>('n')
  const [mark, setMark] = useState('CONFIDENCIAL')
  /** Resultado listo para ver y guardar (ya no se descarga solo). */
  const [output, setOutput] = useState<File | null>(null)
  /** Dividir "cada página por separado": los PDF de cada página y el ZIP para guardarlos. */
  const [parts, setParts] = useState<{ files: File[]; zip: File | null } | null>(null)

  const count = thumbs.length
  const withThumbs = toolId === 'dividir' || toolId === 'rotar' || toolId === 'reordenar'
  useEffect(() => {
    setSelected(new Set())
    setRange('')
  }, [file])
  // Cualquier cambio de archivo u opciones invalida el resultado anterior.
  useEffect(() => {
    setOutput(null)
    setParts(null)
  }, [file, splitMode, range, selected, rotations, order, position, format, mark])
  useEffect(() => {
    setRotations(Array(count).fill(0))
    setOrder([...Array(count).keys()])
  }, [count])

  const name = file ? baseName(file.name) : ''
  const bytes = () => file!.arrayBuffer()

  const ranges = range.trim() ? parsePageRanges(range, count) : null
  const pagesFromSelection = [...selected].sort((a, b) => a - b)

  let action: { label: string; disabled: boolean; go: () => Promise<void> } = { label: '', disabled: true, go: async () => {} }
  if (toolId === 'dividir') {
    action =
      splitMode === 'each'
        ? {
            label: tr('single.splitEach', { n: count }),
            disabled: count < 2,
            go: async () => {
              const files = (await splitEach(await bytes())).map((d, i) => resultFile(d, `${name}-pagina-${i + 1}.pdf`, PDF_TYPE))
              setParts({ files, zip: await bundleFiles(files, `${name}-paginas.zip`) })
            },
          }
        : {
            label: tr('single.extract'),
            disabled: !(ranges ?? pagesFromSelection).length,
            go: async () => setOutput(resultFile(await extractPages(await bytes(), ranges ?? pagesFromSelection), `${name}-extracto.pdf`, PDF_TYPE)),
          }
  } else if (toolId === 'rotar') {
    const changed = rotations.some((r) => r % 360 !== 0)
    action = {
      label: tr('single.rotate'),
      disabled: !changed,
      go: async () => {
        let data: ArrayBuffer | Uint8Array = await bytes()
        for (const angle of [90, 180, 270] as const) {
          const idx = rotations.map((r, i) => ((r % 360) === angle ? i : -1)).filter((i) => i >= 0)
          if (idx.length) data = await rotate(toArrayBuffer(data), idx, angle)
        }
        setOutput(resultFile(data as Uint8Array, `${name}-rotado.pdf`, PDF_TYPE))
      },
    }
  } else if (toolId === 'reordenar') {
    const same = order.length === count && order.every((p, i) => p === i)
    action = {
      label: tr('single.reorder'),
      disabled: same || order.length === 0,
      go: async () => setOutput(resultFile(await extractPages(await bytes(), order), `${name}-reordenado.pdf`, PDF_TYPE)),
    }
  } else if (toolId === 'numerar') {
    action = {
      label: tr('single.number'),
      disabled: !count,
      go: async () => setOutput(resultFile(await numberPages(await bytes(), { position, format }), `${name}-numerado.pdf`, PDF_TYPE)),
    }
  } else if (toolId === 'marca') {
    action = {
      label: tr('single.watermark'),
      disabled: !count || !mark.trim(),
      go: async () => setOutput(resultFile(await watermark(await bytes(), mark), `${name}-marca.pdf`, PDF_TYPE)),
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const toggle = (i: number) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })

  return (
    <div className="card stack">
      <ul className="file-list" style={{ marginTop: 0 }}>
        <FileRow
          file={file}
          extra={count ? tr('single.pagesN', { n: count }) : tr('single.reading')}
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
          <Segmented label={tr('single.splitMode')} value={splitMode} onChange={setSplitMode} options={[{ value: 'range', label: tr('single.splitPick') }, { value: 'each', label: tr('single.splitEachOpt') }]} />
          {splitMode === 'range' && (
            <label className="field">
              <span>{tr('single.rangeLabel')}</span>
              <input className="input" value={range} placeholder="1-3, 5, 8-" onChange={(e) => setRange(e.target.value)} />
              {range.trim() && !ranges && <small style={{ color: 'var(--danger)' }}>{tr('single.rangeBad', { n: count })}</small>}
            </label>
          )}
        </>
      )}

      {toolId === 'numerar' && (
        <div className="row">
          <Segmented label={tr('single.position')} value={position} onChange={setPosition} options={[{ value: 'bottom-center', label: tr('single.center') }, { value: 'bottom-right', label: tr('single.right') }]} />
          <Segmented label={tr('single.format')} value={format} onChange={setFormat} options={[{ value: 'n', label: '1, 2, 3' }, { value: 'n-of-total', label: '1 / 10' }]} />
        </div>
      )}

      {toolId === 'marca' && (
        <label className="field">
          <span>{tr('single.markText')}</span>
          <input className="input" value={mark} maxLength={40} onChange={(e) => setMark(e.target.value)} />
        </label>
      )}

      {loadError && <Notice kind="error">{loadError}</Notice>}

      {(toolId === 'dividir' && splitMode === 'range') || toolId === 'rotar' || toolId === 'reordenar' ? (
        <div className="thumbs">
          {(toolId === 'reordenar' ? order : thumbs.map((_, i) => i)).map((pageIdx, pos) => {
            const src = thumbs[pageIdx]
            if (!src) return null
            if (toolId === 'dividir')
              return (
                <button key={pageIdx} type="button" className="thumb" aria-pressed={selected.has(pageIdx)} onClick={() => { setRange(''); toggle(pageIdx) }}>
                  <img src={src} alt={tr('single.pageAlt', { n: pageIdx + 1 })} />
                  <span>{pageIdx + 1}</span>
                </button>
              )
            if (toolId === 'rotar')
              return (
                <button key={pageIdx} type="button" className="thumb" onClick={() => setRotations((r) => r.map((v, i) => (i === pageIdx ? v + 90 : v)))} aria-label={tr('single.rotatePage', { n: pageIdx + 1 })}>
                  <img src={src} alt="" style={{ transform: `rotate(${rotations[pageIdx] ?? 0}deg) scale(${(rotations[pageIdx] ?? 0) % 180 ? 0.72 : 1})` }} />
                  <span>{pageIdx + 1} · {(rotations[pageIdx] ?? 0) % 360}°</span>
                </button>
              )
            return (
              <div key={pageIdx} className="thumb">
                <img src={src} alt={tr('single.pageAlt', { n: pageIdx + 1 })} />
                <span>{tr('single.pageShort', { n: pageIdx + 1 })}</span>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn" aria-label={tr('single.moveBefore')} disabled={pos === 0} onClick={() => setOrder((o) => swap(o, pos, pos - 1))}><Icon name="back" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.removePage')} disabled={order.length === 1} onClick={() => setOrder((o) => o.filter((_, j) => j !== pos))}><Icon name="trash" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.moveAfter')} disabled={pos === order.length - 1} onClick={() => setOrder((o) => swap(o, pos, pos + 1))} style={{ transform: 'scaleX(-1)' }}><Icon name="back" /></button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {toolId === 'rotar' && count > 0 && (
        <div className="row">
          <span className="faint">{tr('single.tapRotate')}</span>
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
          summary={<Notice kind="success">{tr('single.partsSummary', { n: parts.files.length })}</Notice>}
        />
      )}
    </div>
  )
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const c = arr.slice()
  ;[c[a], c[b]] = [c[b], c[a]]
  return c
}

function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}
