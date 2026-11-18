// Panel del asistente (W-70c): diálogo accesible con foco atrapado, Esc para cerrar, mensajes
// anunciados y respuestas que solo se pintan como texto y enlaces de una lista permitida (la base).
// Lo escrito nunca sale del navegador; con consentimiento de analítica se registra solo el id.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { go } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { track } from '../../../shared/platform/analytics'
import { suggestionsFor, type Index, type Kb, type KbAction, type KbEntry } from '../core/engine'
import { answerFor, contextForRoute, reply, type Reply } from '../core/reply'
import { loadKb } from '../infra/kbLoader'

/** Primera letra en mayúscula (las preguntas de la base se escriben como las escribe la gente). */
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

type Msg = { id: number; role: 'user'; text: string } | { id: number; role: 'bot'; reply: Reply | { kind: 'greeting' }; feedback?: 'up' | 'down' }

export function AssistantPanel({ lang, section, sub, onClose }: { lang: string; section: string; sub?: string; onClose: () => void }) {
  const [data, setData] = useState<{ kb: Kb; index: Index } | null>(null)
  const [failed, setFailed] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, role: 'bot', reply: { kind: 'greeting' } }])
  const [text, setText] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    let alive = true
    loadKb(lang).then(
      (d) => alive && setData(d),
      () => alive && setFailed(true),
    )
    track('assistant_opened', { screen: section || 'home' })
    return () => {
      alive = false
    }
  }, [lang, section])

  useEffect(() => input.current?.focus(), [data])
  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const context = useMemo(() => (data ? contextForRoute(data.index, section, sub) : undefined), [data, section, sub])
  const ui = data?.kb.ui

  const push = (user: string, r: Reply) => {
    const u = nextId.current++
    const b = nextId.current++
    setMsgs((m) => [...m, { id: u, role: 'user', text: user }, { id: b, role: 'bot', reply: r }])
    if (r.kind === 'answer') track('assistant_answer', { answer_id: r.entry.id })
    else track('assistant_fallback', { screen: section || 'home' })
  }
  const ask = () => {
    const q = text.trim()
    if (!q || !data) return
    setText('')
    push(q, reply(data.index, q, context))
  }
  const choose = (e: KbEntry) => data && push(capitalize(e.q[0]), answerFor(data.index, e))
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
    const items = [...panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input')]
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

  const runAction = (a: KbAction) => {
    track('assistant_action', { kind: a.kind, target: a.kind === 'tool' ? a.app : a.href.startsWith('mailto:') ? 'mail' : a.href })
    if (a.kind === 'tool' || a.app !== undefined) {
      const [s, sb] = (a.kind === 'tool' ? a.app : (a.app ?? '')).split('/')
      onClose()
      go(s, sb)
    }
  }

  return (
    <div ref={panel} className="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title" onKeyDown={onKeyDown}>
      <header className="assistant-head">
        <span className="assistant-avatar" aria-hidden="true">
          <Icon name="chat" />
        </span>
        <div className="assistant-head-text">
          <h2 id="assistant-title">{ui?.title ?? 'DocuSmart'}</h2>
          {ui && <small>{ui.privacyNote}</small>}
        </div>
        {ui && (
          <button type="button" className="icon-btn" aria-label={ui.clear} title={ui.clear} onClick={clear}>
            <Icon name="reset" />
          </button>
        )}
        <button type="button" className="icon-btn" aria-label={ui?.close ?? '×'} title={ui?.close} onClick={onClose}>
          <Icon name="close" />
        </button>
      </header>

      <div ref={list} className="assistant-list" aria-live="polite">
        {!data && !failed && (
          <div className="assistant-typing" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )}
        {failed && <p className="assistant-bubble bot">⚠️ {'Sin conexión: no se pudo cargar el asistente. / Offline: the assistant could not load.'}</p>}
        {data &&
          msgs.map((m) =>
            m.role === 'user' ? (
              <p key={m.id} className="assistant-bubble user">
                {m.text}
              </p>
            ) : (
              <BotMessage key={m.id} msg={m} kb={data.kb} index={data.index} context={context} onChoose={choose} onAction={runAction} onFeedback={feedback} />
            ),
          )}
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
          className="input"
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
        <button type="submit" className="assistant-send" aria-label={ui?.send ?? ''} title={ui?.send} disabled={!data || !text.trim()}>
          <Icon name="send" />
        </button>
      </form>
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
  onAction: (a: KbAction) => void
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
    return (
      <div className="assistant-bot">
        <p className="assistant-bubble bot">{ui.fallback}</p>
        {r.contact?.actions && <Actions actions={r.contact.actions} onAction={onAction} />}
        <Chips title={ui.suggestions} entries={r.suggestions} onChoose={onChoose} />
      </div>
    )
  }
  return (
    <div className="assistant-bot">
      <p className="assistant-bubble bot">{r.entry.a}</p>
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
    </div>
  )
}

function Actions({ actions, onAction }: { actions: KbAction[]; onAction: (a: KbAction) => void }) {
  return (
    <div className="assistant-actions">
      {actions.map((a) => {
        const inApp = a.kind === 'tool' || a.app !== undefined
        if (inApp)
          return (
            <button key={a.label} type="button" className="btn btn-primary btn-sm" onClick={() => onAction(a)}>
              {a.label}
            </button>
          )
        const external = a.kind === 'link' && a.external
        return (
          <a key={a.label} className="btn btn-soft btn-sm" href={a.href} onClick={() => onAction(a)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            {a.label}
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
