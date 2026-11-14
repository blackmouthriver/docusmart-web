// Recortar PDF: el usuario ajusta un rectángulo sobre la vista previa de una página.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, Segmented, errorMessage } from '../components/ui'
import { baseName, download } from '../lib/files'
import { closePdf, openPdf, renderPage } from '../lib/pdf'
import { MIN_KEEP, NO_MARGINS, cropPdf, detectContentMargins, isNoCrop, ptToMm, type Margins } from '../lib/pdfCrop'
import { track } from '../../shared/analytics'

type Edge = 'top' | 'right' | 'bottom' | 'left'
type Handle = Edge | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'move'

const PREVIEW_WIDTH = 900
const STEP = 0.01

export function CropTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [pageNo, setPageNo] = useState(1)
  const [preview, setPreview] = useState<{ url: string; widthPt: number; heightPt: number } | null>(null)
  const [margins, setMargins] = useState<Margins>(NO_MARGINS)
  const [scope, setScope] = useState<'all' | 'this'>('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Abrir el PDF (y cerrarlo al cambiar de archivo o salir).
  useEffect(() => {
    setDoc(null)
    setPreview(null)
    setPageNo(1)
    setMargins(NO_MARGINS)
    setError(null)
    if (!file) return
    let cancelled = false
    let opened: PDFDocumentProxy | null = null
    void (async () => {
      try {
        opened = await openPdf(await file.arrayBuffer())
        if (cancelled) await closePdf(opened)
        else setDoc(opened)
      } catch (e) {
        if (!cancelled) setError(/password/i.test(String(e)) ? 'Este PDF tiene contraseña. Quítala primero con "Desbloquear PDF".' : errorMessage(e))
      }
    })()
    return () => {
      cancelled = true
      if (opened) void closePdf(opened)
    }
  }, [file])

  // Dibujar la página de la vista previa.
  useEffect(() => {
    if (!doc) return
    let cancelled = false
    void (async () => {
      const page = await doc.getPage(pageNo)
      const vp = page.getViewport({ scale: 1 })
      const canvas = await renderPage(doc, pageNo, PREVIEW_WIDTH, 'print')
      if (cancelled) return
      canvasRef.current = canvas
      setPreview({ url: canvas.toDataURL('image/jpeg', 0.85), widthPt: vp.width, heightPt: vp.height })
    })().catch((e) => !cancelled && setError(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [doc, pageNo])

  const detect = () => {
    const c = canvasRef.current
    const ctx = c?.getContext('2d', { willReadFrequently: true })
    if (!c || !ctx) return
    const found = detectContentMargins(ctx.getImageData(0, 0, c.width, c.height))
    if (isNoCrop(found)) toast('No se encontraron márgenes en blanco en esta página.')
    setMargins(found)
  }

  const save = async () => {
    if (!file || !doc) return
    setBusy(true)
    setError(null)
    try {
      const out = await cropPdf(await file.arrayBuffer(), margins, scope === 'this' ? [pageNo - 1] : undefined)
      download(out, `${baseName(file.name)}-recortado.pdf`, 'application/pdf')
      track('pdf_tool_used', { tool_name: 'crop' })
      toast('Listo. El archivo se descargó.')
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
        <DropZone accept="application/pdf" title="Toca para seleccionar un PDF" hint="O arrástralo aquí" onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const pages = doc?.numPages ?? 0
  const keptW = preview ? ptToMm(preview.widthPt * (1 - margins.left - margins.right)) : 0
  const keptH = preview ? ptToMm(preview.heightPt * (1 - margins.top - margins.bottom)) : 0

  return (
    <div className="card stack">
      <ul className="file-list" style={{ marginTop: 0 }}>
        <FileRow
          file={file}
          extra={pages ? `${pages} ${pages === 1 ? 'página' : 'páginas'}` : 'Leyendo…'}
          actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>Cambiar</button>}
        />
      </ul>

      {preview ? (
        <>
          <p className="faint" style={{ margin: 0 }}>Arrastra los bordes o las esquinas del recuadro. Lo oscurecido se recorta.</p>
          <CropStage url={preview.url} margins={margins} onChange={setMargins} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            {pages > 1 ? (
              <div className="row" style={{ gap: 4 }}>
                <button type="button" className="icon-btn" aria-label="Página anterior" disabled={pageNo === 1} onClick={() => setPageNo((p) => p - 1)}><Icon name="back" /></button>
                <span className="faint">Página {pageNo} de {pages}</span>
                <button type="button" className="icon-btn" aria-label="Página siguiente" disabled={pageNo === pages} onClick={() => setPageNo((p) => p + 1)} style={{ transform: 'scaleX(-1)' }}><Icon name="back" /></button>
              </div>
            ) : <span />}
            <span className="faint">Queda: {keptW} × {keptH} mm</span>
          </div>
          <div className="row">
            <button type="button" className="btn btn-soft btn-sm" onClick={detect}><Icon name="compress" /> Quitar márgenes en blanco</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={isNoCrop(margins)} onClick={() => setMargins(NO_MARGINS)}><Icon name="reset" /> Restablecer</button>
          </div>
          {pages > 1 && (
            <div className="field">
              <span>Aplicar a</span>
              <Segmented label="Páginas a recortar" value={scope} onChange={setScope} options={[{ value: 'all', label: 'Todas las páginas' }, { value: 'this', label: `Solo la página ${pageNo}` }]} />
            </div>
          )}
        </>
      ) : (
        !error && <p className="faint">Preparando la vista previa…</p>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!preview || isNoCrop(margins)} onClick={save} icon="download">
          Recortar y descargar
        </BusyButton>
      </div>
    </div>
  )
}

/** Página con el recuadro de recorte encima; funciona con mouse, dedo y teclado. */
function CropStage({ url, margins, onChange }: { url: string; margins: Margins; onChange: (m: Margins) => void }) {
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
  const edgeLabel: Record<Edge, string> = { top: 'Borde superior', right: 'Borde derecho', bottom: 'Borde inferior', left: 'Borde izquierdo' }

  return (
    <div className="crop-frame">
      <div className="crop-stage" ref={stage}>
        <img src={url} alt="Vista previa de la página" draggable={false} />
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
