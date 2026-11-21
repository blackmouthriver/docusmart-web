// Agenda del Modo Estudio (W-126): exámenes, entregas y clases guardados en el navegador, con
// avisos y exportar/importar .ics para llevarlos a Outlook, Google Calendar o el iPhone.
import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { Notice } from '../../../shared/ui/ui'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { useT } from '../../../shared/i18n/I18n'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { REMINDERS, REPEATS, dateKey, icsName, isValidDate, mergeImported, occurrences, parseIcs, toIcs, upsertEvent, type AgendaEvent, type Occurrence, type Reminder, type Repeat } from '../core/agenda'
import { getEvents, lastSaveFailed, setEvents, subscribeEvents } from '../infra/agendaStore'

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240]
const pad = (n: number) => String(n).padStart(2, '0')

type Draft = { id: string | null; title: string; date: string; time: string; allDay: boolean; minutes: number; repeat: Repeat; reminder: Reminder; notes: string }

function emptyDraft(): Draft {
  const next = new Date()
  next.setHours(next.getHours() + 1, 0, 0, 0)
  return { id: null, title: '', date: dateKey(next), time: `${pad(next.getHours())}:00`, allDay: false, minutes: 60, repeat: 'none', reminder: 30, notes: '' }
}

const durationLabel = (m: number) => (m % 60 === 0 ? tr('agenda.durationH', { n: m / 60 }) : tr('agenda.durationMin', { n: m }))
const reminderKey = (r: Reminder) => (r === null ? 'none' : String(r))

export function Agenda() {
  const { toast } = useApp()
  const { lang } = useT()
  const events = useSyncExternalStore(subscribeEvents, getEvents)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [exported, setExported] = useState<File | null>(null)
  const [permission, setPermission] = useState(() => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission))
  const [storageOk, setStorageOk] = useState(true)
  const importInput = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLDivElement>(null)

  const now = new Date()
  const upcoming = useMemo(() => occurrences(events, new Date(), new Date(Date.now() + 90 * 24 * 60 * 60_000), 60), [events])
  const byDay = useMemo(() => {
    const groups: Array<{ date: string; items: Occurrence[] }> = []
    for (const o of upcoming) {
      const last = groups[groups.length - 1]
      if (last?.date === o.date) last.items.push(o)
      else groups.push({ date: o.date, items: [o] })
    }
    return groups
  }, [upcoming])

  const dayLabel = (date: string) => {
    const today = dateKey(now)
    const tomorrow = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
    const d = new Date(`${date}T12:00`)
    const long = d.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
    if (date === today) return `${tr('agenda.today')} · ${long}`
    if (date === tomorrow) return `${tr('agenda.tomorrow')} · ${long}`
    return long
  }
  const timeLabel = (o: Occurrence) =>
    o.event.time ? `${o.start.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })} – ${o.end.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}` : tr('agenda.allDayShort')

  const save = () => {
    const title = draft.title.trim()
    if (!title || !isValidDate(draft.date)) return
    const old = events.find((e) => e.id === draft.id)
    const ts = Date.now()
    const event: AgendaEvent = {
      id: draft.id ?? crypto.randomUUID(),
      title,
      date: draft.date,
      time: draft.allDay ? null : draft.time,
      minutes: draft.minutes,
      repeat: draft.repeat,
      reminder: draft.reminder,
      notes: draft.notes.trim(),
      createdAt: old?.createdAt ?? ts,
      updatedAt: ts,
    }
    setStorageOk(setEvents(upsertEvent(events, event)))
    setDraft(emptyDraft())
    if (!old) track('agenda_event_created', { repeat: event.repeat, reminder: event.reminder ?? -1, all_day: !event.time })
    toast(tr(old ? 'agenda.updated' : 'agenda.added'))
  }
  const edit = (e: AgendaEvent) => {
    setDraft({ id: e.id, title: e.title, date: e.date, time: e.time ?? '09:00', allDay: !e.time, minutes: e.minutes, repeat: e.repeat, reminder: e.reminder, notes: e.notes })
    form.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
  const remove = (e: AgendaEvent) => {
    setStorageOk(setEvents(events.filter((x) => x.id !== e.id)))
    if (draft.id === e.id) setDraft(emptyDraft())
  }
  /** `all`: "Exportar todo" se llama siempre "agenda.ics", aunque haya un solo evento. */
  const exportIcs = (list: AgendaEvent[], all = false) => {
    const name = all ? icsName([], tr('file.agenda')) : icsName(list, tr('file.agenda'))
    setExported(new File([toIcs(list, new Date())], name, { type: 'text/calendar' }))
    track('agenda_exported', { count: list.length })
  }
  const importIcs = async (file: File | undefined) => {
    if (!file) return
    try {
      const imported = parseIcs(await file.text(), Date.now(), () => crypto.randomUUID())
      if (!imported.length) {
        toast(tr('agenda.importNone'))
        return
      }
      const r = mergeImported(events, imported)
      setStorageOk(setEvents(r.list))
      toast(r.updated ? tr('agenda.importedUpdated', { n: imported.length, m: r.updated }) : tr('agenda.imported', { n: imported.length }))
      track('agenda_imported', { count: imported.length, updated: r.updated })
    } catch {
      toast(tr('agenda.importNone'))
    }
  }
  const askPermission = async () => {
    if (typeof Notification === 'undefined') return
    setPermission(await Notification.requestPermission())
  }

  const editing = draft.id !== null
  const canSave = !!draft.title.trim() && isValidDate(draft.date) && (draft.allDay || /^\d{2}:\d{2}$/.test(draft.time))
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  return (
    <div className="card stack">
      <h3>{tr('study.agenda')}</h3>
      <div className={'note-editor' + (editing ? ' is-editing' : '')} ref={form}>
        {editing && <span className="note-editing">{tr('agenda.editing')}</span>}
        <label className="field">
          <span>{tr('agenda.title')}</span>
          <input className="input" value={draft.title} maxLength={120} placeholder={tr('agenda.titlePh')} onChange={(e) => set({ title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && canSave && save()} />
        </label>
        <div className="row agenda-when">
          <label className="field">
            <span>{tr('agenda.date')}</span>
            <input className="input" type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
          {!draft.allDay && (
            <>
              <label className="field">
                <span>{tr('agenda.time')}</span>
                <input className="input" type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} />
              </label>
              <label className="field">
                <span>{tr('agenda.duration')}</span>
                <select className="input" value={draft.minutes} onChange={(e) => set({ minutes: Number(e.target.value) })}>
                  {[...new Set([...DURATIONS, draft.minutes])].sort((a, b) => a - b).map((m) => <option key={m} value={m}>{durationLabel(m)}</option>)}
                </select>
              </label>
            </>
          )}
        </div>
        <label className="check">
          <input type="checkbox" checked={draft.allDay} onChange={(e) => set({ allDay: e.target.checked })} />
          <span>{tr('agenda.allDay')}</span>
        </label>
        <div className="row agenda-when">
          <label className="field">
            <span>{tr('agenda.repeat')}</span>
            <select className="input" value={draft.repeat} onChange={(e) => set({ repeat: e.target.value as Repeat })}>
              {REPEATS.map((r) => <option key={r} value={r}>{tr(`agenda.rep.${r}` as MessageKey)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{tr('agenda.reminder')}</span>
            <select className="input" value={reminderKey(draft.reminder)} onChange={(e) => set({ reminder: REMINDERS.find((r) => reminderKey(r) === e.target.value) ?? null })}>
              {REMINDERS.map((r) => <option key={reminderKey(r)} value={reminderKey(r)}>{tr(`agenda.rem.${reminderKey(r)}` as MessageKey)}</option>)}
            </select>
          </label>
        </div>
        <label className="field">
          <span>{tr('agenda.notes')}</span>
          <textarea className="textarea" style={{ minHeight: 64 }} value={draft.notes} placeholder={tr('agenda.notesPh')} onChange={(e) => set({ notes: e.target.value })} />
        </label>
        <div className="row row-end" style={{ gap: 8 }}>
          {editing && <button type="button" className="btn btn-ghost" onClick={() => setDraft(emptyDraft())}>{tr('study.cancel')}</button>}
          <button type="button" className="btn btn-primary" disabled={!canSave} onClick={save}>
            <Icon name={editing ? 'check' : 'plus'} /> {editing ? tr('agenda.save') : tr('agenda.add')}
          </button>
        </div>
        <span className="faint">{tr('study.localOnly')}</span>
      </div>

      {(!storageOk || lastSaveFailed()) && <Notice kind="error">{tr('study.noStorage')}</Notice>}

      <div className="agenda-reminders">
        {permission === 'default' && events.some((e) => e.reminder !== null) && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => void askPermission()}><Icon name="clock" /> {tr('agenda.notifyOn')}</button>
        )}
        {permission === 'denied' && <small className="faint">{tr('agenda.notifyBlocked')}</small>}
        <small className="faint">{tr('agenda.notifyHint')}</small>
      </div>

      <div className="notes-bar">
        <b>{tr('agenda.upcoming')}</b>
        <span className="row" style={{ gap: 6 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => importInput.current?.click()}><Icon name="upload" /> {tr('agenda.import')}</button>
          <input ref={importInput} type="file" accept=".ics,text/calendar" hidden aria-label={tr('agenda.import')} onChange={(e) => { void importIcs(e.target.files?.[0]); e.target.value = '' }} />
          {events.length > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={() => exportIcs(events, true)}><Icon name="calendar" /> {tr('agenda.exportAll')}</button>}
        </span>
      </div>

      {exported && (
        <section className="note-export" aria-label={tr('study.exportReady')}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{exported.name}</b>
            <button type="button" className="icon-btn" aria-label={tr('study.closeExport')} onClick={() => setExported(null)}><Icon name="close" /></button>
          </div>
          <SaveOptions file={exported} toolName="study_agenda" />
        </section>
      )}

      {byDay.length === 0 ? (
        <p className="faint">{tr('agenda.empty')}</p>
      ) : (
        <div className="agenda-days">
          {byDay.map((g) => (
            <section key={g.date} className="agenda-day" aria-label={dayLabel(g.date)}>
              <h4>{dayLabel(g.date)}</h4>
              {g.items.map((o) => (
                <article key={`${o.event.id}@${o.date}`} className={'agenda-item' + (draft.id === o.event.id ? ' is-editing' : '')}>
                  <span className="agenda-time">{timeLabel(o)}</span>
                  <span className="agenda-what">
                    <b>{o.event.title}</b>
                    {o.event.notes && <small>{o.event.notes}</small>}
                    <small className="faint">
                      {[o.event.repeat !== 'none' ? tr(`agenda.rep.${o.event.repeat}` as MessageKey) : '', o.event.reminder !== null ? tr(`agenda.rem.${reminderKey(o.event.reminder)}` as MessageKey) : ''].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                  <span className="row" style={{ gap: 2 }}>
                    <button type="button" className="icon-btn" aria-label={tr('agenda.edit')} title={tr('agenda.edit')} onClick={() => edit(o.event)}><Icon name="edit" /></button>
                    <button type="button" className="icon-btn" aria-label={tr('agenda.exportOne')} title={tr('agenda.exportOne')} onClick={() => exportIcs([o.event])}><Icon name="calendar" /></button>
                    <button type="button" className="icon-btn" aria-label={tr('agenda.delete')} title={tr('agenda.delete')} onClick={() => remove(o.event)}><Icon name="trash" /></button>
                  </span>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
