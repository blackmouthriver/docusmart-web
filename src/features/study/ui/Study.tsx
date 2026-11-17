import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import { kindOf } from '../../../shared/files/files'
import { pdfToText } from '../../convert/core/convert'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { useT } from '../../../shared/i18n/I18n'
import { listenedPercent, nextPosition, toParagraphs } from '../core/reading'
import { guessFeminine, personaAvatar, personasForVoices, voicesForLanguage, type VoicePersona } from '../core/voicePersonas'

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

// ── Lectura en voz alta por párrafos (W-60) ─────────────────────────
type Pos = { p: number; c: number }

function ReadAloud() {
  const { toast } = useApp()
  const { lang: uiLang } = useT()
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState(readSavedVoice)
  const [rate, setRate] = useState(1)
  const [view, setView] = useState<'edit' | 'read'>('edit')
  const [pos, setPos] = useState<Pos>({ p: 0, c: 0 })
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const paragraphs = useMemo(() => toParagraphs(text), [text])
  // Cada lectura lleva un número: al cancelar, los avisos de la anterior se ignoran.
  const run = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(speechSynthesis.getVoices())
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', load)
      run.current++
      speechSynthesis.cancel()
    }
  }, [supported])

  // El párrafo que se lee queda siempre a la vista.
  useEffect(() => {
    if (view !== 'read' || state === 'idle') return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-p="${pos.p}"]`)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [pos.p, state, view])

  const chooseVoice = (uri: string) => {
    setVoiceURI(uri)
    try {
      localStorage.setItem(VOICE_KEY, uri)
    } catch {
      /* almacenamiento bloqueado: se elige de nuevo la próxima vez */
    }
  }

  const speak = (at: Pos, speed = rate) => {
    const id = ++run.current
    speechSynthesis.cancel()
    const chunk = paragraphs[at.p]?.chunks[at.c]
    if (!chunk) return
    const u = new SpeechSynthesisUtterance(chunk)
    const voice = voices.find((v) => v.voiceURI === voiceURI) ?? defaultVoice(voices, uiLang)
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    }
    u.rate = speed
    u.onend = () => {
      if (id !== run.current) return
      const next = nextPosition(paragraphs, at.p, at.c)
      if (next) speak(next, speed)
      else {
        setState('idle')
        setFinished(true)
        setPos({ p: paragraphs.length - 1, c: 0 })
      }
    }
    u.onerror = (e) => {
      if (id !== run.current || e.error === 'interrupted' || e.error === 'canceled') return
      setState('idle')
      toast(tr('study.speakError'))
    }
    setPos(at)
    setState('playing')
    speechSynthesis.speak(u)
  }

  const start = (p = 0) => {
    if (!paragraphs.length) return
    setView('read')
    setFinished(false)
    if (state === 'idle') track('study_session_started', { mode: 'read_aloud' })
    speak({ p, c: 0 })
  }
  // Pausar cancela y recuerda la posición: más confiable que speechSynthesis.pause() con voces en línea.
  const pause = () => {
    run.current++
    speechSynthesis.cancel()
    setState('paused')
  }
  const stop = () => {
    run.current++
    speechSynthesis.cancel()
    setState('idle')
  }
  const jump = (delta: number) => {
    const p = Math.max(0, Math.min(paragraphs.length - 1, pos.p + delta))
    setFinished(false)
    if (state === 'playing') speak({ p, c: 0 })
    else setPos({ p, c: 0 })
  }
  const changeRate = (r: number) => {
    setRate(r)
    if (state === 'playing') speak({ p: pos.p, c: pos.c }, r)
  }
  const edit = () => {
    stop()
    setFinished(false)
    setPos({ p: 0, c: 0 })
    setView('edit')
  }

  const loadFile = async (file: File | undefined) => {
    if (!file) return
    stop()
    setLoading(true)
    try {
      const kind = kindOf(file)
      let loaded: string | null = null
      if (kind === 'pdf') loaded = await pdfToText(await file.arrayBuffer())
      else if (kind === 'text') loaded = await file.text()
      else toast(tr('study.pickPdfTxt'))
      if (loaded !== null) {
        setText(loaded)
        setPos({ p: 0, c: 0 })
        setFinished(false)
        setView(loaded.trim() ? 'read' : 'edit')
      }
    } catch {
      toast(tr('study.cantRead'))
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return <Notice kind="error">{tr('study.unsupported')}</Notice>

  const total = paragraphs.length
  const percent = listenedPercent(pos.p, total, finished)

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{tr('study.readAloud')}</h3>
        <div className="row" style={{ gap: 8 }}>
          {view === 'read' && (
            <button type="button" className="btn btn-outline btn-sm" onClick={edit}>
              <Icon name="edit" /> {tr('study.editText')}
            </button>
          )}
          <button type="button" className="btn btn-soft btn-sm" onClick={() => fileInput.current?.click()} disabled={loading}>
            {loading ? <span className="spinner" /> : <Icon name="open" />} {tr('study.load')}
          </button>
        </div>
        <input ref={fileInput} type="file" hidden accept="application/pdf,text/plain,.txt,.md" onChange={(e) => { void loadFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>

      {view === 'edit' ? (
        <label className="field">
          <span>{tr('study.textToRead')}</span>
          <textarea className="textarea" value={text} placeholder={tr('study.textPh')} onChange={(e) => setText(e.target.value)} />
        </label>
      ) : (
        <div className="reading reading-paras" ref={listRef} aria-live="off">
          {paragraphs.map((para, i) => (
            <p key={i} data-p={i} className={i === pos.p && (state !== 'idle' || finished) ? 'is-current' : undefined}>
              <button type="button" className="para-btn" title={tr('study.readFromHere', { n: i + 1 })} onClick={() => start(i)}>
                {i === pos.p && state === 'playing'
                  ? para.chunks.map((ch, j) => (
                      <span key={j}>{j === pos.c ? <mark>{ch}</mark> : ch} </span>
                    ))
                  : para.text}
              </button>
            </p>
          ))}
        </div>
      )}

      <VoicePicker voices={voices} value={voiceURI} onChange={chooseVoice} disabled={state === 'playing'} />

      {finished && (
        <Notice kind="success">
          {tr('study.finished')}{' '}
          <button type="button" className="btn btn-soft btn-sm" onClick={() => start(0)}>
            <Icon name="reset" /> {tr('study.readAgain')}
          </button>
        </Notice>
      )}

      <div className={'player' + (view === 'read' ? ' is-sticky' : '')}>
        {view === 'read' && total > 0 && (
          <div className="player-progress">
            <span className="faint">{tr('study.paragraphOf', { i: Math.min(pos.p + 1, total), n: total })}</span>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={tr('study.listened', { n: percent })}>
              <i style={{ width: `${percent}%` }} />
            </div>
            <span className="faint">{tr('study.listened', { n: percent })}</span>
          </div>
        )}
        <div className="player-controls">
          <button type="button" className="icon-btn" aria-label={tr('study.prevParagraph')} disabled={view !== 'read' || pos.p === 0} onClick={() => jump(-1)}>
            <Icon name="back" />
          </button>
          {state === 'playing' ? (
            <button type="button" className="btn btn-primary" onClick={pause}><Icon name="pause" /> {tr('study.pause')}</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => (state === 'paused' ? speak(pos) : start(view === 'read' && !finished ? pos.p : 0))} disabled={!total}>
              <Icon name="play" /> {state === 'paused' ? tr('study.resume') : tr('study.read')}
            </button>
          )}
          <button type="button" className="icon-btn icon-flip" aria-label={tr('study.nextParagraph')} disabled={view !== 'read' || pos.p >= total - 1} onClick={() => jump(1)}>
            <Icon name="back" />
          </button>
          {state !== 'idle' && <button type="button" className="btn btn-soft" onClick={stop}><Icon name="stop" /> {tr('study.stop')}</button>}
        </div>
        <label className="field player-speed">
          <span>{tr('study.speed', { n: rate.toFixed(1) })}</span>
          <input type="range" min={0.6} max={1.8} step={0.1} value={rate} onChange={(e) => changeRate(Number(e.target.value))} />
        </label>
        {view === 'edit' && total > 0 && <span className="faint">{tr('study.paragraphs', { n: total })}</span>}
      </div>
    </div>
  )
}

// ── Personajes de voz (W-58): los mismos de la app ───────────────────
const VOICE_KEY = 'ds-study-voice'
const readSavedVoice = () => {
  try {
    return localStorage.getItem(VOICE_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Voces que muestra el selector: las del idioma de la web o, si no hay, todas. */
function shownVoices(voices: SpeechSynthesisVoice[], lang: string, all: boolean) {
  const own = all ? [] : voicesForLanguage(voices, lang)
  return own.length ? own : voicesForLanguage(voices, null)
}
const defaultVoice = (voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined => shownVoices(voices, lang, false)[0]

function languageName(code: string, uiLang: string) {
  try {
    return new Intl.DisplayNames([uiLang], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

function VoiceAvatar({ persona, size }: { persona: VoicePersona; size: number }) {
  return <img className="voice-avatar" src={personaAvatar(persona)} alt="" width={size} height={size} style={{ borderColor: persona.color }} />
}

function VoicePicker({ voices, value, onChange, disabled }: { voices: SpeechSynthesisVoice[]; value: string; onChange: (uri: string) => void; disabled: boolean }) {
  const { lang } = useT()
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const [previewing, setPreviewing] = useState('')
  const shown = useMemo(() => shownVoices(voices, lang, all), [voices, lang, all])
  const personas = useMemo(() => personasForVoices(shown.map((v) => ({ id: v.voiceURI, feminine: guessFeminine(v.name) }))), [shown])
  const selected = voices.find((v) => v.voiceURI === value) ?? shown[0]
  // La voz guardada puede no estar en la lista visible (otro idioma): su personaje se calcula aparte.
  const selectedPersona = selected && (personas.get(selected.voiceURI) ?? personasForVoices([{ id: selected.voiceURI, feminine: guessFeminine(selected.name) }]).get(selected.voiceURI))

  const detail = (v: SpeechSynthesisVoice) => `${languageName(v.lang, lang)}${v.localService ? '' : ` · ${tr('study.voiceOnline')}`}`

  const preview = (v: SpeechSynthesisVoice, persona: VoicePersona) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(tr('study.voiceSample', { name: persona.name }))
    u.voice = v
    u.lang = v.lang
    u.onend = () => setPreviewing('')
    u.onerror = () => setPreviewing('')
    setPreviewing(v.voiceURI)
    speechSynthesis.speak(u)
  }

  if (!voices.length) return <p className="faint">{tr('study.noVoices')}</p>
  if (!selected || !selectedPersona) return null

  return (
    <div className="voice-picker">
      <div className="voice-current">
        <VoiceAvatar persona={selectedPersona} size={56} />
        <div className="voice-text">
          <span className="faint">{tr('study.voice')}</span>
          <b>{selectedPersona.name}</b>
          <span className="faint">{detail(selected)}</span>
        </div>
        <button type="button" className="btn btn-soft btn-sm" aria-expanded={open} disabled={disabled} onClick={() => setOpen((o) => !o)}>
          {open ? tr('study.doneChoosing') : tr('study.changeVoice')}
        </button>
      </div>
      {open && !disabled && (
        <div className="voice-list" role="radiogroup" aria-label={tr('study.chooseVoice')}>
          {shown.map((v) => {
            const p = personas.get(v.voiceURI)
            if (!p) return null
            const isSel = v.voiceURI === selected.voiceURI
            return (
              <div key={v.voiceURI} className={'voice-row' + (isSel ? ' is-selected' : '')}>
                <label className="voice-choice">
                  <input type="radio" name="study-voice" checked={isSel} onChange={() => onChange(v.voiceURI)} />
                  <VoiceAvatar persona={p} size={40} />
                  <span className="voice-text">
                    <b>{p.name}</b>
                    <span className="faint" title={v.name}>{detail(v)}</span>
                  </span>
                </label>
                <button type="button" className="icon-btn" aria-label={`${tr('study.voicePreview')}: ${p.name}`} disabled={previewing === v.voiceURI} onClick={() => preview(v, p)}>
                  <Icon name={previewing === v.voiceURI ? 'volume' : 'play'} />
                </button>
              </div>
            )
          })}
          <label className="voice-all faint">
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
            {tr('study.allVoices')}
          </label>
        </div>
      )}
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
