import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, HeroCard, Notice, Segmented } from '../components/ui'
import { download } from '../lib/files'
import { PREFIX, decrypt, encrypt, isProtectedPayload } from '../lib/qrCrypto'
import { track } from '../../shared/analytics'

const contentType = (s: string) => (/^https?:\/\//i.test(s) ? 'url' : /^WIFI:/i.test(s) ? 'wifi' : 'text')

export function QrScreen() {
  return (
    <>
      <HeroCard title="Códigos QR" subtitle="Lee y crea códigos QR, también protegidos con contraseña." />
      <div className="two-col" style={{ marginTop: 16 }}>
        <CreateQr />
        <ReadQr />
      </div>
    </>
  )
}

function CreateQr() {
  const { toast } = useApp()
  const [text, setText] = useState('')
  const [protect, setProtect] = useState(false)
  const [password, setPassword] = useState('')
  const [img, setImg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setBusy(true)
    try {
      const payload = protect ? PREFIX + (await encrypt(text, password)) : text
      setImg(await QRCode.toDataURL(payload, { width: 640, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0B1020', light: '#FFFFFF' } }))
      track('qr_created', { qr_content_type: contentType(text), has_password: protect })
    } catch {
      toast('El texto es demasiado largo para un código QR.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card stack" aria-labelledby="qr-create">
      <div className="row">
        <span className="ico ico-cyan"><Icon name="qr" /></span>
        <h3 id="qr-create">Crear QR</h3>
      </div>
      <label className="field">
        <span>Texto o enlace</span>
        <textarea className="textarea" style={{ minHeight: 96 }} value={text} maxLength={900} placeholder="https://… o cualquier texto" onChange={(e) => { setText(e.target.value); setImg(null) }} />
      </label>
      <Segmented
        label="Tipo de QR"
        value={protect ? 'protected' : 'open'}
        onChange={(v) => { setProtect(v === 'protected'); setImg(null) }}
        options={[{ value: 'open', label: 'Normal' }, { value: 'protected', label: 'Protegido' }]}
      />
      {protect && (
        <label className="field">
          <span>Contraseña para abrirlo</span>
          <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setImg(null) }} />
          <small className="faint">Cifrado AES-256. Se puede abrir en la app de DocuSmart o aquí con esta contraseña.</small>
        </label>
      )}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!text.trim() || (protect && password.length < 4)} onClick={create} icon="qr">
          Generar QR
        </BusyButton>
      </div>
      {img && (
        <div className="qr-preview">
          <img src={img} alt="Código QR generado" />
          <button
            type="button"
            className="btn btn-soft"
            style={{ marginTop: 14 }}
            onClick={async () => download(await (await fetch(img)).blob(), protect ? 'docusmart-qr-protegido.png' : 'docusmart-qr.png')}
          >
            <Icon name="download" /> Descargar PNG
          </button>
        </div>
      )}
    </section>
  )
}

function ReadQr() {
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
      setError('No se pudo usar la cámara. Revisa el permiso del navegador o lee el QR desde una imagen.')
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
      if (data === null) setError('No se encontró un código QR en esa imagen.')
      else found(data)
    } catch {
      setError('No se pudo leer la imagen.')
    }
  }

  return (
    <section className="card stack" aria-labelledby="qr-read">
      <div className="row">
        <span className="ico ico-blue"><Icon name="camera" /></span>
        <h3 id="qr-read">Leer QR</h3>
      </div>
      <Segmented label="Origen" value={mode} onChange={(m) => { stop(); setMode(m) }} options={[{ value: 'camera', label: 'Cámara' }, { value: 'image', label: 'Desde imagen' }]} />

      {mode === 'camera' ? (
        <>
          <div className="camera" hidden={!scanning}>
            <video ref={video} muted playsInline />
            <div className="frame" />
            <div className="scanline" />
          </div>
          <div className="row">
            {scanning ? (
              <button type="button" className="btn btn-soft" onClick={stop}><Icon name="stop" /> Detener</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={startCamera}><Icon name="camera" /> Abrir cámara</button>
            )}
          </div>
        </>
      ) : (
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => fileInput.current?.click()}><Icon name="image" /> Elegir imagen</button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { fromImage(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {result !== null && (isProtectedPayload(result) ? <ProtectedResult payload={result} /> : <PlainResult value={result} onCopy={() => toast('Copiado')} />)}
    </section>
  )
}

function PlainResult({ value, onCopy }: { value: string; onCopy: () => void }) {
  const isUrl = /^https?:\/\//i.test(value)
  return (
    <div className="stack">
      <div className="result-box">{value}</div>
      <div className="row">
        <button type="button" className="btn btn-soft btn-sm" onClick={() => navigator.clipboard.writeText(value).then(onCopy)}><Icon name="copy" /> Copiar</button>
        {isUrl && (
          <a className="btn btn-outline btn-sm" href={value} target="_blank" rel="noopener noreferrer nofollow">Abrir enlace</a>
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
      <Notice kind="info">Este QR está protegido. Escribe la contraseña para ver su contenido.</Notice>
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
        <input className="input" style={{ flex: '1 1 180px' }} type="password" aria-label="Contraseña del QR" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={!password || busy}>{busy ? <span className="spinner" /> : <Icon name="lock" />} Desbloquear</button>
      </form>
      {wrong && <Notice kind="error">Contraseña incorrecta.</Notice>}
    </div>
  )
}
