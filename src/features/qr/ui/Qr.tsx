import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import { SaveOptions, ShareApp } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import { PREFIX, decrypt, encrypt, isProtectedPayload } from '../core/qrCrypto'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'

const contentType = (s: string) => (/^https?:\/\//i.test(s) ? 'url' : /^WIFI:/i.test(s) ? 'wifi' : 'text')

export function QrScreen() {
  return (
    <>
      <HeroCard title={tr('nav.qr')} subtitle={tr('qr.heroSub')} />
      <div className="two-col" style={{ marginTop: 16 }}>
        <CreateQr />
        <ReadQr />
      </div>
    </>
  )
}

export function CreateQr() {
  const { toast } = useApp()
  const [text, setText] = useState('')
  const [protect, setProtect] = useState(false)
  const [password, setPassword] = useState('')
  const [img, setImg] = useState<string | null>(null)
  /** El QR como archivo PNG, para guardarlo o compartirlo. */
  const qrFile = useMemo(
    () => (img ? resultFile(Uint8Array.from(atob(img.split(',')[1] ?? ''), (c) => c.charCodeAt(0)), protect ? `docusmart-qr-${tr('file.protected')}.png` : 'docusmart-qr.png', 'image/png') : null),
    [img, protect],
  )
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true)
    try {
      const payload = protect ? PREFIX + (await encrypt(text, password)) : text
      setImg(await QRCode.toDataURL(payload, { width: 640, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0B1020', light: '#FFFFFF' } }))
      track('qr_created', { qr_content_type: contentType(text), has_password: protect })
    } catch {
      toast(tr('qr.tooLong'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card stack" aria-labelledby="qr-create">
      <div className="row">
        <span className="ico ico-cyan"><Icon name="qr" /></span>
        <h3 id="qr-create">{tr('qr.create')}</h3>
      </div>
      <label className="field">
        <span>{tr('qr.textOrLink')}</span>
        <textarea className="textarea" style={{ minHeight: 96 }} value={text} maxLength={900} placeholder={tr('qr.placeholder')} onChange={(e) => { setText(e.target.value); setImg(null) }} />
      </label>
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
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!text.trim() || (protect && password.length < 4)} onClick={create} icon="qr">
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
          <SaveOptions file={qrFile} toolName="qr" />
          <ShareApp toolName="qr" />
        </>
      )}
    </section>
  )
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
    track('qr_scanned', { qr_content_type: isProtectedPayload(data) ? 'protected' : contentType(data) })
  }

  const decode = (source: CanvasImageSource, w: number, h: number) => {
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1024 / Math.max(w, h))
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return jsQR(data, canvas.width, canvas.height)?.data ?? null
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
      const tick = () => {
        if (!stream.current) return
        if (v.readyState >= 2) {
          const data = decode(v, v.videoWidth, v.videoHeight)
          if (data !== null) return found(data)
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
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
      const data = decode(bmp, bmp.width, bmp.height)
      bmp.close()
      if (data === null) setError(tr('qr.notFound'))
      else found(data)
    } catch {
      setError(tr('qr.cantRead'))
    }
  }

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
              <button type="button" className="btn btn-primary" onClick={startCamera}><Icon name="camera" /> {tr('qr.openCamera')}</button>
            )}
          </div>
        </>
      ) : (
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => fileInput.current?.click()}><Icon name="image" /> {tr('qr.pickImage')}</button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { void fromImage(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {result !== null && (isProtectedPayload(result) ? <ProtectedResult payload={result} /> : <PlainResult value={result} onCopy={() => toast(tr('qr.copied'))} />)}
    </section>
  )
}

function PlainResult({ value, onCopy }: { value: string; onCopy: () => void }) {
  const isUrl = /^https?:\/\//i.test(value)
  return (
    <div className="stack">
      <div className="result-box">{value}</div>
      <div className="row">
        <button type="button" className="btn btn-soft btn-sm" onClick={() => navigator.clipboard.writeText(value).then(onCopy)}><Icon name="copy" /> {tr('ocr.copy')}</button>
        {isUrl && (
          <a className="btn btn-outline btn-sm" href={value} target="_blank" rel="noopener noreferrer nofollow">{tr('qr.openLink')}</a>
        )}
      </div>
    </div>
  )
}

function ProtectedResult({ payload }: { payload: string }) {
  const [password, setPassword] = useState('')
  const [plain, setPlain] = useState<string | null>(null)
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)
  if (plain !== null) return <PlainResult value={plain} onCopy={() => {}} />
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
