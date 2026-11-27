// Audio a texto (W-133): transcribe notas de voz, reuniones y videos con Whisper en el navegador.
// El modelo (~77 MB) se descarga una vez y queda guardado; el audio nunca sale del dispositivo.
// Opcional (W-147.4): distinguir quién habla, con otros ~12,7 MB de modelos.
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress } from '../../../shared/ui/ui'
import { download, formatBytes } from '../../../shared/files/files'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { MEDIA_ACCEPT } from '../../media/core/media'
import { LANGUAGE_IDS, WHISPER_BYTES, formatTimestamp, segmentsToText, toSrt, toVtt, type LanguageCode, type Segment } from '../core/whisper'
import { DIARIZE_BYTES, assignSpeakers, renumber, speakerCount, speakerSrt, speakerText, speakerVtt } from '../core/diarize'
import { useAssistantOptions } from '../../../shared/files/toolOptions'

type Stage = 'idle' | 'model' | 'speakerModel' | 'audio' | 'transcribing' | 'speakers' | 'done'
const COUNTS = [2, 3, 4, 5, 6] as const
const LANG_NAMES: Record<LanguageCode, string> = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', it: 'Italiano', de: 'Deutsch', ca: 'Català', eu: 'Euskara', ru: 'Русский', ja: '日本語', ko: '한국어', zh: '中文' }

const baseOf = (name: string) => name.replace(/\.[^./\\]+$/, '').trim() || 'audio'

/** Grabación con el micrófono (MediaRecorder), para dictar. */
function useRecorder(onDone: (f: File) => void) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const rec = useRef<MediaRecorder | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const r = new MediaRecorder(stream)
    const chunks: Blob[] = []
    r.ondataavailable = (e) => chunks.push(e.data)
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      window.clearInterval(timer.current)
      setRecording(false)
      const type = r.mimeType || 'audio/webm'
      const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
      onDone(new File(chunks, `${tr('file.dictation')}.${ext}`, { type }))
    }
    rec.current = r
    r.start(1000)
    setSeconds(0)
    setRecording(true)
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
  }
  const stop = () => {
    if (rec.current?.state === 'recording') rec.current.stop()
  }
  useEffect(() => () => stop(), [])
  return { recording, seconds, start, stop }
}

export function TranscribeTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<LanguageCode | 'auto'>('auto')
  // Desde el asistente (W-151.5): «pasa este audio en portugués a texto».
  useAssistantOptions('audio-a-texto', (o) => {
    const code = LANGUAGE_IDS.find(([c]) => c === o.language)?.[0]
    if (code) setLanguage(code)
  })
  const [translate, setTranslate] = useState(false)
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [segments, setSegments] = useState<Segment[]>([])
  const [detected, setDetected] = useState<LanguageCode | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState<boolean | null>(null)
  const [withSpeakers, setWithSpeakers] = useState(false)
  const [count, setCount] = useState(0)
  const [speakersCached, setSpeakersCached] = useState<boolean | null>(null)
  // Hablante de cada segmento (vacío si no se pidió) y el nombre de cada uno.
  const [speakers, setSpeakers] = useState<number[]>([])
  const [names, setNames] = useState<string[]>([])
  const abort = useRef<AbortController | null>(null)
  const recorder = useRecorder((f) => pick(f))

  useEffect(() => {
    void import('../infra/whisperModel').then((m) => m.isWhisperCached()).then(setCached, () => setCached(false))
    void import('../infra/diarizeModel').then((m) => m.isDiarizeCached()).then(setSpeakersCached, () => setSpeakersCached(false))
    return () => abort.current?.abort()
  }, [])

  const pick = (f: File) => {
    setFile(f)
    setSegments([])
    setSpeakers([])
    setText('')
    setError(null)
    setStage('idle')
  }

  const busy = stage !== 'idle' && stage !== 'done'

  const run = async () => {
    if (!file) return
    const ctrl = new AbortController()
    abort.current = ctrl
    setError(null)
    setSegments([])
    setSpeakers([])
    setText('')
    setDetected(null)
    let step = 'model'
    try {
      const [{ prepareTranscriber, prepareSpeakers, runTranscription }, { decodeAudio }] = await Promise.all([import('../infra/transcriber'), import('../infra/audioDecode')])
      // Primero el audio: si el archivo está dañado o no tiene sonido, se avisa enseguida, sin
      // descargar antes el modelo de 77 MB.
      setStage('audio')
      setProgress(0)
      const { audio, duration } = await decodeAudio(file, setProgress)
      if (ctrl.signal.aborted) return
      setStage('model')
      setProgress(0)
      await prepareTranscriber(setProgress)
      setCached(true)
      if (ctrl.signal.aborted) return
      if (withSpeakers) {
        step = 'speakers'
        setStage('speakerModel')
        setProgress(0)
        await prepareSpeakers(setProgress)
        setSpeakersCached(true)
        step = 'model'
        if (ctrl.signal.aborted) return
      }
      setStage('transcribing')
      setProgress(0)
      const started = performance.now()
      const r = await runTranscription(
        audio,
        // El idioma de la página se prueba siempre en automático (el modelo a veces se equivoca).
        { language, translate, preferred: LANGUAGE_IDS.find(([c]) => c === document.documentElement.lang)?.[0] },
        (p) => {
          if ('speakers' in p) {
            setStage('speakers')
            setProgress(p.speakers)
            return
          }
          setProgress(p.fraction)
          setSegments(p.segments)
          setDetected(p.language)
        },
        ctrl.signal,
        withSpeakers ? { count: count || undefined } : undefined,
      )
      setSegments(r.segments)
      setDetected(r.language)
      const who = r.turns ? renumber(assignSpeakers(r.segments, r.turns)) : []
      const people = speakerCount(who)
      const defaults = Array.from({ length: people }, (_, i) => tr('stt.speaker', { n: i + 1 }))
      setSpeakers(who)
      setNames(defaults)
      setText(people ? speakerText(r.segments, who, defaults) : segmentsToText(r.segments))
      setStage('done')
      if (!r.segments.length) setError(tr('stt.noSpeech'))
      track('transcription_done', { seconds: Math.round(duration), language: r.language, translate, ms: Math.round(performance.now() - started), speakers: people })
    } catch (e) {
      setStage('idle')
      const name = e instanceof Error ? e.name : ''
      if (name === 'TranscribeCanceled') return
      const reason = e instanceof Error && 'reason' in e ? String((e as { reason: string }).reason) : ''
      const network = /HTTP|fetch|incompleto/i.test(e instanceof Error ? e.message : '')
      setError(tr(reason === 'too-long' ? 'stt.err.tooLong' : reason === 'no-audio' ? 'stt.err.noAudio' : reason === 'unsupported' ? 'stt.err.unsupported' : network && step === 'speakers' ? 'stt.err.speakers' : network ? 'stt.err.model' : 'stt.err.failed'))
      track('app_error', { error_context: 'transcribe', error_message: name || 'error' })
    } finally {
      abort.current = null
    }
  }

  const cancel = async () => {
    abort.current?.abort()
    setStage('idle')
  }

  const base = file ? baseOf(file.name) : 'audio'
  const people = speakerCount(speakers)
  /** Cambia un nombre en el texto (sin perder lo que el usuario ya corrigió) y en los subtítulos. */
  const rename = (i: number, value: string) => {
    const next = value.trim() || tr('stt.speaker', { n: i + 1 })
    const old = names[i]
    if (next === old) return
    setText((t) => t.split(`${old} (`).join(`${next} (`))
    setNames((ns) => ns.map((n, j) => (j === i ? next : n)))
  }
  const srt = () => (people ? speakerSrt(segments, speakers, names) : toSrt(segments))
  const vtt = () => (people ? speakerVtt(segments, speakers, names) : toVtt(segments))
  const saveWord = async () => {
    const [{ textWordDoc }, { writeDocx }] = await Promise.all([import('../../ocr/core/imageText'), import('../../convert/core/pdfWord')])
    download(new Blob([writeDocx(textWordDoc(text)) as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `${base}.docx`)
  }
  const status: Record<Stage, string> = {
    idle: '',
    model: cached ? tr('stt.loadingModel') : tr('stt.downloading', { size: formatBytes(WHISPER_BYTES), pct: Math.round(progress * 100) }),
    speakerModel: speakersCached ? tr('stt.loadingModel') : tr('stt.speakerModel', { size: formatBytes(DIARIZE_BYTES), pct: Math.round(progress * 100) }),
    audio: tr('stt.readingAudio'),
    transcribing: tr('stt.transcribing', { pct: Math.round(progress * 100) }),
    speakers: tr('stt.findingSpeakers', { pct: Math.round(progress * 100) }),
    done: '',
  }

  return (
    <div className="stack">
      <div className="card stack">
        {!file ? (
          <>
            <DropZone accept={MEDIA_ACCEPT} onFiles={(fs) => fs[0] && pick(fs[0])} title={tr('stt.pick')} hint={tr('stt.pickHint')} />
            <div className="row" style={{ justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {recorder.recording ? (
                <button type="button" className="btn btn-primary" onClick={recorder.stop}>
                  <Icon name="stop" /> {tr('stt.stopRecording', { time: formatTimestamp(recorder.seconds).slice(3, 8) })}
                </button>
              ) : (
                <button type="button" className="btn btn-outline" onClick={() => void recorder.start().catch(() => setError(tr('stt.err.mic')))}>
                  <Icon name="volume" /> {tr('stt.record')}
                </button>
              )}
            </div>
          </>
        ) : (
          <ul className="file-list" style={{ marginTop: 0 }}>
            <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setFile(null); setSegments([]); setText(''); setStage('idle') }}>{tr('common.change')}</button>} />
          </ul>
        )}
        <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <label className="field" style={{ minWidth: 200 }}>
            <span>{tr('stt.language')}</span>
            <select className="input" value={language} disabled={busy} onChange={(e) => setLanguage(e.target.value as LanguageCode | 'auto')}>
              <option value="auto">{tr('stt.auto')}</option>
              {LANGUAGE_IDS.map(([code]) => (
                <option key={code} value={code}>{LANG_NAMES[code]}</option>
              ))}
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={translate} disabled={busy} onChange={(e) => setTranslate(e.target.checked)} />
            <span>{tr('stt.translate')}</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={withSpeakers} disabled={busy} onChange={(e) => setWithSpeakers(e.target.checked)} />
            <span>{tr('stt.speakers')}</span>
          </label>
          {withSpeakers && (
            <label className="field" style={{ minWidth: 200 }}>
              <span>{tr('stt.speakersCount')}</span>
              <select className="input" value={count} disabled={busy} onChange={(e) => setCount(Number(e.target.value))}>
                <option value={0}>{tr('stt.speakersAuto')}</option>
                {COUNTS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        {cached === false && !busy && <small className="faint">{tr('stt.modelNote', { size: formatBytes(WHISPER_BYTES) })}</small>}
        {withSpeakers && !busy && <small className="faint">{tr('stt.speakersNote', { size: formatBytes(DIARIZE_BYTES) })}</small>}
        <small className="faint">{tr('stt.privacy')}</small>
        {busy && (
          <div className="stack" style={{ gap: 6 }}>
            <Progress value={stage === 'audio' || stage === 'speakers' ? Math.max(0.02, progress) : progress} />
            <small className="faint">{status[stage]}</small>
          </div>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end" style={{ gap: 8 }}>
          {busy && <button type="button" className="btn btn-outline" onClick={() => void cancel()}>{tr('stt.cancel')}</button>}
          <BusyButton busy={busy} disabled={!file || recorder.recording} onClick={() => void run()} icon="text">
            {tr('stt.go')}
          </BusyButton>
        </div>
      </div>

      {(stage === 'transcribing' || stage === 'speakers' || stage === 'done') && segments.length > 0 && (
        <div className="card stack" aria-live="polite">
          <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <h3>{tr('stt.result')}</h3>
            {stage === 'done' && (
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => void navigator.clipboard.writeText(text).then(() => toast(tr('ocr.copied')))}><Icon name="copy" /> {tr('ocr.copy')}</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${base}.txt`)}><Icon name="download" /> .txt</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => void saveWord()}><Icon name="file" /> {tr('itt.word')}</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([srt()], { type: 'application/x-subrip;charset=utf-8' }), `${base}.srt`)}><Icon name="text" /> .srt</button>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([vtt()], { type: 'text/vtt;charset=utf-8' }), `${base}.vtt`)}><Icon name="text" /> .vtt</button>
              </div>
            )}
          </div>
          {detected && <small className="faint">{tr('stt.detected', { lang: LANG_NAMES[detected] })}</small>}
          {stage === 'done' && people > 0 && (
            <fieldset className="stack" style={{ gap: 6, border: 0, padding: 0, margin: 0 }}>
              <legend className="faint">{tr('stt.speakersFound', { n: people })}</legend>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {names.map((n, i) => (
                  <input
                    key={`${i}-${n}`}
                    className="input"
                    style={{ maxWidth: 200 }}
                    defaultValue={n}
                    maxLength={40}
                    aria-label={tr('stt.speakerName', { n: i + 1 })}
                    onBlur={(e) => rename(i, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  />
                ))}
              </div>
            </fieldset>
          )}
          {stage === 'done' ? (
            <label className="field">
              <span>{tr('stt.editHint')}</span>
              <textarea className="textarea itt-text" value={text} onChange={(e) => setText(e.target.value)} spellCheck />
            </label>
          ) : (
            <ol className="stt-live">
              {segments.map((s, i) => (
                <li key={i}>
                  <span className="faint">{formatTimestamp(s.start).slice(0, 8)}</span> {s.text}
                </li>
              ))}
            </ol>
          )}
          {stage === 'done' && <small className="faint">{tr('stt.subsNote')}</small>}
        </div>
      )}
    </div>
  )
}
