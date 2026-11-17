// Firmar PDF: crear la firma (dibujarla, escribirla o subir una foto) y colocarla sobre las páginas.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import '@fontsource-variable/dancing-script'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, Segmented, errorMessage } from '../components/ui'
import { baseName } from '../lib/files'
import { BeforeAfter } from '../components/DocPreview'
import { resultFile } from '../lib/share'
import { tr } from '../i18n/translate'
import { canvasToBlob } from '../lib/pdf'
import { clampPlacement, defaultPlacement, opaqueBounds, removeLightBackground, signPdf, type Placement } from '../lib/pdfSign'
import { track } from '../../shared/analytics'
import { PageNav, usePdfPreview } from './PdfPreview'

type Signature = { url: string; png: Uint8Array; aspect: number }
type Mode = 'draw' | 'type' | 'image'

const INK = { negro: '#1C1B1A', azul: '#1D3FA8' } as const
type InkName = keyof typeof INK
const SCRIPT_FONT = '"Dancing Script Variable", cursive'

export function SignTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  /** Resultado listo para ver y guardar (ya no se descarga solo). */
  const [output, setOutput] = useState<File | null>(null)
  useEffect(() => setOutput(null), [file])
  const { pages, ready, pageNo, setPageNo, preview, error, setError } = usePdfPreview(file)
  const [signature, setSignature] = useState<Signature | null>(null)
  const [editing, setEditing] = useState(true)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPlacements([])
    setSelected(null)
  }, [file])

  const pageAspect = preview ? preview.widthPt / preview.heightPt : 0.75

  const addHere = (sig = signature) => {
    if (!sig) return
    setSelected(placements.length)
    setPlacements((ps) => [...ps, defaultPlacement(pageNo - 1, sig.aspect, pageAspect)])
  }

  const useSignature = (sig: Signature) => {
    setSignature(sig)
    setEditing(false)
    // Si cambia la firma, las posiciones se conservan pero con la nueva proporción.
    if (placements.length) setPlacements((ps) => ps.map((p) => clampPlacement({ ...p, h: (p.w * pageAspect) / sig.aspect })))
    else addHere(sig)
  }

  const copyToAllPages = () => {
    const here = placements.filter((p) => p.page === pageNo - 1)
    if (!here.length) return
    // Las firmas de las otras páginas se reemplazan, para no duplicarlas.
    const copies = [...Array(pages).keys()].filter((i) => i !== pageNo - 1).flatMap((page) => here.map((p) => ({ ...p, page })))
    setSelected(null)
    setPlacements([...here, ...copies])
    toast(tr('sign.copied', { n: pages }))
  }

  const save = async () => {
    if (!file || !signature) return
    setBusy(true)
    setError(null)
    try {
      setOutput(resultFile(await signPdf(await file.arrayBuffer(), signature.png, placements), `${baseName(file.name)}-${tr('file.signed')}.pdf`, 'application/pdf'))
      track('pdf_tool_used', { tool_name: 'sign' })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_sign', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title={tr('sign.pick')} hint={tr('common.dragHere')} onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const onPage = placements.map((p, i) => ({ p, i })).filter(({ p }) => p.page === pageNo - 1)
  const pagesSigned = new Set(placements.map((p) => p.page)).size

  return (
    <div className="stack">
      <div className="card stack">
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow
            file={file}
            extra={pages ? pages === 1 ? tr('common.onePage') : tr('common.pagesCount', { n: pages }) : tr('common.reading')}
            actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>{tr('common.change')}</button>}
          />
        </ul>

        {editing || !signature ? (
          <SignatureEditor onDone={useSignature} onCancel={signature ? () => setEditing(false) : undefined} />
        ) : (
          <div className="sign-current">
            <img src={signature.url} alt={tr('sign.yours')} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Icon name="note" /> {tr('sign.change')}</button>
          </div>
        )}
      </div>

      {signature && !editing && (
        <div className="card stack">
          {preview ? (
            <>
              <p className="faint" style={{ margin: 0 }}>{tr('sign.help')}</p>
              <div className="sign-frame">
                <div className="sign-stage">
                  <img src={preview.url} alt={tr('single.pageAlt', { n: pageNo })} draggable={false} onPointerDown={() => setSelected(null)} />
                  {onPage.map(({ p, i }) => (
                    <PlacedSignature
                      key={i}
                      placement={p}
                      url={signature.url}
                      selected={selected === i}
                      onSelect={() => setSelected(i)}
                      onChange={(np) => setPlacements((ps) => ps.map((x, j) => (j === i ? np : x)))}
                      onRemove={() => {
                        setPlacements((ps) => ps.filter((_, j) => j !== i))
                        setSelected(null)
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <PageNav pageNo={pageNo} pages={pages} onChange={setPageNo} />
                <span className="faint">
                  {placements.length ? tr('sign.countIn', { signs: placements.length === 1 ? tr('sign.one') : tr('sign.many', { n: placements.length }), pages: pagesSigned === 1 ? tr('common.onePage') : tr('common.pagesCount', { n: pagesSigned }) }) : tr('sign.none')}
                </span>
              </div>
              <div className="row">
                <button type="button" className="btn btn-soft btn-sm" onClick={() => addHere()}><Icon name="plus" /> {tr('sign.addHere')}</button>
                {pages > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!onPage.length} onClick={copyToAllPages}><Icon name="copy" /> {tr('sign.repeat')}</button>
                )}
              </div>
            </>
          ) : (
            !error && <p className="faint">{tr('common.preparingPreview')}</p>
          )}
          {error && <Notice kind="error">{error}</Notice>}
          <Notice kind="plain">{tr('sign.visual')}</Notice>
          <div className="row row-end">
            <BusyButton busy={busy} disabled={!ready || !placements.length} onClick={save} icon="check">
              {tr('sign.go')}
            </BusyButton>
          </div>
        </div>
      )}
      {error && (editing || !signature) && <Notice kind="error">{error}</Notice>}
      {file && output && (
        <div className="card">
          <BeforeAfter original={file} result={output} toolName="sign" title={tr('sign.title')} />
        </div>
      )}
    </div>
  )
}

/** Firma colocada sobre la página: se arrastra, se redimensiona y se mueve con el teclado. */
function PlacedSignature({
  placement: p,
  url,
  selected,
  onSelect,
  onChange,
  onRemove,
}: {
  placement: Placement
  url: string
  selected: boolean
  onSelect: () => void
  onChange: (p: Placement) => void
  onRemove: () => void
}) {
  const drag = useRef<{ mode: 'move' | 'resize'; x: number; y: number; start: Placement; box: DOMRect } | null>(null)
  const el = useRef<HTMLDivElement>(null)

  const begin = (mode: 'move' | 'resize') => (e: PointerEvent<HTMLElement>) => {
    const box = el.current?.parentElement?.getBoundingClientRect()
    if (!box) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect()
    drag.current = { mode, x: e.clientX, y: e.clientY, start: p, box }
  }
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.x) / d.box.width
    const dy = (e.clientY - d.y) / d.box.height
    if (d.mode === 'move') onChange(clampPlacement({ ...d.start, x: d.start.x + dx, y: d.start.y + dy }))
    else onChange(resize(d.start, d.start.w + dx))
  }
  const end = () => {
    drag.current = null
  }

  const keys = (e: KeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }
    if (moves[e.key]) onChange(clampPlacement({ ...p, x: p.x + moves[e.key][0], y: p.y + moves[e.key][1] }))
    else if (e.key === '+' || e.key === '=') onChange(resize(p, p.w + step))
    else if (e.key === '-') onChange(resize(p, p.w - step))
    else if (e.key === 'Delete' || e.key === 'Backspace') onRemove()
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={el}
      className={'sign-box' + (selected ? ' is-selected' : '')}
      style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.w * 100}%`, height: `${p.h * 100}%` }}
      role="group"
      tabIndex={0}
      aria-label={tr('sign.placedAria')}
      onFocus={onSelect}
      onKeyDown={keys}
      onPointerDown={begin('move')}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <img src={url} alt="" draggable={false} />
      <button type="button" className="sign-del" aria-label={tr('sign.remove')} onPointerDown={(e) => e.stopPropagation()} onClick={onRemove}>
        <Icon name="close" />
      </button>
      <span className="sign-resize" aria-hidden="true" onPointerDown={begin('resize')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
    </div>
  )
}

/** Cambia el ancho conservando la proporción de la firma. */
function resize(p: Placement, w: number): Placement {
  const ratio = p.h / p.w
  const maxW = Math.min(1 - p.x, (1 - p.y) / ratio)
  const nw = Math.min(maxW, Math.max(0.05, w))
  return { ...p, w: nw, h: nw * ratio }
}

/* ───────────── Crear la firma ───────────── */

function SignatureEditor({ onDone, onCancel }: { onDone: (s: Signature) => void; onCancel?: () => void }) {
  const [mode, setMode] = useState<Mode>('draw')
  const [ink, setInk] = useState<InkName>('negro')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [hasStroke, setHasStroke] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pad = useRef<HTMLCanvasElement>(null)

  const ready = mode === 'draw' ? hasStroke : mode === 'type' ? !!name.trim() : !!photo

  const finish = async () => {
    setBusy(true)
    setError(null)
    try {
      let source: HTMLCanvasElement
      if (mode === 'draw') source = pad.current!
      else if (mode === 'type') source = await renderTyped(name.trim(), INK[ink])
      else source = await renderPhoto(photo!)
      const sig = await toSignature(source)
      if (!sig) throw new Error(mode === 'image' ? tr('sign.notFound') : tr('sign.empty'))
      onDone(sig)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{tr('sign.yours')}</h3>
        <Segmented
          label={tr('sign.how')}
          value={mode}
          onChange={(m) => {
            setMode(m)
            setError(null)
          }}
          options={[
            { value: 'draw', label: tr('sign.draw') },
            { value: 'type', label: tr('sign.type') },
            { value: 'image', label: tr('sign.image') },
          ]}
        />
      </div>

      {mode === 'draw' && <DrawPad canvasRef={pad} color={INK[ink]} onStroke={setHasStroke} />}
      {mode === 'type' && (
        <>
          <label className="field">
            <span>{tr('sign.name')}</span>
            <input className="input" value={name} maxLength={40} autoComplete="name" placeholder={tr('sign.namePh')} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="sign-typed" style={{ color: INK[ink], fontFamily: SCRIPT_FONT }}>{name.trim() || tr('sign.yours')}</div>
        </>
      )}
      {mode === 'image' &&
        (photo ? (
          <ul className="file-list" style={{ marginTop: 0 }}>
            <FileRow file={photo} actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhoto(null)}>{tr('common.change')}</button>} />
          </ul>
        ) : (
          <DropZone accept="image/png,image/jpeg,image/webp" title={tr('sign.upload')} hint={tr('sign.uploadHint')} onFiles={([f]) => setPhoto(f)} />
        ))}

      {mode !== 'image' && (
        <div className="row">
          <span className="faint">{tr('sign.color')}</span>
          <Segmented label={tr('sign.ink')} value={ink} onChange={setInk} options={[{ value: 'negro', label: tr('sign.black') }, { value: 'azul', label: tr('sign.blue') }]} />
        </div>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>{tr('sign.cancel')}</button>}
        <BusyButton busy={busy} disabled={!ready} onClick={finish} icon="check">
          {tr('sign.use')}
        </BusyButton>
      </div>
    </div>
  )
}

/** Lienzo para firmar con el dedo, el lápiz o el mouse. */
function DrawPad({ canvasRef, color, onStroke }: { canvasRef: RefObject<HTMLCanvasElement | null>; color: string; onStroke: (has: boolean) => void }) {
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const c = canvasRef.current!
    const ratio = Math.min(3, window.devicePixelRatio || 1)
    c.width = c.clientWidth * ratio
    c.height = c.clientHeight * ratio
    onStroke(false)
  }, [canvasRef, onStroke])

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height }
  }
  const lineTo = (e: PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d')!
    const p = point(e)
    const from = last.current ?? p
    // Más presión (o más lento) = trazo un poco más grueso, como una lapicera.
    const base = e.currentTarget.width / 160
    ctx.lineWidth = base * (e.pressure && e.pointerType === 'pen' ? 0.6 + e.pressure : 1)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(p.x + (from === p ? 0.01 : 0), p.y)
    ctx.stroke()
    last.current = p
  }

  const clear = () => {
    const c = canvasRef.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    onStroke(false)
  }

  return (
    <div className="sign-pad-wrap">
      <canvas
        ref={canvasRef}
        className="sign-pad"
        aria-label={tr('sign.padAria')}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          last.current = null
          lineTo(e)
          onStroke(true)
        }}
        onPointerMove={(e) => last.current && lineTo(e)}
        onPointerUp={() => (last.current = null)}
        onPointerCancel={() => (last.current = null)}
      />
      <span className="sign-pad-line" aria-hidden="true" />
      <button type="button" className="btn btn-ghost btn-sm sign-pad-clear" onClick={clear}><Icon name="reset" /> {tr('sign.clear')}</button>
    </div>
  )
}

/** El nombre escrito con la letra manuscrita, en un canvas grande para que se vea nítido. */
async function renderTyped(text: string, color: string): Promise<HTMLCanvasElement> {
  const size = 140
  await document.fonts.load(`600 ${size}px ${SCRIPT_FONT}`)
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  ctx.font = `600 ${size}px ${SCRIPT_FONT}`
  c.width = Math.ceil(ctx.measureText(text).width + size)
  c.height = Math.ceil(size * 1.8)
  ctx.font = `600 ${size}px ${SCRIPT_FONT}`
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size / 2, c.height / 2)
  return c
}

/** Foto de una firma en papel: se achica, se quita el fondo claro. */
async function renderPhoto(file: File): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  const img = ctx.getImageData(0, 0, c.width, c.height)
  removeLightBackground(img)
  ctx.putImageData(img, 0, 0)
  return c
}

/** Recorta lo transparente alrededor y lo convierte en PNG. */
async function toSignature(source: HTMLCanvasElement): Promise<Signature | null> {
  const ctx = source.getContext('2d', { willReadFrequently: true })!
  const b = opaqueBounds(ctx.getImageData(0, 0, source.width, source.height))
  if (!b) return null
  const pad = Math.round(Math.max(b.width, b.height) * 0.03)
  const out = document.createElement('canvas')
  out.width = b.width + pad * 2
  out.height = b.height + pad * 2
  out.getContext('2d')!.drawImage(source, b.x, b.y, b.width, b.height, pad, pad, b.width, b.height)
  const blob = await canvasToBlob(out, 'image/png')
  return { url: out.toDataURL('image/png'), png: new Uint8Array(await blob.arrayBuffer()), aspect: out.width / out.height }
}
