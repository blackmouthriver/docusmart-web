// Firmar PDF: crear la firma (dibujarla, escribirla o subir una foto) y colocarla sobre las páginas.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import '@fontsource-variable/dancing-script'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Segmented, errorMessage } from '../../../shared/ui/ui'
import { baseName } from '../../../shared/files/files'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import { tr } from '../../../shared/i18n/translate'
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { clampPlacement, defaultPlacement, isImageStamp, opaqueBounds, removeLightBackground, signPdf, type Placement, type StampKind } from '../core/pdfSign'
import { track } from '../../../shared/platform/analytics'
import { PageNav, usePdfPreview } from './PdfPreview'
import { DigitalSignPanel, type DigitalSign } from './DigitalSignPanel'

export type Signature = { url: string; png: Uint8Array; aspect: number }
type Mode = 'draw' | 'type' | 'image'

const INK = { negro: '#1C1B1A', azul: '#1D3FA8' } as const
type InkName = keyof typeof INK
const SCRIPT_FONT = '"Dancing Script Variable", cursive'
/** Color de la fecha, los textos y la marca ✓ (el mismo negro de la tinta). */
const STAMP_INK = INK.negro
/** La firma recordada en este equipo (W-146.2): solo en el navegador, nunca sale del dispositivo. */
const SAVED_KEY = 'ds-signature-v1'

/** Proporción (ancho / alto) de un texto en la letra de los campos, para su recuadro. */
const textAspect = (text: string) => Math.max(1.2, Array.from(text).length * 0.58 + 0.4)

function loadSaved(): Signature | null {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    if (!raw) return null
    const { url, aspect } = JSON.parse(raw) as { url: string; aspect: number }
    if (typeof url !== 'string' || !url.startsWith('data:image/png;base64,') || !(aspect > 0)) return null
    const png = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0))
    return { url, png, aspect }
  } catch {
    return null
  }
}

function storeSaved(sig: Signature | null) {
  try {
    if (sig) localStorage.setItem(SAVED_KEY, JSON.stringify({ url: sig.url, aspect: sig.aspect }))
    else localStorage.removeItem(SAVED_KEY)
  } catch {
    // Navegación privada o almacenamiento lleno: se usa igual, sin recordarla.
  }
}

/** Iniciales a partir de un nombre: "Ana María Pérez" → "AMP". */
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => Array.from(w)[0]!.toUpperCase())
    .join('')
    .slice(0, 4)

export function SignTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  /** Resultado listo para ver y guardar (ya no se descarga solo). */
  const [output, setOutput] = useState<File | null>(null)
  useEffect(() => setOutput(null), [file])
  const { pages, ready, pageNo, setPageNo, preview, error, setError } = usePdfPreview(file)
  const [saved] = useState(loadSaved)
  const [signature, setSignature] = useState<Signature | null>(saved)
  const [remember, setRemember] = useState(!!saved)
  const [editing, setEditing] = useState(!saved)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [digital, setDigital] = useState<DigitalSign>(null)
  /** Las iniciales: el texto y su imagen en letra manuscrita. */
  const [initials, setInitials] = useState<{ text: string; sig: Signature } | null>(null)
  const [initialsText, setInitialsText] = useState('')

  useEffect(() => {
    setPlacements([])
    setSelected(null)
    // Con la firma recordada, se coloca sola en la primera página.
    if (file && signature && !editing) setPlacements([defaultPlacement(0, signature.aspect, 0.75)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const pageAspect = preview ? preview.widthPt / preview.heightPt : 0.75

  const addHere = (sig = signature) => {
    if (!sig) return
    setSelected(placements.length)
    setPlacements((ps) => [...ps, defaultPlacement(pageNo - 1, sig.aspect, pageAspect)])
  }

  /** Agrega un campo rápido (fecha, texto, iniciales o ✓) en la página actual. */
  const addStamp = (kind: StampKind, text?: string, aspect = text ? textAspect(text) : 1) => {
    const w = kind === 'check' ? 0.05 : kind === 'initials' ? 0.12 : Math.min(0.5, 0.035 * aspect)
    const h = Math.min(0.3, (w * pageAspect) / aspect)
    // Escalonados para que no queden uno encima de otro.
    const n = placements.filter((p) => p.page === pageNo - 1).length
    const offset = (n % 6) * 0.06
    setSelected(placements.length)
    setPlacements((ps) => [...ps, clampPlacement({ page: pageNo - 1, x: 0.08 + offset, y: 0.12 + offset, w, h, kind, ...(text !== undefined && { text }) })])
  }

  const addInitials = async () => {
    const text = initialsText.trim()
    if (!text) return
    const sig = await toSignature(await renderTyped(text, INK.negro))
    if (!sig) return
    setInitials({ text, sig })
    addStamp('initials', undefined, sig.aspect)
  }

  const updateText = (i: number, text: string) =>
    setPlacements((ps) => ps.map((p, j) => (j === i ? clampPlacement({ ...p, text, h: (p.w * pageAspect) / textAspect(text || ' ') }) : p)))

  const useSignature = (sig: Signature) => {
    setSignature(sig)
    setEditing(false)
    if (remember) storeSaved(sig)
    // Si cambia la firma, las posiciones se conservan pero con la nueva proporción.
    if (placements.some((p) => (p.kind ?? 'signature') === 'signature'))
      setPlacements((ps) => ps.map((p) => ((p.kind ?? 'signature') === 'signature' ? clampPlacement({ ...p, h: (p.w * pageAspect) / sig.aspect }) : p)))
    else addHere(sig)
  }

  const toggleRemember = (on: boolean) => {
    setRemember(on)
    storeSaved(on ? signature : null)
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
      let pdf = await signPdf(await file.arrayBuffer(), { signature: signature.png, initials: initials?.sig.png }, placements, STAMP_INK)
      // Con certificado: la firma digital va al final, en el lugar de la primera firma visible.
      if (digital) {
        const { signWithCertificate } = await import('../core/pdfDigitalSign')
        const first = placements.find((p) => (p.kind ?? 'signature') === 'signature') ?? placements[0]
        pdf = await signWithCertificate(pdf, digital.cert, { reason: digital.reason || undefined, placement: first })
      }
      setOutput(resultFile(pdf, `${baseName(file.name)}-${tr('file.signed')}.pdf`, 'application/pdf'))
      track('pdf_tool_used', { tool_name: digital ? 'sign_certificate' : 'sign' })
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
          <>
            <div className="sign-current">
              <img src={signature.url} alt={tr('sign.yours')} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Icon name="note" /> {tr('sign.change')}</button>
            </div>
            <label className="switch-row">
              <span>
                <b>{tr('sign.remember')}</b>
                <small>{tr('sign.rememberHint')}</small>
              </span>
              <input type="checkbox" role="switch" className="switch" checked={remember} onChange={(e) => toggleRemember(e.target.checked)} />
            </label>
          </>
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
                      url={p.kind === 'initials' ? (initials?.sig.url ?? '') : signature.url}
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
              {selected !== null && (placements[selected]?.kind === 'text' || placements[selected]?.kind === 'date') && (
                <label className="field">
                  <span>{placements[selected].kind === 'date' ? tr('sign.field.date') : tr('sign.field.text')}</span>
                  <input className="input" value={placements[selected].text ?? ''} maxLength={80} onChange={(e) => updateText(selected, e.target.value)} />
                </label>
              )}
              <div className="row">
                <button type="button" className="btn btn-soft btn-sm" onClick={() => addHere()}><Icon name="plus" /> {tr('sign.addHere')}</button>
                {pages > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!onPage.length} onClick={copyToAllPages}><Icon name="copy" /> {tr('sign.repeat')}</button>
                )}
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <span className="faint">{tr('sign.fields')}</span>
                <div className="row sign-fields">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => addStamp('date', new Date().toLocaleDateString(document.documentElement.lang || undefined))}>
                    <Icon name="calendar" /> {tr('sign.field.date')}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => addStamp('text', tr('sign.field.textDefault'))}>
                    <Icon name="type" /> {tr('sign.field.text')}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => addStamp('check')} aria-label={tr('sign.field.checkAria')}>
                    <Icon name="check" /> {tr('sign.field.check')}
                  </button>
                </div>
                <div className="row sign-fields">
                  <input className="input" style={{ width: 120 }} value={initialsText} maxLength={4} placeholder={tr('sign.field.initialsPh')} aria-label={tr('sign.field.initialsLabel')} onChange={(e) => setInitialsText(e.target.value)} />
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!initialsText.trim()} onClick={() => void addInitials()}>
                    <Icon name="pen" /> {tr('sign.field.initials')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            !error && <p className="faint">{tr('common.preparingPreview')}</p>
          )}
          {error && <Notice kind="error">{error}</Notice>}
          <DigitalSignPanel file={file} onChange={setDigital} disabled={busy} />
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
      aria-label={isImageStamp(p) && p.kind !== 'initials' ? tr('sign.placedAria') : tr('sign.placedFieldAria')}
      onFocus={onSelect}
      onKeyDown={keys}
      onPointerDown={begin('move')}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {p.kind === 'date' || p.kind === 'text' ? (
        <svg className="sign-text" viewBox={`0 0 ${textAspect(p.text || ' ') * 100} 100`} preserveAspectRatio="xMinYMid meet" aria-hidden="true">
          <text x="0" y="80" fontSize="88" fill={STAMP_INK}>{p.text}</text>
        </svg>
      ) : p.kind === 'check' ? (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <polyline points="14,55 40,80 86,20" fill="none" stroke={STAMP_INK} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <img src={url} alt="" draggable={false} />
      )}
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

export function SignatureEditor({ onDone, onCancel }: { onDone: (s: Signature) => void; onCancel?: () => void }) {
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
