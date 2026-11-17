// Recortar PDF: el usuario ajusta un rectángulo sobre la vista previa de una página.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, Segmented, errorMessage } from '../components/ui'
import { baseName } from '../lib/files'
import { BeforeAfter } from '../components/DocPreview'
import { resultFile } from '../lib/share'
import { tr } from '../i18n/translate'
import { MIN_KEEP, NO_MARGINS, cropPdf, detectContentMargins, isNoCrop, ptToMm, type Margins } from '../lib/pdfCrop'
import { track } from '../../shared/analytics'
import { PageNav, usePdfPreview } from './PdfPreview'

type Edge = 'top' | 'right' | 'bottom' | 'left'
type Handle = Edge | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'move'

const STEP = 0.01

export function CropTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  /** Resultado listo para ver y guardar (ya no se descarga solo). */
  const [output, setOutput] = useState<File | null>(null)
  useEffect(() => setOutput(null), [file])
  const { pages, ready, pageNo, setPageNo, preview, canvas, error, setError } = usePdfPreview(file)
  const [margins, setMargins] = useState<Margins>(NO_MARGINS)
  const [scope, setScope] = useState<'all' | 'this'>('all')
  const [busy, setBusy] = useState(false)

  // Cada archivo empieza sin recorte.
  useEffect(() => setMargins(NO_MARGINS), [file])

  const detect = () => {
    const c = canvas.current
    const ctx = c?.getContext('2d', { willReadFrequently: true })
    if (!c || !ctx) return
    const found = detectContentMargins(ctx.getImageData(0, 0, c.width, c.height))
    if (isNoCrop(found)) toast(tr('crop.noMargins'))
    setMargins(found)
  }

  const save = async () => {
    if (!file || !ready) return
    setBusy(true)
    setError(null)
    try {
      const out = await cropPdf(await file.arrayBuffer(), margins, scope === 'this' ? [pageNo - 1] : undefined)
      setOutput(resultFile(out, `${baseName(file.name)}-${tr('file.cropped')}.pdf`, 'application/pdf'))
      track('pdf_tool_used', { tool_name: 'crop' })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_crop', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const keptW = preview ? ptToMm(preview.widthPt * (1 - margins.left - margins.right)) : 0
  const keptH = preview ? ptToMm(preview.heightPt * (1 - margins.top - margins.bottom)) : 0

  return (
    <div className="card stack">
      <ul className="file-list" style={{ marginTop: 0 }}>
        <FileRow
          file={file}
          extra={pages ? pages === 1 ? tr('common.onePage') : tr('common.pagesCount', { n: pages }) : tr('common.reading')}
          actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>{tr('common.change')}</button>}
        />
      </ul>

      {preview ? (
        <>
          <p className="faint" style={{ margin: 0 }}>{tr('crop.help')}</p>
          <CropStage url={preview.url} margins={margins} onChange={setMargins} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <PageNav pageNo={pageNo} pages={pages} onChange={setPageNo} />
            <span className="faint">{tr('crop.kept', { w: keptW, h: keptH })}</span>
          </div>
          <div className="row">
            <button type="button" className="btn btn-soft btn-sm" onClick={detect}><Icon name="compress" /> {tr('crop.trim')}</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={isNoCrop(margins)} onClick={() => setMargins(NO_MARGINS)}><Icon name="reset" /> {tr('crop.reset')}</button>
          </div>
          {pages > 1 && (
            <div className="field">
              <span>{tr('crop.applyTo')}</span>
              <Segmented label={tr('crop.scope')} value={scope} onChange={setScope} options={[{ value: 'all', label: tr('crop.allPages') }, { value: 'this', label: tr('crop.onlyPage', { n: pageNo }) }]} />
            </div>
          )}
        </>
      ) : (
        !error && <p className="faint">{tr('common.preparingPreview')}</p>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!preview || isNoCrop(margins)} onClick={save} icon="check">
          {tr('crop.go')}
        </BusyButton>
      </div>
      {file && output && (
        <>
          <BeforeAfter original={file} result={output} toolName="crop" title={tr('crop.title')} />
        </>
      )}
    </div>
  )
}

/** Página con el recuadro de recorte encima; funciona con mouse, dedo y teclado. */
export function CropStage({ url, margins, onChange }: { url: string; margins: Margins; onChange: (m: Margins) => void }) {
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<{ handle: Handle; x: number; y: number; start: Margins } | null>(null)

  const begin = (handle: Handle) => (e: PointerEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { handle, x: e.clientX, y: e.clientY, start: margins }
  }

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    const box = stage.current?.getBoundingClientRect()
    if (!d || !box) return
    const dx = (e.clientX - d.x) / box.width
    const dy = (e.clientY - d.y) / box.height
    onChange(applyDrag(d.handle, d.start, dx, dy))
  }

  const end = () => {
    drag.current = null
  }

  const keys = (edge: Edge) => (e: KeyboardEvent<HTMLElement>) => {
    const sign = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key]
    if (!sign) return
    e.preventDefault()
    // Las flechas mueven el borde en la dirección de la flecha.
    const inward = edge === 'top' || edge === 'left' ? sign : -sign
    onChange(setEdge(margins, edge, margins[edge] + inward * STEP * (e.shiftKey ? 5 : 1)))
  }

  const rect = {
    left: `${margins.left * 100}%`,
    top: `${margins.top * 100}%`,
    right: `${margins.right * 100}%`,
    bottom: `${margins.bottom * 100}%`,
  }
  const edgeLabel: Record<Edge, string> = { top: tr('crop.top'), right: tr('crop.right'), bottom: tr('crop.bottom'), left: tr('crop.left') }

  return (
    <div className="crop-frame">
      <div className="crop-stage" ref={stage}>
        <img src={url} alt={tr('crop.previewAlt')} draggable={false} />
        <div className="crop-rect" style={rect} onPointerDown={begin('move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
            <span
              key={edge}
              className={`crop-h crop-h-${edge}`}
              role="slider"
              tabIndex={0}
              aria-label={edgeLabel[edge]}
              aria-valuemin={0}
              aria-valuemax={95}
              aria-valuenow={Math.round(margins[edge] * 100)}
              aria-valuetext={`${Math.round(margins[edge] * 100)} % recortado`}
              onKeyDown={keys(edge)}
              onPointerDown={begin(edge)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
            />
          ))}
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => (
            <span key={corner} className={`crop-c crop-c-${corner}`} aria-hidden="true" onPointerDown={begin(corner)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Nuevos márgenes al arrastrar `handle` una distancia (dx, dy) en fracción de página. */
function applyDrag(handle: Handle, s: Margins, dx: number, dy: number): Margins {
  if (handle === 'move') {
    // Mover el recuadro entero sin cambiar su tamaño.
    const mx = Math.min(Math.max(dx, -s.left), s.right)
    const my = Math.min(Math.max(dy, -s.top), s.bottom)
    return { top: s.top + my, bottom: s.bottom - my, left: s.left + mx, right: s.right - mx }
  }
  let m = s
  if (handle.includes('top')) m = setEdge(m, 'top', s.top + dy)
  if (handle.includes('bottom')) m = setEdge(m, 'bottom', s.bottom - dy)
  if (handle.includes('left')) m = setEdge(m, 'left', s.left + dx)
  if (handle.includes('right')) m = setEdge(m, 'right', s.right - dx)
  return m
}

const OPPOSITE: Record<Edge, Edge> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

/** Mueve un solo borde, sin pasar del opuesto (siempre queda MIN_KEEP de página). */
function setEdge(m: Margins, edge: Edge, value: number): Margins {
  const max = 1 - MIN_KEEP - m[OPPOSITE[edge]]
  return { ...m, [edge]: Math.min(Math.max(value, 0), max) }
}
