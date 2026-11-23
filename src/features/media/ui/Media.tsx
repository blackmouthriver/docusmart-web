// Audio y video (W-132): video a MP3, convertir, recortar y comprimir, en el navegador.
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { go } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented } from '../../../shared/ui/ui'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { download, formatBytes, isOwnBlobUrl } from '../../../shared/files/files'
import { bundleFiles } from '../../../shared/files/share'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import {
  AUDIO_FORMATS,
  GIF_FPS,
  GIF_MAX_SECONDS,
  GIF_WIDTHS,
  MAX_BATCH,
  MAX_MERGE,
  SIZE_TARGETS,
  isBatchTool,
  isVideoOnly,
  rotateVideo,
  type SizeTargetId,
  type VideoRotation,
  MAX_HEIGHTS,
  MEDIA_TOOLS,
  VIDEO_FORMATS,
  acceptFor,
  accepts,
  checkTrim,
  formatTime,
  keepSmaller,
  mediaKind,
  savedPercent,
  trimFormat,
  type AudioFormat,
  type CompressLevel,
  type MaxHeight,
  type MediaFailure,
  type MediaToolId,
  type VideoFormat,
} from '../core/media'
import type { MediaInfo, MediaJob } from '../infra/mediaRun'

const TOOL_INFO: Record<MediaToolId, { name: MessageKey; desc: MessageKey; icon: IconName; cls: string }> = {
  audio: { name: 'tools.media.audio', desc: 'tools.media.audio.desc', icon: 'music', cls: 'ico-violet' },
  convertir: { name: 'tools.media.convertir', desc: 'tools.media.convertir.desc', icon: 'convert', cls: 'ico-blue' },
  recortar: { name: 'tools.media.recortar', desc: 'tools.media.recortar.desc', icon: 'scissors', cls: 'ico-cyan' },
  comprimir: { name: 'tools.media.comprimir', desc: 'tools.media.comprimir.desc', icon: 'compress', cls: 'ico-red' },
  girar: { name: 'tools.media.girar', desc: 'tools.media.girar.desc', icon: 'rotate', cls: 'ico-green' },
  gif: { name: 'tools.media.gif', desc: 'tools.media.gif.desc', icon: 'image', cls: 'ico-violet' },
  unir: { name: 'tools.media.unir', desc: 'tools.media.unir.desc', icon: 'merge', cls: 'ico-blue' },
}

/** Resultado de un archivo de un lote: el nuevo o el motivo por el que no se pudo. */
type BatchResult = { source: File; file?: File; error?: string }

const FAILURE: Record<MediaFailure, MessageKey> = {
  'unsupported-browser': 'media.err.browser',
  'unsupported-file': 'media.err.file',
  'no-codec': 'media.err.codec',
  'no-audio': 'media.err.noAudio',
  'no-video': 'media.err.noVideo',
  'too-small': 'media.err.tooSmall',
  canceled: 'media.canceled',
  failed: 'media.err.failed',
}

const isMediaTool = (id?: string): id is MediaToolId => !!id && (MEDIA_TOOLS as readonly string[]).includes(id)

// Audio a texto (W-133) vive en su propio módulo: se carga solo al abrirlo.
const TranscribeTool = lazy(() => import('../../transcribe/ui/Transcribe').then((m) => ({ default: m.TranscribeTool })))

export function MediaScreen({ sub }: { sub?: string }) {
  return (
    <>
      <HeroCard title={tr('nav.media')} subtitle={tr('media.heroSub')} />
      {sub === 'texto' ? (
        <>
          <BackButton label={tr('media.back')} onClick={() => go('multimedia')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{tr('tools.stt')}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{tr('tools.stt.desc')}</p>
          <Suspense fallback={null}>
            <TranscribeTool />
          </Suspense>
        </>
      ) : isMediaTool(sub) ? (
        <>
          <BackButton label={tr('media.back')} onClick={() => go('multimedia')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{tr(TOOL_INFO[sub].name)}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{tr(TOOL_INFO[sub].desc)}</p>
          <MediaTool id={sub} />
        </>
      ) : (
        <>
          <h2 className="section-title">{tr('pdf.choose')}</h2>
          <div className="tool-grid">
            {MEDIA_TOOLS.map((id) => (
              <button key={id} type="button" className="tool-card" onClick={() => go('multimedia', id)}>
                <span className={'ico ' + TOOL_INFO[id].cls}><Icon name={TOOL_INFO[id].icon} /></span>
                <span>
                  <b>{tr(TOOL_INFO[id].name)}</b>
                  <small>{tr(TOOL_INFO[id].desc)}</small>
                </span>
              </button>
            ))}
            <button type="button" className="tool-card" onClick={() => go('multimedia', 'texto')}>
              <span className="ico ico-green"><Icon name="volume" /></span>
              <span>
                <b>{tr('tools.stt')}</b>
                <small>{tr('tools.stt.desc')}</small>
              </span>
            </button>
          </div>
        </>
      )}
    </>
  )
}

/** URL blob: de este sitio para reproducir el archivo, re-empaquetado con un tipo de audio o video. */
function useMediaUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(null)
    if (!file) return
    const kind = mediaKind(file.name, file.type) ?? 'video'
    const type = file.type === 'image/gif' || file.type.startsWith(kind + '/') ? file.type : kind === 'audio' ? 'audio/mpeg' : 'video/mp4'
    const u = URL.createObjectURL(new Blob([file], { type }))
    if (isOwnBlobUrl(u)) setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function Player({ file, playerRef, label, style }: { file: File; playerRef?: React.RefObject<HTMLMediaElement | null>; label: string; style?: React.CSSProperties }) {
  const url = useMediaUrl(file)
  if (!url) return null
  if (file.type === 'image/gif') return <img className="media-player" src={url} alt={label} />
  return mediaKind(file.name, file.type) === 'audio' ? (
    <audio ref={playerRef as React.RefObject<HTMLAudioElement>} className="media-player" src={url} controls preload="metadata" aria-label={label} />
  ) : (
    <video ref={playerRef as React.RefObject<HTMLVideoElement>} className="media-player" src={url} controls preload="metadata" playsInline aria-label={label} style={style} />
  )
}

export function MediaTool({ id }: { id: MediaToolId }) {
  const [file, setFile] = useState<File | null>(null)
  const [info, setInfo] = useState<MediaInfo | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ file: File; before: number; original: boolean; missed?: boolean } | null>(null)
  const abort = useRef<AbortController | null>(null)
  const player = useRef<HTMLMediaElement | null>(null)
  // Varios archivos (W-147.4): en lote (audio, convertir, comprimir) o para unir videos.
  const [queue, setQueue] = useState<File[]>([])
  const [batch, setBatch] = useState<{ results: BatchResult[]; zip: File | null } | null>(null)
  const [current, setCurrent] = useState(0)
  const multi = id === 'unir' || queue.length > 1

  const [audioFormat, setAudioFormat] = useState<AudioFormat>('mp3')
  const [quality, setQuality] = useState<'medium' | 'high'>('medium')
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('mp4')
  const [mute, setMute] = useState(false)
  const [start, setStart] = useState('0:00')
  const [end, setEnd] = useState('')
  const [level, setLevel] = useState<CompressLevel>('media')
  const [maxHeight, setMaxHeight] = useState<MaxHeight>(720)
  /** Comprimir a un tamaño (W-146.9): '' sin límite, un servicio o 'other' con MB a mano. */
  const [target, setTarget] = useState<'' | SizeTargetId | 'other'>('')
  const [otherMb, setOtherMb] = useState('8')
  const [rotation, setRotation] = useState<VideoRotation>(0)
  const [flip, setFlip] = useState(false)
  const [gifWidth, setGifWidth] = useState<number>(480)
  const [gifFps, setGifFps] = useState<number>(10)
  const targetMb = target === 'other' ? Math.max(0.1, Number(otherMb.replace(',', '.')) || 0) : (SIZE_TARGETS.find((t) => t.id === target)?.mb ?? 0)

  const [supported, setSupported] = useState(true)
  useEffect(() => {
    void import('../infra/mediaRun').then((m) => setSupported(m.mediaSupported()))
    return () => abort.current?.abort()
  }, [])

  const reset = () => {
    setResult(null)
    setBatch(null)
  }

  /** Varios archivos: los que no sirven se avisan y no entran; hasta el máximo de la herramienta. */
  const pickMany = (fs: File[]) => {
    const max = id === 'unir' ? MAX_MERGE : MAX_BATCH
    const ok = fs.filter((f) => accepts(id, f.name, f.type))
    const all = [...queue, ...ok].slice(0, max)
    setError(ok.length < fs.length ? tr('media.someSkipped', { n: fs.length - ok.length }) : all.length < queue.length + ok.length ? tr('media.tooMany', { n: max }) : null)
    setQueue(all)
    setFile(null)
    setInfo(null)
    reset()
  }
  const moveQueued = (i: number, d: -1 | 1) => {
    setQueue((q) => {
      const c = q.slice()
      ;[c[i], c[i + d]] = [c[i + d], c[i]]
      return c
    })
    reset()
  }

  const pick = async (f: File) => {
    abort.current?.abort()
    setError(null)
    setResult(null)
    setInfo(null)
    setFile(null)
    if (!accepts(id, f.name, f.type)) {
      setError(tr(isVideoOnly(id) ? 'media.err.wrongVideo' : 'media.err.wrongMedia'))
      return
    }
    setFile(f)
    setReading(true)
    try {
      const m = await import('../infra/mediaRun')
      const i = await m.probe(f)
      setInfo(i)
      setStart('0:00')
      setEnd(formatTime(i.duration))
    } catch (e) {
      setError(tr(e instanceof Error && 'reason' in e ? FAILURE[(e as { reason: MediaFailure }).reason] : 'media.err.file'))
    } finally {
      setReading(false)
    }
  }

  const trim = info && (id === 'recortar' || id === 'gif') ? checkTrim(start, end, info.duration) : null
  const trimError = trim && !trim.ok ? (trim.reason === 'format' ? tr('media.badTime') : trim.reason === 'order' ? tr('media.badOrder') : tr('media.beyond', { time: formatTime(info!.duration) })) : null

  const job = (): MediaJob | null => jobFor(file)
  const jobFor = (file: File | null | undefined): MediaJob | null => {
    if (!file) return null
    if (id === 'audio') return { tool: 'audio', format: audioFormat, quality }
    if (id === 'convertir') return { tool: 'convertir', format: videoFormat, mute }
    if (id === 'comprimir') return { tool: 'comprimir', level, maxHeight, ...(targetMb && { targetBytes: Math.round(targetMb * 1024 * 1024) }) }
    if (id === 'girar') return rotation || flip ? { tool: 'girar', rotate: rotation, flip } : null
    if (id === 'recortar' && trim?.ok) return { tool: 'recortar', format: trimFormat(file.name, file.type), start: trim.start, end: trim.end }
    return null
  }

  /** Lote: uno tras otro con las mismas opciones; los que fallan no detienen a los demás. */
  const runBatch = async () => {
    const j = jobFor(queue[0])
    if (!j) return
    setError(null)
    setBatch(null)
    setBusy(true)
    setProgress(0)
    const ctrl = new AbortController()
    abort.current = ctrl
    const results: BatchResult[] = []
    try {
      const m = await import('../infra/mediaRun')
      const names = { audio: tr('file.audio'), convertir: tr('file.converted'), recortar: tr('file.trimmed'), comprimir: tr('file.compressedVideo'), girar: tr('file.rotatedVideo') }
      for (const [i, f] of queue.entries()) {
        if (ctrl.signal.aborted) break
        setCurrent(i + 1)
        try {
          const out = await m.runMedia(f, j, names, (p) => setProgress((i + p) / queue.length), ctrl.signal)
          results.push({ source: f, file: id === 'comprimir' && !keepSmaller(f.size, out.size) ? f : out })
        } catch (e) {
          const reason = e instanceof Error && 'reason' in e ? (e as { reason: MediaFailure }).reason : 'failed'
          if (reason === 'canceled') break
          results.push({ source: f, error: tr(FAILURE[reason]) })
        }
      }
      const done = results.flatMap((r) => (r.file ? [r.file] : []))
      setBatch({ results, zip: done.length > 1 ? await bundleFiles(done, `docusmart-${id}.zip`) : null })
      track('media_done', { tool: id, files: queue.length, failed: results.filter((r) => r.error).length })
    } finally {
      setBusy(false)
      setCurrent(0)
      abort.current = null
    }
  }

  /** Unir videos: uno solo al final, en el orden de la lista. */
  const runJoin = async () => {
    if (queue.length < 2) return
    setError(null)
    setResult(null)
    setBusy(true)
    setProgress(0)
    const ctrl = new AbortController()
    abort.current = ctrl
    try {
      const m = await import('../infra/mediaRun')
      const out = await m.runMerge(queue, tr('file.merged'), setProgress, ctrl.signal)
      setResult({ file: out, before: queue.reduce((n, f) => n + f.size, 0), original: false })
      track('media_done', { tool: 'unir', files: queue.length })
    } catch (e) {
      const reason = e instanceof Error && 'reason' in e ? (e as { reason: MediaFailure }).reason : 'failed'
      if (reason !== 'canceled') setError(tr(FAILURE[reason]))
      track('media_failed', { tool: 'unir', reason })
    } finally {
      setBusy(false)
      abort.current = null
    }
  }

  const run = async () => {
    if (id === 'unir') return runJoin()
    if (multi) return runBatch()
    const j = job()
    if (!file || (!j && id !== 'gif') || (id === 'gif' && !trim?.ok)) return
    setError(null)
    setResult(null)
    setBusy(true)
    setProgress(0)
    const ctrl = new AbortController()
    abort.current = ctrl
    try {
      const m = await import('../infra/mediaRun')
      const names = { audio: tr('file.audio'), convertir: tr('file.converted'), recortar: tr('file.trimmed'), comprimir: tr('file.compressedVideo'), girar: tr('file.rotatedVideo') }
      const out =
        id === 'gif' && trim?.ok
          ? await m.runGif(file, { start: trim.start, end: trim.end, width: gifWidth, fps: gifFps }, tr('file.gif'), setProgress, ctrl.signal)
          : await m.runMedia(file, j!, names, setProgress, ctrl.signal)
      // Comprimir: si no se gana nada, se entrega el original.
      const original = id === 'comprimir' && !keepSmaller(file.size, out.size)
      setResult({ file: original ? file : out, before: file.size, original, missed: id === 'comprimir' && !!targetMb && (original ? file : out).size > targetMb * 1024 * 1024 })
      track('media_done', { tool: id, format: out.type })
    } catch (e) {
      const reason = e instanceof Error && 'reason' in e ? (e as { reason: MediaFailure }).reason : 'failed'
      if (reason !== 'canceled') setError(tr(FAILURE[reason]))
      track('media_failed', { tool: id, reason })
    } finally {
      setBusy(false)
      abort.current = null
    }
  }

  const mark = (which: 'start' | 'end') => {
    const t = player.current?.currentTime
    if (t === undefined) return
    if (which === 'start') setStart(formatTime(t))
    else setEnd(formatTime(t))
    reset()
  }

  if (!supported) return <Notice kind="error">{tr('media.err.browser')}</Notice>

  const videoOnly = isVideoOnly(id)
  const ready = id === 'unir' ? queue.length >= 2 : multi ? !!jobFor(queue[0]) : !!file && !!info && !reading && (id === 'gif' ? !!trim?.ok : !!job())
  const turn = `rotate(${rotation}deg) scaleX(${flip ? -1 : 1})`

  return (
    <div className="stack">
      <div className="card stack">
        {multi && (
          <>
            <ul className="file-list" style={{ marginTop: 0 }}>
              {queue.map((f, i) => (
                <FileRow
                  key={f.name + i}
                  file={f}
                  extra={busy && current === i + 1 ? tr('media.working', { pct: Math.round(((progress * queue.length) % 1) * 100) }) : undefined}
                  actions={
                    <>
                      {id === 'unir' && (
                        <>
                          <button type="button" className="icon-btn" aria-label={tr('conv.moveUp')} disabled={busy || i === 0} onClick={() => moveQueued(i, -1)}><Icon name="up" /></button>
                          <button type="button" className="icon-btn" aria-label={tr('conv.moveDown')} disabled={busy || i === queue.length - 1} onClick={() => moveQueued(i, 1)}><Icon name="downArrow" /></button>
                        </>
                      )}
                      <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} disabled={busy} onClick={() => { setQueue((q) => q.filter((_, k) => k !== i)); reset() }}><Icon name="close" /></button>
                    </>
                  }
                />
              ))}
            </ul>
            {id === 'unir' && queue.length === 1 && <small className="faint">{tr('media.joinNeedTwo')}</small>}
          </>
        )}
        {multi ? (
          !busy && <DropZone accept={acceptFor(id)} multiple onFiles={pickMany} title={tr(queue.length ? 'media.addMore' : 'media.pickVideos')} hint={tr(id === 'unir' ? 'media.joinHint' : 'media.batchHint')} />
        ) : !file ? (
          <DropZone accept={acceptFor(id)} multiple={isBatchTool(id)} onFiles={(fs) => (fs.length > 1 ? pickMany(fs) : fs[0] && void pick(fs[0]))} title={tr(videoOnly ? 'media.pickVideo' : 'media.pickMedia')} hint={tr(isBatchTool(id) ? 'media.batchHint' : videoOnly ? 'media.pickHintVideo' : 'media.pickHint')} />
        ) : (
          <>
            <ul className="file-list" style={{ marginTop: 0 }}>
              <FileRow
                file={file}
                extra={info ? [formatTime(info.duration), info.width ? `${info.width} × ${info.height}` : ''].filter(Boolean).join(' · ') : reading ? tr('media.reading') : undefined}
                actions={
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setFile(null); setInfo(null); setResult(null); setError(null) }}>
                    {tr('media.change')}
                  </button>
                }
              />
            </ul>
            {info && <Player file={file} playerRef={player} label={tr('media.original')} style={id === 'girar' ? { transform: turn, transition: 'transform .2s' } : undefined} />}
          </>
        )}

        {id === 'audio' && (
          <>
            <div className="field">
              <span>{tr('media.format')}</span>
              <Segmented label={tr('media.format')} value={audioFormat} onChange={(v: AudioFormat) => { setAudioFormat(v); reset() }} options={AUDIO_FORMATS.map((f) => ({ value: f, label: f.toUpperCase() }))} />
              {audioFormat === 'wav' && <small className="faint">{tr('media.wavNote')}</small>}
            </div>
            {audioFormat !== 'wav' && (
              <div className="field">
                <span>{tr('media.quality')}</span>
                <Segmented label={tr('media.quality')} value={quality} onChange={(v: 'medium' | 'high') => { setQuality(v); reset() }} options={[{ value: 'medium', label: tr('media.qNormal') }, { value: 'high', label: tr('media.qHigh') }]} />
              </div>
            )}
          </>
        )}

        {id === 'convertir' && (
          <>
            <div className="field">
              <span>{tr('media.format')}</span>
              <Segmented label={tr('media.format')} value={videoFormat} onChange={(v: VideoFormat) => { setVideoFormat(v); reset() }} options={VIDEO_FORMATS.map((f) => ({ value: f, label: f === 'mp4' ? 'MP4' : 'WebM' }))} />
              <small className="faint">{tr(videoFormat === 'mp4' ? 'media.mp4Note' : 'media.webmNote')}</small>
            </div>
            <label className="check">
              <input type="checkbox" checked={mute} onChange={(e) => { setMute(e.target.checked); reset() }} />
              <span>{tr('media.mute')}</span>
            </label>
          </>
        )}

        {id === 'girar' && info && (
          <>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => { setRotation((r) => rotateVideo(r, -90)); reset() }}><span className="icon-mirror"><Icon name="rotate" /></span> {tr('imgt.left')}</button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => { setRotation((r) => rotateVideo(r, 90)); reset() }}><Icon name="rotate" /> {tr('imgt.right')}</button>
              <button type="button" className="btn btn-soft btn-sm" aria-pressed={flip} onClick={() => { setFlip((f) => !f); reset() }}><Icon name="flip" /> {tr('imgt.mirror')}</button>
            </div>
            <small className="faint">{tr('media.rotateHint')}</small>
          </>
        )}

        {id === 'gif' && info && (
          <>
            <div className="field">
              <span aria-hidden="true">{tr('media.gifWidth')}</span>
              <Segmented label={tr('media.gifWidth')} value={String(gifWidth)} onChange={(v: string) => { setGifWidth(Number(v)); reset() }} options={GIF_WIDTHS.map((w) => ({ value: String(w), label: `${w} px` }))} />
            </div>
            <div className="field">
              <span aria-hidden="true">{tr('media.gifFps')}</span>
              <Segmented label={tr('media.gifFps')} value={String(gifFps)} onChange={(v: string) => { setGifFps(Number(v)); reset() }} options={GIF_FPS.map((f) => ({ value: String(f), label: tr('media.fps', { n: f }) }))} />
            </div>
          </>
        )}

        {(id === 'recortar' || id === 'gif') && info && (
          <div className="stack" style={{ gap: 10 }}>
            <div className="media-trim">
              <label className="field">
                <span>{tr('media.start')}</span>
                <input className="input" inputMode="decimal" value={start} onChange={(e) => { setStart(e.target.value); reset() }} />
              </label>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => mark('start')}>{tr('media.markStart')}</button>
              <label className="field">
                <span>{tr('media.end')}</span>
                <input className="input" inputMode="decimal" value={end} onChange={(e) => { setEnd(e.target.value); reset() }} />
              </label>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => mark('end')}>{tr('media.markEnd')}</button>
            </div>
            <small className="faint">{tr('media.timeHint')}</small>
            {trim?.ok && <small>{tr('media.selection', { time: formatTime(trim.end - trim.start) })}</small>}
            {id === 'gif' && trim?.ok && trim.end - trim.start > GIF_MAX_SECONDS && <small className="faint">{tr('media.gifMax', { n: GIF_MAX_SECONDS })}</small>}
            {trimError && <Notice kind="error">{trimError}</Notice>}
          </div>
        )}

        {id === 'comprimir' && (
          <div className="field">
            <span aria-hidden="true">{tr('media.target')}</span>
            <Segmented
              label={tr('media.target')}
              value={target}
              onChange={(v: '' | SizeTargetId | 'other') => { setTarget(v); reset() }}
              options={[{ value: '', label: tr('media.noTarget') }, ...SIZE_TARGETS.map((t) => ({ value: t.id, label: tr(`media.target.${t.id}` as MessageKey, { n: t.mb }) })), { value: 'other', label: tr('imgt.otherSize') }]}
            />
            {target === 'other' && (
              <label className="field">
                <span>{tr('media.targetMb')}</span>
                <input className="input" type="number" min={0.1} max={4000} step={0.1} inputMode="decimal" value={otherMb} onChange={(e) => { setOtherMb(e.target.value); reset() }} />
              </label>
            )}
            {targetMb > 0 && <small className="faint">{tr('media.targetHint')}</small>}
          </div>
        )}
        {id === 'comprimir' && !targetMb && (
          <>
            <div className="field">
              <span>{tr('media.level')}</span>
              <Segmented label={tr('media.level')} value={level} onChange={(v: CompressLevel) => { setLevel(v); reset() }} options={[{ value: 'ligera', label: tr('media.lvlLight') }, { value: 'media', label: tr('media.lvlMid') }, { value: 'fuerte', label: tr('media.lvlStrong') }]} />
              <small className="faint">{tr(level === 'ligera' ? 'media.lvlLightHint' : level === 'media' ? 'media.lvlMidHint' : 'media.lvlStrongHint')}</small>
            </div>
            <label className="field">
              <span>{tr('media.maxSize')}</span>
              <select className="input" value={maxHeight} onChange={(e) => { setMaxHeight(Number(e.target.value) as MaxHeight); reset() }}>
                {MAX_HEIGHTS.map((h) => (
                  <option key={h} value={h}>{h ? `${h}p` : tr('media.sizeOriginal')}</option>
                ))}
              </select>
            </label>
          </>
        )}

        <small className="faint">{tr('media.privacy')}</small>
        {error && <Notice kind="error">{error}</Notice>}
        {busy && (
          <div className="stack" style={{ gap: 6 }}>
            <Progress value={progress} />
            <small className="faint">{multi && id !== 'unir' && current ? tr('media.fileOf', { n: current, total: queue.length }) + ' · ' : ''}{tr('media.working', { pct: Math.round(progress * 100) })} {tr('media.workHint')}</small>
          </div>
        )}
        <div className="row row-end" style={{ gap: 8 }}>
          {busy && <button type="button" className="btn btn-outline" onClick={() => abort.current?.abort()}>{tr('media.cancel')}</button>}
          <BusyButton busy={busy} disabled={!ready} onClick={() => void run()} icon={TOOL_INFO[id].icon}>
            {tr(`media.go.${id}` as MessageKey)}
          </BusyButton>
        </div>
      </div>

      {batch && (
        <div className="card stack" aria-live="polite">
          <h3>{tr('media.batchReady', { n: batch.results.filter((r) => r.file).length, total: batch.results.length })}</h3>
          <ul className="media-batch">
            {batch.results.map((r, i) => (
              <li key={i} className={r.error ? 'is-failed' : undefined}>
                <span className="media-batch-name">{r.file?.name ?? r.source.name}</span>
                {r.file ? (
                  <>
                    <small className="faint">{r.file === r.source ? tr('media.notSmallerShort') : id === 'comprimir' ? `${formatBytes(r.source.size)} → ${formatBytes(r.file.size)}` : formatBytes(r.file.size)}</small>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => download(r.file!, r.file!.name)}><Icon name="download" /> {tr('media.download')}</button>
                  </>
                ) : (
                  <small style={{ color: 'var(--danger)' }}>{r.error}</small>
                )}
              </li>
            ))}
          </ul>
          {batch.zip && <SaveOptions file={batch.zip} toolName={`media_${id}_batch`} />}
        </div>
      )}

      {result && (
        <div className="card stack" aria-live="polite">
          <h3>{tr('media.ready')}</h3>
          {result.missed && <Notice kind="info">{tr('media.targetMissed', { size: formatBytes(targetMb * 1024 * 1024), got: formatBytes(result.file.size) })}</Notice>}
          {result.original ? (
            <Notice kind="info">{tr('media.notSmaller')}</Notice>
          ) : (
            id === 'comprimir' && <p className="muted">{tr('media.saved', { before: formatBytes(result.before), after: formatBytes(result.file.size), pct: savedPercent(result.before, result.file.size) })}</p>
          )}
          <Player file={result.file} label={tr('media.result')} />
          <SaveOptions file={result.file} toolName={`media_${id}`} />
        </div>
      )}
    </div>
  )
}
