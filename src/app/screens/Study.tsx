import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { HeroCard, Notice, Segmented } from '../components/ui'
import { kindOf } from '../lib/files'
import { pdfToText } from '../lib/convert'
import { track } from '../../shared/analytics'
import { tr } from '../i18n/translate'

export function Study() {
  const [tab, setTab] = useState<'read' | 'notes' | 'pomodoro'>('read')
  return (
    <>
      <HeroCard title={tr('nav.study')} subtitle={tr('study.heroSub')} />
      <div style={{ margin: '18px 0 14px' }}>
        <Segmented
          label={tr('study.tool')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'read', label: tr('study.readAloud') },
            { value: 'notes', label: tr('study.notes') },
            { value: 'pomodoro', label: tr('study.pomodoro') },
          ]}
        />
      </div>
      {tab === 'read' && <ReadAloud />}
      {tab === 'notes' && <Notes />}
      {tab === 'pomodoro' && <Pomodoro />}
    </>
  )
}

// ── Lectura en voz alta ──────────────────────────────────────────────
const splitSentences = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?¿¡…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

function ReadAloud() {
  const { toast } = useApp()
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState('')
  const [rate, setRate] = useState(1)
  const [current, setCurrent] = useState(-1)
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [loading, setLoading] = useState(false)
  const sentences = useMemo(() => splitSentences(text), [text])
  const stopped = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!supported) return
    const load = () => {
      const list = speechSynthesis.getVoices()
      setVoices(list)
      if (list.length) {
        // Idioma del navegador primero, como la app usa el del dispositivo.
        const lang = navigator.language.slice(0, 2)
        setVoiceURI((v) => v || (list.find((x) => x.lang.startsWith(lang)) ?? list[0]).voiceURI)
      }
    }
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', load)
      speechSynthesis.cancel()
    }
  }, [supported])

  const speakFrom = (i: number) => {
    if (i >= sentences.length || stopped.current) {
      setState('idle')
      setCurrent(-1)
      return
    }
    const u = new SpeechSynthesisUtterance(sentences[i])
    const voice = voices.find((v) => v.voiceURI === voiceURI)
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    }
    u.rate = rate
    u.onend = () => speakFrom(i + 1)
    u.onerror = () => setState('idle')
    setCurrent(i)
    speechSynthesis.speak(u)
  }

  const play = () => {
    if (state === 'paused') {
      speechSynthesis.resume()
      setState('playing')
      return
    }
    speechSynthesis.cancel()
    stopped.current = false
    setState('playing')
    track('study_session_started', { mode: 'read_aloud' })
    speakFrom(0)
  }
  const pause = () => {
    speechSynthesis.pause()
    setState('paused')
  }
  const stop = () => {
    stopped.current = true
    speechSynthesis.cancel()
    setState('idle')
    setCurrent(-1)
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    stop()
    setLoading(true)
    try {
      const kind = kindOf(file)
      if (kind === 'pdf') setText(await pdfToText(await file.arrayBuffer()))
      else if (kind === 'text') setText(await file.text())
      else toast(tr('study.pickPdfTxt'))
    } catch {
      toast(tr('study.cantRead'))
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return <Notice kind="error">{tr('study.unsupported')}</Notice>

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{tr('study.readAloud')}</h3>
        <button type="button" className="btn btn-soft btn-sm" onClick={() => fileInput.current?.click()} disabled={loading}>
          {loading ? <span className="spinner" /> : <Icon name="open" />} {tr('study.load')}
        </button>
        <input ref={fileInput} type="file" hidden accept="application/pdf,text/plain,.txt,.md" onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      {state === 'idle' ? (
        <label className="field">
          <span>{tr('study.textToRead')}</span>
          <textarea className="textarea" value={text} placeholder={tr('study.textPh')} onChange={(e) => setText(e.target.value)} />
        </label>
      ) : (
        <div className="reading" aria-live="off">
          {sentences.map((s, i) => (
            <span key={i}>{i === current ? <mark>{s}</mark> : s} </span>
          ))}
        </div>
      )}

      <div className="row">
        <label className="field" style={{ flex: '2 1 220px' }}>
          <span>{tr('study.voice')}</span>
          <select className="select" value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} disabled={state !== 'idle'}>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
            ))}
          </select>
        </label>
        <label className="field" style={{ flex: '1 1 160px' }}>
          <span>{tr('study.speed', { n: rate.toFixed(1) })}</span>
          <input type="range" min={0.6} max={1.8} step={0.1} value={rate} disabled={state !== 'idle'} onChange={(e) => setRate(Number(e.target.value))} />
        </label>
      </div>

      <div className="row">
        {state === 'playing' ? (
          <button type="button" className="btn btn-primary" onClick={pause}><Icon name="pause" /> {tr('study.pause')}</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={play} disabled={!sentences.length}><Icon name="play" /> {state === 'paused' ? tr('study.resume') : tr('study.read')}</button>
        )}
        {state !== 'idle' && <button type="button" className="btn btn-soft" onClick={stop}><Icon name="stop" /> {tr('study.stop')}</button>}
        {sentences.length > 0 && <span className="faint">{tr('study.sentences', { n: sentences.length })}</span>}
      </div>
    </div>
  )
}

// ── Notas (guardadas solo en este navegador) ─────────────────────────
type Note = { id: string; text: string; at: number }
const NOTES_KEY = 'ds-notes'
const readNotes = (): Note[] => {
  try {
    const v = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function Notes() {
  const [notes, setNotes] = useState<Note[]>(readNotes)
  const [draft, setDraft] = useState('')
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
      setStorageOk(true)
    } catch {
      setStorageOk(false)
    }
  }, [notes])

  const add = () => {
    if (!draft.trim()) return
    setNotes((n) => [{ id: crypto.randomUUID(), text: draft.trim(), at: Date.now() }, ...n])
    setDraft('')
    track('note_created')
  }

  return (
    <div className="card stack">
      <h3>{tr('study.notes')}</h3>
      <label className="field">
        <span className="sr-only">{tr('study.newNote')}</span>
        <textarea
          className="textarea"
          style={{ minHeight: 100 }}
          value={draft}
          placeholder={tr('study.notePh')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add()
          }}
        />
      </label>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="faint">{tr('study.localOnly')}</span>
        <button type="button" className="btn btn-primary" disabled={!draft.trim()} onClick={add}><Icon name="plus" /> {tr('study.saveNote')}</button>
      </div>
      {!storageOk && <Notice kind="error">{tr('study.noStorage')}</Notice>}
      {notes.length > 0 && (
        <div className="notes">
          {notes.map((n) => (
            <article key={n.id} className="note">
              <p>{n.text}</p>
              <footer>
                <time dateTime={new Date(n.at).toISOString()}>{new Date(n.at).toLocaleString()}</time>
                <button type="button" className="icon-btn" aria-label={tr('study.deleteNote')} onClick={() => setNotes((x) => x.filter((y) => y.id !== n.id))}>
                  <Icon name="trash" />
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pomodoro: 25 min de foco, 5 de descanso, 15 cada 4 pomodoros ─────
const FOCUS = 25 * 60
const SHORT = 5 * 60
const LONG = 15 * 60
const CIRC = 2 * Math.PI * 100

function Pomodoro() {
  const [phase, setPhase] = useState<'focus' | 'short' | 'long'>('focus')
  const [left, setLeft] = useState(FOCUS)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const endAt = useRef(0)
  const total = phase === 'focus' ? FOCUS : phase === 'short' ? SHORT : LONG

  useEffect(() => {
    if (!running) return
    endAt.current = Date.now() + left * 1000
    // Se calcula contra el reloj para no desfasarse si la pestaña queda en segundo plano.
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) {
        clearInterval(id)
        setRunning(false)
        beep()
        if (phase === 'focus') {
          const count = done + 1
          setDone(count)
          track('pomodoro_completed', { pomodoro_count: count })
          const next = count % 4 === 0 ? 'long' : 'short'
          setPhase(next)
          setLeft(next === 'long' ? LONG : SHORT)
        } else {
          setPhase('focus')
          setLeft(FOCUS)
        }
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  useEffect(() => {
    const base = `${tr('nav.study')} · DocuSmart Web`
    document.title = running ? `${fmt(left)} · ${phase === 'focus' ? tr('study.focus') : tr('study.break')}` : base
    return () => {
      document.title = base
    }
  }, [left, running, phase])

  const reset = () => {
    setRunning(false)
    setPhase('focus')
    setLeft(FOCUS)
  }

  return (
    <div className="card">
      <div className="timer-wrap">
        <div className={'timer' + (phase === 'focus' ? '' : ' is-break')}>
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle className="track" cx="110" cy="110" r="100" />
            <circle className="prog" cx="110" cy="110" r="100" strokeDasharray={CIRC} strokeDashoffset={CIRC * (left / total)} />
          </svg>
          <div className="timer-label" role="timer" aria-live="off">
            <b>{fmt(left)}</b>
            <small>{phase === 'focus' ? (running ? tr('study.focused') : tr('study.paused')) : phase === 'short' ? tr('study.shortBreak') : tr('study.longBreak')}</small>
          </div>
        </div>
        <div className="row">
          <button type="button" className="btn btn-outline" onClick={reset}><Icon name="reset" /> {tr('study.restart')}</button>
          {running ? (
            <button type="button" className="btn btn-primary" onClick={() => setRunning(false)}><Icon name="pause" /> {tr('study.pause')}</button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (phase === 'focus' && left === FOCUS) track('study_session_started', { mode: 'pomodoro' })
                setRunning(true)
              }}
            >
              <Icon name="play" /> {tr('study.start')}
            </button>
          )}
        </div>
        <div className="row" style={{ gap: 12 }}>
          <span className="faint">{tr('study.done', { n: done })}</span>
          <span className="dots" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <i key={i} className={i < done % 4 || (done > 0 && done % 4 === 0) ? 'on' : ''} />)}
          </span>
        </div>
        <span className="faint">{tr('study.every4')}</span>
      </div>
    </div>
  )
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function beep() {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = 880
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.65)
  } catch {
    /* sin audio disponible */
  }
}
