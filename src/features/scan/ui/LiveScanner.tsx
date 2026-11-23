// Cámara en vivo del escáner (W-147.1): muestra la hoja detectada sobre el video y toma la foto
// sola cuando se queda quieta, una página tras otra. Todo en el navegador: el video no sale del equipo.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../../shared/ui/Icon'
import { tr } from '../../../shared/i18n/translate'
import type { Quad } from '../core/scan'
import { afterManual, initialLive, stepLive, type LiveStatus } from '../core/liveCapture'

/** Cada cuánto se analiza un cuadro. */
const ANALYZE_MS = 120

const STATUS_KEY = {
  searching: 'scan.live.searching',
  hold: 'scan.live.hold',
  next: 'scan.live.next',
} as const

export function LiveScanner({ onCapture, onClose, onSystemCamera }: {
  /** Una foto nueva (en resolución completa). */
  onCapture: (photo: File) => void
  onClose: () => void
  /** Usar la cámara del sistema en vez de la del navegador. */
  onSystemCamera: () => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const live = useRef(initialLive())
  const quadRef = useRef<Quad | null>(null)
  const shutter = useRef<HTMLButtonElement>(null)
  const [quad, setQuad] = useState<Quad | null>(null)
  const [status, setStatus] = useState<LiveStatus>('searching')
  const [progress, setProgress] = useState(0)
  const [auto, setAuto] = useState(true)
  const autoRef = useRef(auto)
  autoRef.current = auto
  const [count, setCount] = useState(0)
  const [ratio, setRatio] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const [torch, setTorchState] = useState<boolean | null>(null)
  const [flash, setFlash] = useState(0)
  const capturing = useRef(false)

  const capture = async (manual: boolean) => {
    const v = video.current
    if (!v || !v.videoWidth || capturing.current) return
    capturing.current = true
    try {
      const { grabFrame } = await import('../infra/liveCamera')
      const blob = await grabFrame(v)
      if (manual) live.current = afterManual(live.current, quadRef.current)
      setFlash((n) => n + 1)
      setCount((n) => n + 1)
      navigator.vibrate?.(40)
      onCapture(new File([blob], `${tr('file.scan')}-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    } finally {
      capturing.current = false
    }
  }
  const captureRef = useRef(capture)
  captureRef.current = capture

  useEffect(() => {
    let stopped = false
    let timer = 0
    const canvas = document.createElement('canvas')
    void (async () => {
      const cam = await import('../infra/liveCamera')
      try {
        const s = await cam.openCamera()
        if (stopped) return cam.stopCamera(s)
        stream.current = s
        const v = video.current!
        v.srcObject = s
        await v.play()
        setRatio(v.videoWidth / Math.max(1, v.videoHeight))
        setTorchState(cam.hasTorch(s) ? false : null)
      } catch {
        if (!stopped) setError(true)
        return
      }
      const tick = () => {
        if (stopped) return
        const v = video.current
        if (v && v.readyState >= 2 && !capturing.current) {
          const q = cam.analyzeFrame(v, canvas)
          quadRef.current = q
          const step = stepLive(live.current, q)
          // Sin captura automática se sigue mostrando la hoja, pero no se toma sola.
          live.current = autoRef.current ? step.state : { ...step.state, armed: true, steady: 0 }
          setQuad(q)
          setStatus(autoRef.current || step.status !== 'hold' ? step.status : 'searching')
          setProgress(autoRef.current ? step.progress : 0)
          if (step.capture && autoRef.current) void captureRef.current(false)
        }
        timer = window.setTimeout(tick, ANALYZE_MS)
      }
      tick()
    })()
    shutter.current?.focus()
    return () => {
      stopped = true
      clearTimeout(timer)
      canvas.width = canvas.height = 0
      void import('../infra/liveCamera').then((m) => m.stopCamera(stream.current))
    }
  }, [])

  // Sin desplazar la página de atrás mientras la cámara ocupa la pantalla.
  useEffect(() => {
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleTorch = async () => {
    const { setTorch } = await import('../infra/liveCamera')
    try {
      await setTorch(stream.current, !torch)
      setTorchState(!torch)
    } catch {
      setTorchState(null)
    }
  }

  const pts = quad?.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')
  const hint = !quad && status === 'searching' ? tr('scan.live.tip') : tr(STATUS_KEY[status])

  // En el body, por encima de la barra de secciones y del asistente.
  return createPortal(
    <div className="live-scan" role="dialog" aria-modal="true" aria-label={tr('scan.live.title')}>
      <div className="live-scan-top">
        <button type="button" className="live-scan-icon" aria-label={tr('scan.live.close')} onClick={onClose}><Icon name="close" /></button>
        <button type="button" className="btn btn-ghost btn-sm live-scan-system" onClick={onSystemCamera}><Icon name="camera" /> {tr('scan.live.system')}</button>
        {torch !== null && (
          <button type="button" className={'live-scan-icon' + (torch ? ' is-on' : '')} aria-label={tr('scan.live.torch')} aria-pressed={torch} onClick={() => void toggleTorch()}><Icon name="flash" /></button>
        )}
      </div>

      <div className="live-scan-view">
        {error ? (
          <div className="live-scan-error stack">
            <p>{tr('scan.live.error')}</p>
            <button type="button" className="btn btn-primary" onClick={onSystemCamera}><Icon name="camera" /> {tr('scan.live.system')}</button>
          </div>
        ) : (
          <div className="live-scan-stage" style={ratio ? { aspectRatio: String(ratio), width: `min(100cqw, ${(ratio * 100).toFixed(2)}cqh)`, maxHeight: 'none' } : undefined}>
            <video ref={video} muted playsInline aria-label={tr('scan.live.title')} />
            {pts && (
              <svg className="live-scan-quad" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polygon points={pts} className={progress > 0 ? 'is-steady' : ''} vectorEffect="non-scaling-stroke" />
              </svg>
            )}
            {flash > 0 && <span key={flash} className="live-scan-flash" aria-hidden="true" />}
          </div>
        )}
      </div>

      <p className="live-scan-hint" role="status" aria-live="polite">{error ? '' : hint}</p>

      <div className="live-scan-bar">
        <label className="live-scan-auto">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          <span>{tr('scan.live.auto')}</span>
        </label>
        <button
          ref={shutter}
          type="button"
          className="live-scan-shutter"
          aria-label={tr('scan.live.shutter')}
          disabled={error || !ratio}
          style={{ ['--p' as string]: String(progress) }}
          onClick={() => void capture(true)}
        />
        <button type="button" className="btn btn-primary live-scan-done" onClick={onClose}>
          {count ? tr('scan.live.doneN', { n: count }) : tr('scan.live.done')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
