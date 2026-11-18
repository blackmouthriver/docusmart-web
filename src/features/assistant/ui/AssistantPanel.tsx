// Panel del asistente (W-70c/W-70d): diálogo accesible con foco atrapado, Esc para cerrar, mensajes
// anunciados y respuestas que solo se pintan como texto y enlaces de una lista permitida (la base).
// Funciona dentro de la app (las acciones navegan con go()) y en el resto del sitio (enlaces normales).
// Lo escrito nunca sale del navegador; con consentimiento de analítica se registra solo el id.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { go } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { track } from '../../../shared/platform/analytics'
import { prefersReducedMotion } from '../../../shared/platform/motion'
import { suggestionsFor, type Index, type Kb, type KbAction, type KbEntry } from '../core/engine'
import { answerFor, contextForRoute, reply, type Reply } from '../core/reply'
import { loadKb } from '../infra/kbLoader'
import { typingDelay } from '../core/launcher'
import { kbLangFor } from '../core/reply'
import { localAiFor, type LocalAi } from '../infra/browserAi'
import { questionMail } from '../core/sendQuestion'
import { FEEDBACK_EMAIL } from '../../../shared/files/share'

/** Primera letra en mayúscula (las preguntas de la base se escriben como las escribe la gente). */
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)
/** Duración de la transición de cierre (el panel se encoge hacia el botón). */
const CLOSE_MS = 200

/** text/ai: respuesta redactada por la IA del navegador (W-70f), mientras se escribe ('writing') y al terminar ('done'). */
type Msg =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'bot'; reply: Reply | { kind: 'greeting' }; feedback?: 'up' | 'down'; text?: string; ai?: 'writing' | 'done'; question?: string }

export type PanelProps = {
  lang: string
  onClose: () => void
  /** Dentro de la app web: las acciones navegan sin recargar. */
  inApp?: boolean
  /** En la app: pantalla actual (para deducir la herramienta). */
  section?: string
  sub?: string
  /** Fuera de la app: herramienta de la página (slug), si la hay. */
  context?: string
}

export function AssistantPanel({ lang, onClose: close, inApp = false, section = '', sub, context: pageContext }: PanelProps) {
  const [closing, setClosing] = useState(false)
  /** Cierra con transición (o al instante con "reducir movimiento"). */
  const onClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(close, prefersReducedMotion() ? 0 : CLOSE_MS)
  }
  const [data, setData] = useState<{ kb: Kb; index: Index } | null>(null)
  const [failed, setFailed] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, role: 'bot', reply: { kind: 'greeting' } }])
  const [typing, setTyping] = useState(false)
  /** IA integrada del navegador, si ya está disponible (W-70f); si no, respuestas fijas. */
  const [ai, setAi] = useState<LocalAi | null>(null)
  const [writing, setWriting] = useState(false)
  const [text, setText] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)
  const screen = inApp ? section || 'home' : location.pathname

  useEffect(() => {
    let alive = true
    loadKb(lang).then(
      (d) => alive && setData(d),
      () => alive && setFailed(true),
    )
    track('assistant_opened', { screen })
    return () => {
      alive = false
    }
  }, [lang, screen])

  useEffect(() => input.current?.focus(), [data])
  useEffect(() => {
    let alive = true
    void localAiFor(kbLangFor(lang)).then((a) => alive && setAi(a))
    return () => {
      alive = false
    }
  }, [lang])
  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, typing])

  const context = useMemo(() => pageContext ?? (data && inApp ? contextForRoute(data.index, section, sub) : undefined), [data, inApp, section, sub, pageContext])
  const ui = data?.kb.ui

  /** Con IA del navegador: "escribiendo…", luego el texto en vivo; si falla, la respuesta fija. */
  const writeWithAi = async (localAi: LocalAi, question: string, r: Extract<Reply, { kind: 'answer' }>) => {
    const id = nextId.current++
    let shown = false
    setTyping(true)
    setWriting(true)
    const final = await localAi.rephrase(question, r.entry.a, (partial) => {
      const text = partial.replace(/\*\*|`/g, '')
      if (!shown) {
        shown = true
        setTyping(false)
        setMsgs((m) => [...m, { id, role: 'bot', reply: r, text, ai: 'writing' }])
      } else setMsgs((m) => m.map((x) => (x.id === id && x.role === 'bot' ? { ...x, text } : x)))
    })
    setTyping(false)
    setWriting(false)
    const done: Msg = final ? { id, role: 'bot', reply: r, text: final, ai: 'done' } : { id, role: 'bot', reply: r }
    setMsgs((m) => (shown ? m.map((x) => (x.id === id ? done : x)) : [...m, done]))
    track(final ? 'assistant_ai' : 'assistant_ai_fallback', { answer_id: r.entry.id })
  }

  const push = (user: string, r: Reply) => {
    setMsgs((m) => [...m, { id: nextId.current++, role: 'user', text: user }])
    if (r.kind === 'answer') track('assistant_answer', { answer_id: r.entry.id })
    else track('assistant_fallback', { screen })
    if (ai && r.kind === 'answer' && r.entry.id !== 'gracias') {
      void writeWithAi(ai, user, r)
      return
    }
    setTyping(true)
    // Pausa de "escribiendo…": más larga cuanto más larga la respuesta, para que se sienta atendida.
    const length = r.kind === 'answer' ? r.entry.a.length : 120
    window.setTimeout(
      () => {
        setTyping(false)
        // En el "no sé" se guarda la pregunta para ofrecer enviarla a soporte (W-70g).
        setMsgs((m) => [...m, { id: nextId.current++, role: 'bot', reply: r, ...(r.kind === 'fallback' ? { question: user } : {}) }])
      },
      prefersReducedMotion() ? 0 : typingDelay(length),
    )
  }
  const ask = () => {
    const q = text.trim()
    if (!q || !data || typing || writing) return
    setText('')
    push(q, reply(data.index, q, context))
  }
  const choose = (e: KbEntry) => data && !typing && !writing && push(capitalize(e.q[0]), answerFor(data.index, e))
  const feedback = (id: number, answerId: string, value: 'up' | 'down') => {
    setMsgs((m) => m.map((x) => (x.id === id && x.role === 'bot' ? { ...x, feedback: value } : x)))
    track('assistant_feedback', { answer_id: answerId, value })
  }
  const clear = () => setMsgs([{ id: nextId.current++, role: 'bot', reply: { kind: 'greeting' } }])

  // Esc cierra y Tab no sale del panel.
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    const items = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])')]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const onAction = (a: KbAction, ev?: { preventDefault: () => void }) => {
    track('assistant_action', { kind: a.kind, target: a.kind === 'tool' ? a.app : a.href.startsWith('mailto:') ? 'mail' : a.href })
    // En la app, las herramientas y pantallas se abren sin recargar.
    if (inApp && (a.kind === 'tool' || a.app !== undefined)) {
      ev?.preventDefault()
      const [s, sb] = (a.kind === 'tool' ? a.app : (a.app ?? '')).split('/')
      onClose()
      go(s, sb)
    }
  }

  return (
    <div ref={panel} className={'assistant-panel' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="false" aria-labelledby="assistant-title" onKeyDown={onKeyDown}>
      <header className="assistant-head">
        <span className="assistant-avatar" aria-hidden="true">
          <Icon name="chat" />
          <span className="assistant-online" />
        </span>
        <div className="assistant-head-text">
          <h2 id="assistant-title">{ui?.title ?? 'DocuSmart'}</h2>
          {ui && <small>{ui.privacyNote}</small>}
        </div>
        {ui && (
          <button type="button" className="as-icon-btn" aria-label={ui.clear} title={ui.clear} onClick={clear}>
            <Icon name="reset" />
          </button>
        )}
        <button type="button" className="as-icon-btn" aria-label={ui?.close ?? '×'} title={ui?.close} onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>

      <div ref={list} className="assistant-list" aria-live="polite">
        {!data && !failed && <Typing />}
        {failed && <p className="assistant-bubble bot">⚠️ {lang === 'es' ? 'Sin conexión: no se pudo cargar el asistente.' : 'Offline: the assistant could not load.'}</p>}
        {data &&
          msgs.map((m) =>
            m.role === 'user' ? (
              <p key={m.id} className="assistant-bubble user">
                {m.text}
              </p>
            ) : (
              <BotMessage key={m.id} msg={m} kb={data.kb} index={data.index} context={context} onChoose={choose} onAction={onAction} onFeedback={feedback} />
            ),
          )}
        {typing && <Typing />}
      </div>

      <form
        className="assistant-form"
        onSubmit={(e) => {
          e.preventDefault()
          ask()
        }}
      >
        <input
          ref={input}
          className="as-input"
          type="text"
          value={text}
          placeholder={ui?.placeholder}
          aria-label={ui?.placeholder ?? ''}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={300}
          disabled={!data}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="assistant-send" aria-label={ui?.send ?? ''} title={ui?.send} disabled={!data || !text.trim() || typing || writing}>
          <Icon name="send" />
        </button>
      </form>
    </div>
  )
}

function Typing() {
  return (
    <div className="assistant-typing" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  )
}

function BotMessage({
  msg,
  kb,
  index,
  context,
  onChoose,
  onAction,
  onFeedback,
}: {
  msg: Extract<Msg, { role: 'bot' }>
  kb: Kb
  index: Index
  context?: string
  onChoose: (e: KbEntry) => void
  onAction: (a: KbAction, ev?: { preventDefault: () => void }) => void
  onFeedback: (id: number, answerId: string, value: 'up' | 'down') => void
}) {
  const { reply: r } = msg
  const ui = kb.ui
  if (r.kind === 'greeting') {
    return (
      <div className="assistant-bot">
        <p className="assistant-bubble bot">{ui.greeting}</p>
        <Chips title={ui.suggestions} entries={suggestionsFor(index, context, 4)} onChoose={onChoose} />
      </div>
    )
  }
  if (r.kind === 'fallback') {
    // "Enviar esta pregunta" (W-70g) reemplaza al correo genérico; Facebook e Instagram siguen.
    const send = msg.question ? questionMail(msg.question, { label: ui.sendQuestion, subject: ui.sendSubject, intro: ui.sendIntro }, FEEDBACK_EMAIL, location.pathname) : null
    const contact = (r.contact?.actions ?? []).filter((a) => !(send && a.href.startsWith('mailto:')))
    const actions = send ? [send, ...contact] : contact
    return (
      <div className="assistant-bot">
        <p className="assistant-bubble bot">{ui.fallback}</p>
        {actions.length > 0 && <Actions actions={actions} onAction={onAction} />}
        {send && <small className="assistant-send-note">{ui.sendNote}</small>}
        <Chips title={ui.suggestions} entries={r.suggestions} onChoose={onChoose} />
      </div>
    )
  }
  return (
    <div className="assistant-bot">
      <p className={'assistant-bubble bot' + (msg.ai === 'writing' ? ' is-writing' : '')}>{msg.text ?? r.entry.a}</p>
      {msg.ai === 'done' && <small className="assistant-ai-badge">{ui.aiBadge}</small>}
      {msg.ai === 'writing' ? null : (
        <>
      {r.entry.actions && <Actions actions={r.entry.actions} onAction={onAction} />}
      {r.entry.id !== 'gracias' && (
        <div className="assistant-feedback">
          {msg.feedback ? (
            <small>{ui.thanks}</small>
          ) : (
            <>
              <small>{ui.helpful}</small>
              <button type="button" aria-label={ui.yes} title={ui.yes} onClick={() => onFeedback(msg.id, r.entry.id, 'up')}>
                👍
              </button>
              <button type="button" aria-label={ui.no} title={ui.no} onClick={() => onFeedback(msg.id, r.entry.id, 'down')}>
                👎
              </button>
            </>
          )}
        </div>
      )}
      {r.related.length > 0 && <Chips title={ui.related} entries={r.related} onChoose={onChoose} />}
        </>
      )}
    </div>
  )
}

function Actions({ actions, onAction }: { actions: KbAction[]; onAction: (a: KbAction, ev?: { preventDefault: () => void }) => void }) {
  return (
    <div className="assistant-actions">
      {actions.map((a, i) => {
        const external = a.kind === 'link' && a.external
        return (
          <a
            key={a.label}
            className={'as-action' + (i === 0 ? ' is-primary' : '')}
            href={a.href}
            onClick={(ev) => onAction(a, ev)}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {a.label}
            <Icon name={external ? 'link' : 'back'} />
          </a>
        )
      })}
    </div>
  )
}

function Chips({ title, entries, onChoose }: { title: string; entries: KbEntry[]; onChoose: (e: KbEntry) => void }) {
  if (!entries.length) return null
  return (
    <div className="assistant-chips" role="group" aria-label={title}>
      {entries.map((e) => (
        <button key={e.id} type="button" onClick={() => onChoose(e)}>
          {capitalize(e.q[0])}
        </button>
      ))}
    </div>
  )
}
