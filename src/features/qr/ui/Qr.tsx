import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { go, useApp } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, BusyButton, HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { SaveOptions, ShareApp } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import { PREFIX, decrypt, encrypt, isProtectedPayload } from '../core/qrCrypto'
import { buildPayload, contactPayload, detectType, emailAddress, eventPayload, isPlainScheme, parseContact, parseEvent, parseWifi, phoneNumber, safeLink, type QrForm, type QrKind, type ReadType } from '../core/qrContent'
import { download, isOwnBlobUrl, safeMimeType } from '../../../shared/files/files'
import { previewOf, type QrHistoryEntry, type QrHistoryKind } from '../core/qrHistory'
import { clearQrHistory, forgetQr, getQrHistory, recordQr, subscribeQrHistory } from '../infra/historyStore'
import { QR_COLORS, QR_SIZES, errorLevels, hasSufficientContrast, logoBox, svgWithLogo, type QrColorId, type QrSize } from '../core/qrDesign'
import { useT } from '../../../shared/i18n/I18n'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'

// Menú de QR (W-82): una vista por función, como el Modo Estudio.
type QrView = 'crear' | 'leer' | 'historial'
const QR_VIEWS: Array<{ id: QrView; icon: IconName; cls: string; title: MessageKey; desc: MessageKey }> = [
  { id: 'crear', icon: 'qr', cls: 'ico-blue', title: 'qr.create', desc: 'qr.menuCreateDesc' },
  { id: 'leer', icon: 'camera', cls: 'ico-green', title: 'qr.read', desc: 'qr.menuReadDesc' },
  { id: 'historial', icon: 'folder', cls: 'ico-amber', title: 'qr.history', desc: 'qr.menuHistoryDesc' },
]

export function QrScreen({ sub }: { sub?: string }) {
  const view = QR_VIEWS.find((v) => v.id === sub)?.id
  return (
    <>
      <HeroCard title={tr('nav.qr')} subtitle={tr('qr.heroSub')} />
      {view ? (
        <>
          <div style={{ margin: '14px 0' }}>
            <BackButton label={tr('nav.qr')} onClick={() => go('qr')} />
          </div>
          <div className="qr-view">{view === 'crear' ? <CreateQr /> : view === 'leer' ? <ReadQr /> : <QrHistory />}</div>
        </>
      ) : (
        <>
          <h2 className="section-title">{tr('qr.menuPrompt')}</h2>
          <div className="study-menu">
            {QR_VIEWS.map((v) => (
              <button key={v.id} type="button" className="tool-card study-card" onClick={() => go('qr', v.id)}>
                <span className={'ico ' + v.cls}><Icon name={v.icon} /></span>
                <span className="study-card-text">
                  <b>{tr(v.title)}</b>
                  <small>{tr(v.desc)}</small>
                </span>
                <span className="study-card-arrow"><Icon name="back" /></span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

// ── Crear QR (W-83): un tipo de contenido por formulario, como en la app ──
const KINDS: Array<{ id: QrKind; icon: IconName }> = [
  { id: 'url', icon: 'link' },
  { id: 'text', icon: 'text' },
  { id: 'email', icon: 'mail' },
  { id: 'phone', icon: 'phone' },
  { id: 'wifi', icon: 'wifi' },
  { id: 'contact', icon: 'user' },
  { id: 'event', icon: 'calendar' },
]

/** Fecha y hora local para <input type="datetime-local">, redondeada a la hora siguiente. */
function nextHour(addHours = 0): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1 + addHours)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

const emptyForm = (): QrForm => ({
  kind: 'url',
  value: '',
  wifi: { ssid: '', password: '', security: 'WPA' },
  contact: { name: '', phone: '', email: '' },
  event: { title: '', location: '', start: nextHour(), end: nextHour(1) },
})

/**
 * Dibuja el QR en un canvas con el color, el tamaño y el logo elegidos (W-85). Con logo usa
 * corrección alta (H, o Q si el contenido no entra) para que siga leyéndose con el centro tapado.
 */
async function renderQr(payload: string, opts: { color: string; size: number; logo: File | null }): Promise<string> {
  const canvas = document.createElement('canvas')
  let failure: unknown = null
  for (const level of errorLevels(!!opts.logo)) {
    try {
      await QRCode.toCanvas(canvas, payload, { width: opts.size, margin: 2, errorCorrectionLevel: level, color: { dark: opts.color, light: '#FFFFFF' } })
      failure = null
      break
    } catch (e) {
      failure = e
    }
  }
  if (failure) throw failure
  if (opts.logo) {
    const bmp = await createImageBitmap(opts.logo)
    const ctx = canvas.getContext('2d')!
    const box = logoBox(canvas.width)
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(box.x - box.pad, box.y - box.pad, box.side + box.pad * 2, box.side + box.pad * 2, box.pad)
    else ctx.rect(box.x - box.pad, box.y - box.pad, box.side + box.pad * 2, box.side + box.pad * 2)
    ctx.fill()
    const fit = box.side / Math.max(bmp.width, bmp.height)
    const w = bmp.width * fit
    const h = bmp.height * fit
    ctx.drawImage(bmp, box.x + (box.side - w) / 2, box.y + (box.side - h) / 2, w, h)
    bmp.close()
  }
  const url = canvas.toDataURL('image/png')
  canvas.width = canvas.height = 0
  return url
}

/** El mismo QR en SVG (W-86): vectorial, para imprimir nítido en cualquier tamaño. */
async function renderQrSvg(payload: string, opts: { color: string; logo: File | null }): Promise<string> {
  let svg = ''
  let failure: unknown = null
  for (const level of errorLevels(!!opts.logo)) {
    try {
      svg = await QRCode.toString(payload, { type: 'svg', margin: 2, errorCorrectionLevel: level, color: { dark: opts.color, light: '#FFFFFF' } })
      failure = null
      break
    } catch (e) {
      failure = e
    }
  }
  if (failure) throw failure
  let logoUrl: string | null = null
  if (opts.logo) {
    // El logo se vuelve a dibujar como PNG: dentro del SVG solo va una imagen limpia.
    const bmp = await createImageBitmap(opts.logo)
    const k = Math.min(1, 512 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * k)
    canvas.height = Math.round(bmp.height * k)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    logoUrl = canvas.toDataURL('image/png')
    canvas.width = canvas.height = 0
  }
  return svgWithLogo(svg, logoUrl)
}

export function CreateQr() {
  const { toast } = useApp()
  const [form, setForm] = useState<QrForm>(emptyForm)
  const [protect, setProtect] = useState(false)
  const [password, setPassword] = useState('')
  const [img, setImg] = useState<string | null>(null)
  const [tried, setTried] = useState(false)
  /** El QR como archivo PNG, para guardarlo o compartirlo. */
  const qrFile = useMemo(
    () => (img ? resultFile(Uint8Array.from(atob(img.split(',')[1] ?? ''), (c) => c.charCodeAt(0)), protect ? `docusmart-qr-${tr('file.protected')}.png` : 'docusmart-qr.png', 'image/png') : null),
    [img, protect],
  )
  const [busy, setBusy] = useState(false)
  // Diseño (W-85): color, logo y tamaño, como en la app.
  const [color, setColor] = useState<QrColorId>('black')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [size, setSize] = useState<QrSize>('m')
  const logoInput = useRef<HTMLInputElement>(null)
  const hex = QR_COLORS.find((c) => c.id === color)!.hex
  const lowContrast = !hasSufficientContrast(hex)
  useEffect(() => {
    if (!logo) return setLogoUrl('')
    // Se re-empaqueta con un tipo de imagen y se comprueba que la URL sea del propio sitio.
    const url = URL.createObjectURL(new Blob([logo], { type: safeMimeType(logo.type).startsWith('image/') ? logo.type : 'image/png' }))
    setLogoUrl(isOwnBlobUrl(url) ? url : '')
    return () => URL.revokeObjectURL(url)
  }, [logo])
  const pickLogo = async (file: File | undefined) => {
    if (!file) return
    try {
      const bmp = await createImageBitmap(file) // comprueba que sea una imagen válida
      bmp.close()
      setLogo(file)
      setImg(null)
    } catch {
      toast(tr('qr.logoError'))
    }
  }
  const built = buildPayload(form)
  const error = 'error' in built ? built.error : null

  const change = (patch: Partial<QrForm>) => {
    setForm((f) => ({ ...f, ...patch }))
    setImg(null)
  }

  // Guardar y compartir (W-86): SVG, copiar la imagen e imprimir solo el QR.
  const [lastPayload, setLastPayload] = useState('')
  const canCopyImage = typeof window !== 'undefined' && 'ClipboardItem' in window && !!navigator.clipboard?.write
  const baseName = protect ? `docusmart-qr-${tr('file.protected')}` : 'docusmart-qr'
  const downloadSvg = async () => {
    try {
      const svg = await renderQrSvg(lastPayload, { color: hex, logo })
      download(new Blob([svg], { type: 'image/svg+xml' }), `${baseName}.svg`)
      track('qr_exported', { format: 'svg' })
    } catch {
      toast(tr('qr.tooLong'))
    }
  }
  const copyImage = async () => {
    if (!qrFile) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': qrFile })])
      toast(tr('qr.imageCopied'))
      track('qr_exported', { format: 'clipboard' })
    } catch {
      toast(tr('qr.copyFailed'))
    }
  }
  const printQr = () => {
    track('qr_exported', { format: 'print' })
    window.print()
  }

  const create = async () => {
    setTried(true)
    if (!('payload' in built)) return
    setBusy(true)
    try {
      const payload = protect ? PREFIX + (await encrypt(built.payload, password)) : built.payload
      setImg(await renderQr(payload, { color: hex, size: QR_SIZES[size], logo }))
      setLastPayload(payload)
      recordQr({ source: 'created', payload, kind: protect ? 'protected' : detectType(built.payload), color: hex })
      track('qr_created', { qr_content_type: form.kind, has_password: protect, color, has_logo: !!logo, size })
    } catch {
      toast(tr('qr.tooLong'))
    } finally {
      setBusy(false)
    }
  }

  const field = (label: MessageKey, input: ReactNode) => (
    <label className="field">
      <span>{tr(label)}</span>
      {input}
    </label>
  )

  return (
    <section className="card stack" aria-labelledby="qr-create">
      <div className="row">
        <span className="ico ico-cyan"><Icon name="qr" /></span>
        <h3 id="qr-create">{tr('qr.create')}</h3>
      </div>
      <div className="qr-kinds" role="radiogroup" aria-label={tr('qr.kindLabel')}>
        {KINDS.map((k) => (
          <button key={k.id} type="button" role="radio" aria-checked={form.kind === k.id} className="qr-kind" onClick={() => { change({ kind: k.id }); setTried(false) }}>
            <Icon name={k.icon} /> {tr(`qr.kind.${k.id}` as MessageKey)}
          </button>
        ))}
      </div>

      {form.kind === 'url' && field('qr.label.url', <input className="input" type="url" inputMode="url" value={form.value} placeholder="https://docusmart.online" onChange={(e) => change({ value: e.target.value })} />)}
      {form.kind === 'text' && field('qr.label.text', <textarea className="textarea" style={{ minHeight: 96 }} value={form.value} maxLength={900} placeholder={tr('qr.ph.text')} onChange={(e) => change({ value: e.target.value })} />)}
      {form.kind === 'email' && field('qr.label.email', <input className="input" type="email" inputMode="email" value={form.value} placeholder={tr('qr.ph.email')} onChange={(e) => change({ value: e.target.value })} />)}
      {form.kind === 'phone' && field('qr.label.phone', <input className="input" type="tel" inputMode="tel" value={form.value} placeholder="+57 300 000 0000" onChange={(e) => change({ value: e.target.value })} />)}
      {form.kind === 'wifi' && (
        <>
          {field('qr.label.ssid', <input className="input" value={form.wifi.ssid} autoComplete="off" onChange={(e) => change({ wifi: { ...form.wifi, ssid: e.target.value } })} />)}
          <Segmented
            label={tr('qr.label.security')}
            value={form.wifi.security}
            onChange={(security) => change({ wifi: { ...form.wifi, security } })}
            options={[{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'NONE', label: tr('qr.sec.none') }]}
          />
          {form.wifi.security !== 'NONE' && field('qr.label.wifiKey', <input className="input" type="text" autoComplete="off" spellCheck={false} value={form.wifi.password} onChange={(e) => change({ wifi: { ...form.wifi, password: e.target.value } })} />)}
        </>
      )}
      {form.kind === 'contact' && (
        <>
          {field('qr.label.name', <input className="input" autoComplete="name" value={form.contact.name} onChange={(e) => change({ contact: { ...form.contact, name: e.target.value } })} />)}
          {field('qr.label.phone', <input className="input" type="tel" inputMode="tel" value={form.contact.phone} onChange={(e) => change({ contact: { ...form.contact, phone: e.target.value } })} />)}
          {field('qr.label.email', <input className="input" type="email" inputMode="email" value={form.contact.email} onChange={(e) => change({ contact: { ...form.contact, email: e.target.value } })} />)}
        </>
      )}
      {form.kind === 'event' && (
        <>
          {field('qr.label.eventTitle', <input className="input" value={form.event.title} onChange={(e) => change({ event: { ...form.event, title: e.target.value } })} />)}
          {field('qr.label.location', <input className="input" value={form.event.location} onChange={(e) => change({ event: { ...form.event, location: e.target.value } })} />)}
          <div className="row qr-dates">
            {field('qr.label.start', <input className="input" type="datetime-local" value={form.event.start} onChange={(e) => change({ event: { ...form.event, start: e.target.value } })} />)}
            {field('qr.label.end', <input className="input" type="datetime-local" value={form.event.end} onChange={(e) => change({ event: { ...form.event, end: e.target.value } })} />)}
          </div>
        </>
      )}

      <details className="qr-design">
        <summary><Icon name="stamp" /> {tr('qr.design')}</summary>
        <div className="stack">
          <div className="field">
            <span>{tr('qr.color')}</span>
            <div className="qr-colors" role="radiogroup" aria-label={tr('qr.color')}>
              {QR_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={color === c.id}
                  className="qr-color"
                  style={{ background: c.hex }}
                  title={tr(`qr.color.${c.id}` as MessageKey)}
                  aria-label={tr(`qr.color.${c.id}` as MessageKey)}
                  onClick={() => { setColor(c.id); setImg(null) }}
                />
              ))}
            </div>
            {lowContrast && <Notice kind="error">{tr('qr.contrastWarn')}</Notice>}
          </div>
          <div className="field">
            <span>{tr('qr.logo')}</span>
            <div className="row" style={{ gap: 10 }}>
              {logoUrl && <img className="qr-logo-thumb" src={logoUrl} alt="" />}
              <button type="button" className="btn btn-soft btn-sm" onClick={() => logoInput.current?.click()}><Icon name="image" /> {logo ? tr('qr.changeLogo') : tr('qr.addLogo')}</button>
              {logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setLogo(null); setImg(null) }}><Icon name="close" /> {tr('qr.removeLogo')}</button>}
              <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void pickLogo(e.target.files?.[0]); e.target.value = '' }} />
            </div>
            <small className="faint">{tr('qr.logoHint')}</small>
          </div>
          <Segmented
            label={tr('qr.size')}
            value={size}
            onChange={(v) => { setSize(v); setImg(null) }}
            options={[{ value: 's', label: `${tr('qr.size.s')} · ${QR_SIZES.s} px` }, { value: 'm', label: `${tr('qr.size.m')} · ${QR_SIZES.m} px` }, { value: 'l', label: `${tr('qr.size.l')} · ${QR_SIZES.l} px` }]}
          />
        </div>
      </details>

      <Segmented
        label={tr('qr.type')}
        value={protect ? 'protected' : 'open'}
        onChange={(v) => { setProtect(v === 'protected'); setImg(null) }}
        options={[{ value: 'open', label: tr('qr.normal') }, { value: 'protected', label: tr('qr.protected') }]}
      />
      {protect && (
        <label className="field">
          <span>{tr('qr.keyToOpen')}</span>
          <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setImg(null) }} />
          <small className="faint">{tr('qr.aesNote')}</small>
        </label>
      )}
      {tried && error && <Notice kind="error">{tr(`qr.err.${error}` as MessageKey)}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={(protect && password.length < 4) || lowContrast} onClick={create} icon="qr">
          {tr('qr.generate')}
        </BusyButton>
      </div>
      {img && (
        <div className="qr-preview">
          <img src={img} alt={tr('qr.alt')} />
        </div>
      )}
      {qrFile && (
        <>
          <div className="row qr-extra">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void downloadSvg()}><Icon name="download" /> {tr('qr.svg')}</button>
            {canCopyImage && <button type="button" className="btn btn-outline btn-sm" onClick={() => void copyImage()}><Icon name="copy" /> {tr('qr.copyImage')}</button>}
            <button type="button" className="btn btn-outline btn-sm" onClick={printQr}><Icon name="file" /> {tr('qr.print')}</button>
          </div>
          <small className="faint">{tr('qr.svgHint')}</small>
          {/* Solo esto sale al imprimir (ver @media print en app.css). */}
          {img && <div className="qr-print" aria-hidden="true"><img src={img} alt="" /></div>}
          <SaveOptions file={qrFile} toolName="qr" />
          <ShareApp toolName="qr" />
        </>
      )}
    </section>
  )
}

// ── Leer QR (W-84): reconoce el tipo y ofrece la acción que corresponde ──
type Detector = { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> }
/** Lector nativo del navegador (Chrome en Android, Edge, Safari reciente), más rápido que jsQR. */
let nativeDetector: Detector | null | undefined
function getNativeDetector(): Detector | null {
  if (nativeDetector !== undefined) return nativeDetector
  try {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector
    nativeDetector = BD ? new BD({ formats: ['qr_code'] }) : null
  } catch {
    nativeDetector = null
  }
  return nativeDetector
}

export function ReadQr() {
  const { toast } = useApp()
  const [mode, setMode] = useState<'camera' | 'image'>('camera')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setScanning(false)
  }
  useEffect(() => stop, [])

  const found = (data: string) => {
    stop()
    setResult(data)
    recordQr({ source: 'scanned', payload: data, kind: isProtectedPayload(data) ? 'protected' : detectType(data) })
    track('qr_scanned', { qr_content_type: isProtectedPayload(data) ? 'protected' : detectType(data) })
  }

  /** jsQR sobre un canvas achicado (respaldo cuando no hay lector nativo o no encontró nada). */
  const decodeJs = (source: CanvasImageSource, w: number, h: number) => {
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1024 / Math.max(w, h))
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return jsQR(data, canvas.width, canvas.height)?.data ?? null
  }
  const decode = async (source: CanvasImageSource & ImageBitmapSource, w: number, h: number) => {
    const native = getNativeDetector()
    if (native) {
      try {
        const codes = await native.detect(source)
        if (codes[0]?.rawValue) return codes[0].rawValue
      } catch {
        /* se prueba con jsQR */
      }
    }
    return decodeJs(source, w, h)
  }

  const startCamera = async () => {
    setError(null)
    setResult(null)
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const v = video.current!
      v.srcObject = stream.current
      await v.play()
      setScanning(true)
      const tick = async () => {
        if (!stream.current) return
        if (v.readyState >= 2) {
          const data = await decode(v, v.videoWidth, v.videoHeight)
          if (data !== null) return found(data)
        }
        requestAnimationFrame(() => void tick())
      }
      requestAnimationFrame(() => void tick())
    } catch {
      stop()
      setError(tr('qr.cameraError'))
    }
  }

  const fromImage = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setResult(null)
    try {
      const bmp = await createImageBitmap(file)
      const data = await decode(bmp, bmp.width, bmp.height)
      bmp.close()
      if (data === null) setError(tr('qr.notFound'))
      else found(data)
    } catch {
      setError(tr('qr.cantRead'))
    }
  }

  // Pegar una imagen (Ctrl+V / Cmd+V): una captura de pantalla con un QR se lee al instante.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (!file) return
      e.preventDefault()
      stop()
      setMode('image')
      void fromImage(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copied = () => toast(tr('qr.copied'))

  return (
    <section className="card stack" aria-labelledby="qr-read">
      <div className="row">
        <span className="ico ico-blue"><Icon name="camera" /></span>
        <h3 id="qr-read">{tr('qr.read')}</h3>
      </div>
      <Segmented label={tr('qr.source')} value={mode} onChange={(m) => { stop(); setMode(m) }} options={[{ value: 'camera', label: tr('qr.camera') }, { value: 'image', label: tr('qr.fromImage') }]} />

      {mode === 'camera' ? (
        <>
          <div className="camera" hidden={!scanning}>
            <video ref={video} muted playsInline />
            <div className="frame" />
            <div className="scanline" />
          </div>
          <div className="row">
            {scanning ? (
              <button type="button" className="btn btn-soft" onClick={stop}><Icon name="stop" /> {tr('qr.stop')}</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={startCamera}><Icon name="camera" /> {result === null ? tr('qr.openCamera') : tr('qr.scanAnother')}</button>
            )}
          </div>
        </>
      ) : (
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => fileInput.current?.click()}><Icon name="image" /> {tr('qr.pickImage')}</button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { void fromImage(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      )}
      <small className="faint">{tr('qr.pasteHint')}</small>

      {error && <Notice kind="error">{error}</Notice>}
      {result !== null && (isProtectedPayload(result) ? <ProtectedResult payload={result} onCopy={copied} /> : <QrResult value={result} onCopy={copied} />)}
    </section>
  )
}

/** Copia un texto y avisa. */
const copyText = (value: string, onCopy: () => void) => void navigator.clipboard.writeText(value).then(onCopy, () => {})

const READ_ICON: Record<ReadType, IconName> = { url: 'link', email: 'mail', phone: 'phone', wifi: 'wifi', contact: 'user', event: 'calendar', text: 'text' }

/** Resultado de un QR con las acciones de su tipo (nada se abre ni se descarga sin tocar un botón). */
function QrResult({ value, onCopy }: { value: string; onCopy: () => void }) {
  const { lang } = useT()
  const [showKey, setShowKey] = useState(false)
  const type = detectType(value)
  const head = (
    <div className="qr-result-head">
      <span className="ico ico-blue"><Icon name={READ_ICON[type]} /></span>
      <b>{tr(`qr.kind.${type}` as MessageKey)}</b>
    </div>
  )
  const copyBtn = (text: string, label: MessageKey = 'ocr.copy') => (
    <button type="button" className="btn btn-soft btn-sm" onClick={() => copyText(text, onCopy)}><Icon name="copy" /> {tr(label)}</button>
  )
  const row = (label: MessageKey, text: string) =>
    text ? (
      <div className="qr-field">
        <span className="faint">{tr(label)}</span>
        <span>{text}</span>
      </div>
    ) : null

  if (type === 'url') {
    const link = safeLink(value)
    return (
      <div className="qr-result stack">
        {head}
        <div className="result-box">{value}</div>
        {link ? (
          <>
            <p className="qr-host">{tr('qr.linkGoesTo')} <b>{link.host}</b></p>
            {!link.secure && <Notice kind="info">{tr('qr.notSecure')}</Notice>}
            {link.lookalike && <Notice kind="error">{tr('qr.lookalike')}</Notice>}
            <div className="row">
              <a className="btn btn-primary btn-sm" href={link.href} target="_blank" rel="noopener noreferrer nofollow"><Icon name="link" /> {tr('qr.openLink')}</a>
              {copyBtn(value)}
            </div>
          </>
        ) : (
          <>
            <Notice kind="info">{tr('qr.blocked')}</Notice>
            <div className="row">{copyBtn(value)}</div>
          </>
        )}
      </div>
    )
  }

  if (type === 'email' || type === 'phone') {
    const text = type === 'email' ? emailAddress(value) : phoneNumber(value)
    return (
      <div className="qr-result stack">
        {head}
        <div className="result-box">{text}</div>
        <div className="row">
          {isPlainScheme(value) && (
            <a className="btn btn-primary btn-sm" href={value.trim()}>
              <Icon name={type === 'email' ? 'mail' : 'phone'} /> {tr(type === 'email' ? 'qr.act.email' : 'qr.act.call')}
            </a>
          )}
          {copyBtn(text)}
        </div>
      </div>
    )
  }

  if (type === 'wifi') {
    const w = parseWifi(value)
    if (w) {
      return (
        <div className="qr-result stack">
          {head}
          <div className="qr-fields">
            {row('qr.label.ssid', w.ssid)}
            {row('qr.label.security', w.security === 'NONE' ? tr('qr.sec.none') : w.security === 'WEP' ? 'WEP' : 'WPA/WPA2')}
            {w.password && (
              <div className="qr-field">
                <span className="faint">{tr('qr.label.wifiKey')}</span>
                <span className="qr-key">
                  {showKey ? w.password : '•'.repeat(Math.min(12, w.password.length))}
                  <button type="button" className="link-btn" onClick={() => setShowKey((s) => !s)}>{showKey ? tr('qr.act.hide') : tr('qr.act.show')}</button>
                </span>
              </div>
            )}
          </div>
          <div className="row">
            {copyBtn(w.ssid, 'qr.act.copySsid')}
            {w.password && copyBtn(w.password, 'qr.act.copyKey')}
          </div>
          <small className="faint">{tr('qr.wifiNote')}</small>
        </div>
      )
    }
  }

  if (type === 'contact') {
    const c = parseContact(value)
    if (c) {
      return (
        <div className="qr-result stack">
          {head}
          <div className="qr-fields">
            {row('qr.label.name', c.name)}
            {row('qr.label.phone', c.phone)}
            {row('qr.label.email', c.email)}
          </div>
          <div className="row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => download(new Blob([contactPayload(c)], { type: 'text/vcard' }), `${c.name || 'contacto'}.vcf`)}>
              <Icon name="download" /> {tr('qr.act.saveContact')}
            </button>
            {copyBtn([c.name, c.phone, c.email].filter(Boolean).join('\n'))}
          </div>
        </div>
      )
    }
  }

  if (type === 'event') {
    const e = parseEvent(value)
    if (e) {
      const when = (s: string) => {
        try {
          return new Date(s).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })
        } catch {
          return s
        }
      }
      return (
        <div className="qr-result stack">
          {head}
          <div className="qr-fields">
            {row('qr.label.eventTitle', e.title)}
            {row('qr.label.location', e.location)}
            {row('qr.label.start', when(e.start))}
            {row('qr.label.end', when(e.end))}
          </div>
          <div className="row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => download(new Blob([eventPayload(e)], { type: 'text/calendar' }), `${e.title || 'evento'}.ics`)}>
              <Icon name="calendar" /> {tr('qr.act.addEvent')}
            </button>
            {copyBtn(value)}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="qr-result stack">
      {head}
      <div className="result-box">{value}</div>
      <div className="row">{copyBtn(value)}</div>
    </div>
  )
}

function ProtectedResult({ payload, onCopy }: { payload: string; onCopy: () => void }) {
  const [password, setPassword] = useState('')
  const [plain, setPlain] = useState<string | null>(null)
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)
  if (plain !== null) return <QrResult value={plain} onCopy={onCopy} />
  return (
    <div className="stack">
      <Notice kind="info">{tr('qr.protectedInfo')}</Notice>
      <form
        className="row"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          const r = await decrypt(payload.trim().slice(PREFIX.length), password)
          setBusy(false)
          setWrong(r === null)
          setPlain(r)
        }}
      >
        <input className="input" style={{ flex: '1 1 180px' }} type="password" aria-label={tr('qr.keyAria')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={!password || busy}>{busy ? <span className="spinner" /> : <Icon name="lock" />} {tr('qr.unlock')}</button>
      </form>
      {wrong && <Notice kind="error">{tr('qr.wrong')}</Notice>}
    </div>
  )
}

// ── Historial (W-87): QR creados y leídos, solo en este navegador ──────
const HISTORY_ICON: Record<QrHistoryKind, IconName> = { ...READ_ICON, protected: 'lock' }

function HistoryItem({ entry, onCopy }: { entry: QrHistoryEntry; onCopy: () => void }) {
  const { lang } = useT()
  const [open, setOpen] = useState(false)
  const [img, setImg] = useState<string | null>(null)
  const preview = previewOf(entry)
  useEffect(() => {
    if (!open || img) return
    let alive = true
    void renderQr(entry.payload, { color: entry.color ?? '#000000', size: 512, logo: null })
      .then((url) => alive && setImg(url))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [open, img, entry])
  const label =
    preview.kind === 'protected'
      ? tr('qr.historyProtected')
      : preview.kind === 'wifi'
        ? tr('qr.historyWifi', { ssid: preview.ssid ?? tr('qr.hiddenSsid') })
        : preview.kind === 'contact'
          ? tr('qr.historyContact', { name: preview.name ?? tr('qr.hiddenName') })
          : preview.text
  return (
    <li className={'qr-history-item' + (open ? ' is-open' : '')}>
      <div className="qr-history-row">
        <span className="ico ico-blue"><Icon name={HISTORY_ICON[entry.kind]} /></span>
        <span className="qr-history-text">
          <b title={preview.kind === 'plain' ? preview.text : undefined}>{label}</b>
          <span className="faint">
            <span className={'qr-badge ' + entry.source}>{tr(entry.source === 'created' ? 'qr.src.created' : 'qr.src.scanned')}</span> · {new Date(entry.at).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </span>
        <button type="button" className="btn btn-soft btn-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? tr('qr.close') : tr('qr.open')}</button>
        <button type="button" className="icon-btn" aria-label={tr('qr.deleteEntry')} title={tr('qr.deleteEntry')} onClick={() => forgetQr(entry.id)}><Icon name="trash" /></button>
      </div>
      {open && (
        <div className="qr-history-body">
          {img ? <img className="qr-history-img" src={img} alt={tr('qr.alt')} /> : <span className="spinner" aria-hidden="true" />}
          <div className="qr-history-detail">{entry.kind === 'protected' ? <ProtectedResult payload={entry.payload} onCopy={onCopy} /> : <QrResult value={entry.payload} onCopy={onCopy} />}</div>
        </div>
      )}
    </li>
  )
}

export function QrHistory() {
  const { toast } = useApp()
  const list = useSyncExternalStore(subscribeQrHistory, getQrHistory)
  const [confirming, setConfirming] = useState(false)
  const copied = () => toast(tr('qr.copied'))
  return (
    <section className="card stack" aria-labelledby="qr-history">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row">
          <span className="ico ico-amber"><Icon name="folder" /></span>
          <h3 id="qr-history">{tr('qr.history')}</h3>
        </div>
        {list.length > 0 && !confirming && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}><Icon name="trash" /> {tr('qr.clearAll')}</button>}
      </div>
      {confirming && (
        <Notice kind="error">
          {tr('qr.clearConfirm')}{' '}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { clearQrHistory(); setConfirming(false) }}>{tr('qr.clearYes')}</button>{' '}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>{tr('qr.cancel')}</button>
        </Notice>
      )}
      {list.length ? (
        <ul className="qr-history">
          {list.map((e) => <HistoryItem key={e.id} entry={e} onCopy={copied} />)}
        </ul>
      ) : (
        <p className="faint">{tr('qr.historyEmpty')}</p>
      )}
      <small className="faint">{tr('qr.historyLocal')}</small>
    </section>
  )
}
