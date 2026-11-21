// Audio y video (W-132): video a MP3, convertir, recortar y comprimir, en el navegador.
import { useEffect, useRef, useState } from 'react'
import { go } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented } from '../../../shared/ui/ui'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { formatBytes, isOwnBlobUrl } from '../../../shared/files/files'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import {
  AUDIO_FORMATS,
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
}

const FAILURE: Record<MediaFailure, MessageKey> = {
  'unsupported-browser': 'media.err.browser',
  'unsupported-file': 'media.err.file',
  'no-codec': 'media.err.codec',
  'no-audio': 'media.err.noAudio',
  'no-video': 'media.err.noVideo',
  canceled: 'media.canceled',
  failed: 'media.err.failed',
}

const isMediaTool = (id?: string): id is MediaToolId => !!id && (MEDIA_TOOLS as readonly string[]).includes(id)

export function MediaScreen({ sub }: { sub?: string }) {
  return (
    <>
      <HeroCard title={tr('nav.media')} subtitle={tr('media.heroSub')} />
      {isMediaTool(sub) ? (
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
    const type = file.type.startsWith(kind + '/') ? file.type : kind === 'audio' ? 'audio/mpeg' : 'video/mp4'
    const u = URL.createObjectURL(new Blob([file], { type }))
    if (isOwnBlobUrl(u)) setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function Player({ file, playerRef, label }: { file: File; playerRef?: React.RefObject<HTMLMediaElement | null>; label: string }) {
  const url = useMediaUrl(file)
  if (!url) return null
  return mediaKind(file.name, file.type) === 'audio' ? (
    <audio ref={playerRef as React.RefObject<HTMLAudioElement>} className="media-player" src={url} controls preload="metadata" aria-label={label} />
  ) : (
    <video ref={playerRef as React.RefObject<HTMLVideoElement>} className="media-player" src={url} controls preload="metadata" playsInline aria-label={label} />
  )
}

export function MediaTool({ id }: { id: MediaToolId }) {
  const [file, setFile] = useState<File | null>(null)
  const [info, setInfo] = useState<MediaInfo | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ file: File; before: number; original: boolean } | null>(null)
  const abort = useRef<AbortController | null>(null)
  const player = useRef<HTMLMediaElement | null>(null)

  const [audioFormat, setAudioFormat] = useState<AudioFormat>('mp3')
  const [quality, setQuality] = useState<'medium' | 'high'>('medium')
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('mp4')
  const [mute, setMute] = useState(false)
  const [start, setStart] = useState('0:00')
  const [end, setEnd] = useState('')
  const [level, setLevel] = useState<CompressLevel>('media')
  const [maxHeight, setMaxHeight] = useState<MaxHeight>(720)

  const [supported, setSupported] = useState(true)
  useEffect(() => {
    void import('../infra/mediaRun').then((m) => setSupported(m.mediaSupported()))
    return () => abort.current?.abort()
  }, [])

  const reset = () => setResult(null)

  const pick = async (f: File) => {
    abort.current?.abort()
    setError(null)
    setResult(null)
    setInfo(null)
    setFile(null)
    if (!accepts(id, f.name, f.type)) {
      setError(tr(id === 'convertir' || id === 'comprimir' ? 'media.err.wrongVideo' : 'media.err.wrongMedia'))
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

  const trim = info && id === 'recortar' ? checkTrim(start, end, info.duration) : null
  const trimError = trim && !trim.ok ? (trim.reason === 'format' ? tr('media.badTime') : trim.reason === 'order' ? tr('media.badOrder') : tr('media.beyond', { time: formatTime(info!.duration) })) : null

  const job = (): MediaJob | null => {
    if (!file) return null
    if (id === 'audio') return { tool: 'audio', format: audioFormat, quality }
    if (id === 'convertir') return { tool: 'convertir', format: videoFormat, mute }
    if (id === 'comprimir') return { tool: 'comprimir', level, maxHeight }
    if (trim?.ok) return { tool: 'recortar', format: trimFormat(file.name, file.type), start: trim.start, end: trim.end }
    return null
  }

  const run = async () => {
    const j = job()
    if (!file || !j) return
    setError(null)
    setResult(null)
    setBusy(true)
    setProgress(0)
    const ctrl = new AbortController()
    abort.current = ctrl
    try {
      const m = await import('../infra/mediaRun')
      const names = { audio: tr('file.audio'), convertir: tr('file.converted'), recortar: tr('file.trimmed'), comprimir: tr('file.compressedVideo') }
      const out = await m.runMedia(file, j, names, setProgress, ctrl.signal)
      // Comprimir: si no se gana nada, se entrega el original.
      const original = id === 'comprimir' && !keepSmaller(file.size, out.size)
      setResult({ file: original ? file : out, before: file.size, original })
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

  const videoOnly = id === 'convertir' || id === 'comprimir'
  const ready = !!file && !!info && !reading && !!job()

  return (
    <div className="stack">
      <div className="card stack">
        {!file ? (
          <DropZone accept={acceptFor(id)} onFiles={(fs) => fs[0] && void pick(fs[0])} title={tr(videoOnly ? 'media.pickVideo' : 'media.pickMedia')} hint={tr(videoOnly ? 'media.pickHintVideo' : 'media.pickHint')} />
        ) : (
          <>
            <ul className="file-list" style={{ marginTop: 0 }}>
              <FileRow
                file={file}
                extra={info ? [formatTime(info.duration), info.width ? `${info.width} × ${info.height}` : ''].filter(Boolean).join(' · ') : tr('media.reading')}
                actions={
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setFile(null); setInfo(null); setResult(null); setError(null) }}>
                    {tr('media.change')}
                  </button>
                }
              />
            </ul>
            {info && <Player file={file} playerRef={player} label={tr('media.original')} />}
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

        {id === 'recortar' && info && (
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
            {trimError && <Notice kind="error">{trimError}</Notice>}
          </div>
        )}

        {id === 'comprimir' && (
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
            <small className="faint">{tr('media.working', { pct: Math.round(progress * 100) })} {tr('media.workHint')}</small>
          </div>
        )}
        <div className="row row-end" style={{ gap: 8 }}>
          {busy && <button type="button" className="btn btn-outline" onClick={() => abort.current?.abort()}>{tr('media.cancel')}</button>}
          <BusyButton busy={busy} disabled={!ready} onClick={() => void run()} icon={TOOL_INFO[id].icon}>
            {tr(`media.go.${id}` as MessageKey)}
          </BusyButton>
        </div>
      </div>

      {result && (
        <div className="card stack" aria-live="polite">
          <h3>{tr('media.ready')}</h3>
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
