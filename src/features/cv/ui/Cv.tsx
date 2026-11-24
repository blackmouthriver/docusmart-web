// Hoja de vida (W-131): formulario por secciones que arma el PDF o el Word en el navegador. El
// borrador se guarda como archivo .json que la persona descarga (nada queda en el navegador).
// W-147.10: comparar con una oferta y carta de presentación con los mismos datos.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, HeroCard, Notice, Progress, Segmented, errorMessage } from '../../../shared/ui/ui'
import { useT } from '../../../shared/i18n/I18n'
import { cvText, matchOffer, type Keyword } from '../core/cvMatch'
import { coverLetterText, letterPdfBlocks, letterWordDoc, type LetterTexts } from '../core/coverLetter'
import { DocPreview, SaveOptions } from '../../../shared/ui/DocPreview'
import { download } from '../../../shared/files/files'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import {
  CV_ACCENTS,
  cvFileBase,
  cvLayoutOptions,
  cvPdfBlocks,
  cvWordDoc,
  defaultPaper,
  draftJson,
  emptyCourse,
  emptyCustom,
  emptyCv,
  emptyJob,
  emptyLang,
  emptyReference,
  emptyStudy,
  hasContent,
  normalizeOrder,
  parseDraft,
  type CvData,
  type CvFont,
  type CvLabels,
  type CvPaper,
  type CvPhoto,
  type CvTemplate,
  type SectionId,
} from '../core/cv'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/* Guardado automático en este navegador (W-146.4): la foto no se guarda (se vuelve a elegir). */
const AUTOSAVE_SLOT = 'ds-cv-autosave-v1'
const AUTOSAVE_OFF = 'ds-cv-autosave-off'
const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k)
      else localStorage.setItem(k, v)
    } catch {
      // Navegación privada o almacenamiento lleno: se sigue sin guardar.
    }
  },
}
const browserPaper = () => defaultPaper(typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]))
const startCv = (): CvData => (storage.get(AUTOSAVE_OFF) ? null : parseDraft(storage.get(AUTOSAVE_SLOT) ?? '')) ?? emptyCv(browserPaper())

/** Nombre de cada sección en la lista para ordenarlas. */
const SECTION_LABEL: Record<SectionId, MessageKey> = {
  profile: 'cv.profile',
  experience: 'cv.experience',
  education: 'cv.education',
  skills: 'cv.skills',
  languages: 'cv.languages',
  courses: 'cv.courses',
  references: 'cv.references',
  custom: 'cv.customSections',
}

export function CvScreen() {
  return (
    <>
      <HeroCard title={tr('tools.cv')} subtitle={tr('tools.cv.desc')} />
      <CvTool />
    </>
  )
}

/** Campo de una lista: texto, texto largo o casilla. */
type Field<T> = { key: keyof T & string; label: MessageKey; kind?: 'text' | 'textarea' | 'check'; placeholder?: MessageKey; wide?: boolean; disabledWhen?: (item: T) => boolean }

/** Editor genérico de una lista de entradas (experiencia, estudios, idiomas…), con subir, bajar y quitar. */
function ListEditor<T extends object>({ items, onChange, fields, make, addLabel }: { items: T[]; onChange: (items: T[]) => void; fields: Field<T>[]; make: () => T; addLabel: MessageKey }) {
  const set = (i: number, patch: Partial<T>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const move = (i: number, d: -1 | 1) => {
    const next = items.slice()
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className="cv-list">
      {items.map((item, i) => (
        <div key={i} className="cv-entry">
          <div className="cv-fields">
            {fields.map((f) => {
              const value = item[f.key] as unknown
              if (f.kind === 'check')
                return (
                  <label key={f.key} className="check cv-wide">
                    <input type="checkbox" checked={value === true} onChange={(e) => set(i, { [f.key]: e.target.checked } as Partial<T>)} />
                    <span>{tr(f.label)}</span>
                  </label>
                )
              const common = { value: String(value ?? ''), placeholder: f.placeholder ? tr(f.placeholder) : undefined, disabled: f.disabledWhen?.(item) ?? false }
              return (
                <label key={f.key} className={'field' + (f.wide || f.kind === 'textarea' ? ' cv-wide' : '')}>
                  <span>{tr(f.label)}</span>
                  {f.kind === 'textarea' ? (
                    <textarea className="textarea" style={{ minHeight: 70 }} {...common} onChange={(e) => set(i, { [f.key]: e.target.value } as Partial<T>)} />
                  ) : (
                    <input className="input" maxLength={200} {...common} onChange={(e) => set(i, { [f.key]: e.target.value } as Partial<T>)} />
                  )}
                </label>
              )
            })}
          </div>
          <div className="cv-entry-actions">
            <button type="button" className="icon-btn" aria-label={`${tr('cv.moveUp')} ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" /></button>
            <button type="button" className="icon-btn" aria-label={`${tr('cv.moveDown')} ${i + 1}`} disabled={i === items.length - 1} onClick={() => move(i, 1)}><Icon name="downArrow" /></button>
            <button type="button" className="icon-btn" aria-label={`${tr('cv.remove')} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><Icon name="close" /></button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-soft btn-sm" style={{ justifySelf: 'start' }} onClick={() => onChange([...items, make()])}><Icon name="plus" /> {tr(addLabel)}</button>
    </div>
  )
}

function Section({ title, children }: { title: MessageKey; children: ReactNode }) {
  return (
    <section className="card stack" aria-label={tr(title)}>
      <h3>{tr(title)}</h3>
      {children}
    </section>
  )
}

export function CvTool() {
  const { toast } = useApp()
  const [cv, setCv] = useState<CvData>(startCv)
  const [autosave, setAutosave] = useState(() => !storage.get(AUTOSAVE_OFF))
  const [photo, setPhoto] = useState<(CvPhoto & { url: string }) | null>(null)
  const [busy, setBusy] = useState<'pdf' | 'docx' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  /** Hay cambios sin guardar en un borrador ni exportar. */
  const [dirty, setDirty] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)
  const draftInput = useRef<HTMLInputElement>(null)
  /** La oferta pegada (W-147.10): sus palabras que ya están en la hoja de vida van a la carta. */
  const [offer, setOffer] = useState('')
  const offerStrengths = useMemo(() => (offer.trim() ? matchOffer(cvText(cv), offer).found.map((k) => k.term) : []), [cv, offer])

  const update = (patch: Partial<CvData>) => {
    setCv((c) => ({ ...c, ...patch }))
    setDirty(true)
    setOutput(null)
  }
  // Guardado automático: medio segundo después del último cambio.
  useEffect(() => {
    if (!autosave) return
    const t = setTimeout(() => storage.set(AUTOSAVE_SLOT, hasContent(cv) ? draftJson(cv) : null), 500)
    return () => clearTimeout(t)
  }, [cv, autosave])
  const toggleAutosave = (on: boolean) => {
    setAutosave(on)
    storage.set(AUTOSAVE_OFF, on ? null : '1')
    storage.set(AUTOSAVE_SLOT, on && hasContent(cv) ? draftJson(cv) : null)
  }
  const startOver = () => {
    if (hasContent(cv) && !window.confirm(tr('cv.startOverConfirm'))) return
    setCv(emptyCv(cv.paper))
    setPhoto(null)
    setOutput(null)
    setDirty(false)
    storage.set(AUTOSAVE_SLOT, null)
  }
  // Aviso del navegador si se va con cambios sin guardar (sin guardado automático).
  useEffect(() => {
    if (autosave || !dirty || !hasContent(cv)) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, cv, autosave])
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url) }, [photo])

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      const { preparePhoto } = await import('../infra/cvPhoto')
      setPhoto(await preparePhoto(file))
      setOutput(null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const labels = (): { l: CvLabels } => {
    const local: CvLabels = { profile: tr('cv.profile'), experience: tr('cv.experience'), education: tr('cv.education'), skills: tr('cv.skills'), languages: tr('cv.languages'), courses: tr('cv.courses'), references: tr('cv.references'), present: tr('cv.present') }
    return { l: local }
  }

  const create = async (format: 'pdf' | 'docx') => {
    setBusy(format)
    setError(null)
    try {
      const base = cvFileBase(cv.name, tr('file.cv'))
      const { l } = labels()
      const pic = cv.template === 'foto' && photo ? photo : undefined
      if (format === 'pdf') {
        const { layoutPdf } = await import('../../convert/core/officePdf')
        const pdf = await layoutPdf(cvPdfBlocks(cv, l, pic), { title: cv.name.trim() || tr('tools.cv'), ...cvLayoutOptions(cv) })
        setOutput(new File([pdf as BlobPart], `${base}.pdf`, { type: 'application/pdf' }))
      } else {
        const { writeDocx } = await import('../../convert/core/pdfWord')
        setOutput(new File([writeDocx(cvWordDoc(cv, l, pic)) as BlobPart], `${base}.docx`, { type: DOCX }))
      }
      setDirty(false)
      track('cv_created', { format, template: cv.template, photo: !!pic, jobs: cv.experience.length })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const saveDraft = () => {
    download(new Blob([draftJson(cv)], { type: 'application/json' }), `${cvFileBase(cv.name, tr('file.cv'))}.json`, 'application/json')
    setDirty(false)
    track('cv_draft_saved', {})
  }
  const openDraft = async (file: File | undefined) => {
    if (!file) return
    const d = parseDraft(await file.text())
    if (!d) {
      setError(tr('cv.draftBad'))
      return
    }
    setError(null)
    setCv(d)
    setDirty(false)
    setOutput(null)
    toast(tr('cv.draftOpened'))
  }

  const text = (key: keyof CvData & string, label: MessageKey, placeholder?: MessageKey, type = 'text') => (
    <label className="field">
      <span>{tr(label)}</span>
      <input className="input" type={type} maxLength={160} value={String(cv[key])} placeholder={placeholder ? tr(placeholder) : undefined} onChange={(e) => update({ [key]: e.target.value } as Partial<CvData>)} />
    </label>
  )

  return (
    <div className="stack">
      <div className="card stack">
        <div className="field">
          <span>{tr('cv.template')}</span>
          <Segmented
            label={tr('cv.template')}
            value={cv.template}
            onChange={(t: CvTemplate) => update({ template: t })}
            options={[
              { value: 'ats', label: tr('cv.template.ats') },
              { value: 'compacta', label: tr('cv.template.compacta') },
              { value: 'foto', label: tr('cv.template.foto') },
            ]}
          />
          <small className="faint">{tr(`cv.templateHint.${cv.template}` as MessageKey)}</small>
        </div>
        <div className="row" style={{ alignItems: 'flex-start', gap: 18 }}>
          <div className="field">
            <span aria-hidden="true">{tr('cv.paper')}</span>
            <Segmented label={tr('cv.paper')} value={cv.paper} onChange={(paper: CvPaper) => update({ paper })} options={[{ value: 'letter', label: tr('cv.paper.letter') }, { value: 'a4', label: 'A4' }]} />
          </div>
          <div className="field">
            <span aria-hidden="true">{tr('cv.font')}</span>
            <Segmented label={tr('cv.font')} value={cv.font} onChange={(font: CvFont) => update({ font })} options={[{ value: 'sans', label: tr('cv.font.sans') }, { value: 'serif', label: tr('cv.font.serif') }]} />
          </div>
          <div className="field">
            <span id="cv-accent-label">{tr('cv.accent')}</span>
            <div className="accent-row" role="radiogroup" aria-labelledby="cv-accent-label">
              {CV_ACCENTS.map((c, i) => (
                <button key={c} type="button" role="radio" aria-checked={cv.accent === c} aria-label={tr('cv.accentN', { n: i + 1 })} title={tr('cv.accentN', { n: i + 1 })} className="accent-swatch" style={{ background: `#${c}` }} onClick={() => update({ accent: c })}>
                  {cv.accent === c && <Icon name="check" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="switch-row" aria-label={tr('cv.autosave')}>
          <span>
            <b>{tr('cv.autosave')}</b>
            <small>{tr('cv.autosaveHint')}</small>
          </span>
          <input type="checkbox" role="switch" className="switch" checked={autosave} onChange={(e) => toggleAutosave(e.target.checked)} />
        </label>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => draftInput.current?.click()}><Icon name="upload" /> {tr('cv.openDraft')}</button>
          <input ref={draftInput} type="file" accept=".json,application/json" hidden aria-label={tr('cv.openDraft')} onChange={(e) => { void openDraft(e.target.files?.[0]); e.target.value = '' }} />
          <button type="button" className="btn btn-outline btn-sm" disabled={!hasContent(cv)} onClick={saveDraft}><Icon name="download" /> {tr('cv.saveDraft')}</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!hasContent(cv)} onClick={startOver}><Icon name="reset" /> {tr('cv.startOver')}</button>
        </div>
        <small className="faint">{tr('cv.draftHint')}</small>
      </div>

      <Section title="cv.personal">
        <div className="cv-fields">
          {text('name', 'cv.name')}
          {text('headline', 'cv.headline', 'cv.headlinePh')}
          {text('city', 'cv.city')}
          {text('phone', 'cv.phone', undefined, 'tel')}
          {text('email', 'cv.email', undefined, 'email')}
          <label className="field cv-wide">
            <span>{tr('cv.links')}</span>
            <textarea className="textarea" style={{ minHeight: 50 }} value={cv.links} placeholder={tr('cv.linksPh')} onChange={(e) => update({ links: e.target.value })} />
          </label>
        </div>
        {cv.template === 'foto' && (
          <div className="field">
            <span>{tr('cv.photo')}</span>
            <div className="row cv-photo">
              {photo && <img src={photo.url} alt={tr('cv.photo')} />}
              <button type="button" className="btn btn-soft btn-sm" onClick={() => photoInput.current?.click()}><Icon name="image" /> {photo ? tr('cv.changePhoto') : tr('cv.pickPhoto')}</button>
              {photo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPhoto(null); setOutput(null) }}>{tr('cv.removePhoto')}</button>}
              <input ref={photoInput} type="file" accept="image/*,.heic,.heif" hidden aria-label={tr('cv.pickPhoto')} onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = '' }} />
            </div>
            <small className="faint">{tr('cv.photoTip')}</small>
          </div>
        )}
      </Section>

      <Section title="cv.profile">
        <label className="field">
          <span className="sr-only">{tr('cv.profile')}</span>
          <textarea className="textarea" style={{ minHeight: 80 }} value={cv.summary} placeholder={tr('cv.profilePh')} onChange={(e) => update({ summary: e.target.value })} />
        </label>
      </Section>

      <Section title="cv.experience">
        <ListEditor
          items={cv.experience}
          onChange={(experience) => update({ experience })}
          make={emptyJob}
          addLabel="cv.addJob"
          fields={[
            { key: 'role', label: 'cv.role' },
            { key: 'company', label: 'cv.company' },
            { key: 'place', label: 'cv.place' },
            { key: 'start', label: 'cv.start' },
            { key: 'end', label: 'cv.end', disabledWhen: (j) => j.current },
            { key: 'current', label: 'cv.current', kind: 'check' },
            { key: 'details', label: 'cv.details', kind: 'textarea', placeholder: 'cv.detailsPh' },
          ]}
        />
        <small className="faint">{tr('cv.atsTip')}</small>
      </Section>

      <Section title="cv.education">
        <ListEditor
          items={cv.education}
          onChange={(education) => update({ education })}
          make={emptyStudy}
          addLabel="cv.addStudy"
          fields={[{ key: 'degree', label: 'cv.degree' }, { key: 'school', label: 'cv.school' }, { key: 'place', label: 'cv.place' }, { key: 'start', label: 'cv.start' }, { key: 'end', label: 'cv.end' }]}
        />
      </Section>

      <Section title="cv.skills">
        <label className="field">
          <span className="sr-only">{tr('cv.skills')}</span>
          <textarea className="textarea" style={{ minHeight: 60 }} value={cv.skills} placeholder={tr('cv.skillsPh')} onChange={(e) => update({ skills: e.target.value })} />
        </label>
      </Section>

      <Section title="cv.languages">
        <ListEditor items={cv.languages} onChange={(languages) => update({ languages })} make={emptyLang} addLabel="cv.addLanguage" fields={[{ key: 'name', label: 'cv.language' }, { key: 'level', label: 'cv.level', placeholder: 'cv.levelPh' }]} />
      </Section>

      <Section title="cv.courses">
        <ListEditor items={cv.courses} onChange={(courses) => update({ courses })} make={emptyCourse} addLabel="cv.addCourse" fields={[{ key: 'name', label: 'cv.course', wide: true }, { key: 'org', label: 'cv.org' }, { key: 'year', label: 'cv.year' }]} />
      </Section>

      <Section title="cv.references">
        <ListEditor items={cv.references} onChange={(references) => update({ references })} make={emptyReference} addLabel="cv.addReference" fields={[{ key: 'name', label: 'cv.refName' }, { key: 'relation', label: 'cv.relation', placeholder: 'cv.relationPh' }, { key: 'contact', label: 'cv.contact' }]} />
      </Section>

      <Section title="cv.customSections">
        <small className="faint">{tr('cv.customHint')}</small>
        <ListEditor
          items={cv.custom}
          onChange={(custom) => update({ custom })}
          make={emptyCustom}
          addLabel="cv.addCustom"
          fields={[
            { key: 'title', label: 'cv.customTitle', placeholder: 'cv.customTitlePh', wide: true },
            { key: 'body', label: 'cv.customBody', kind: 'textarea', placeholder: 'cv.customBodyPh' },
          ]}
        />
      </Section>

      <Section title="cv.order">
        <small className="faint">{tr('cv.orderHint')}</small>
        <ol className="cv-order">
          {normalizeOrder(cv.order).map((id, i, all) => (
            <li key={id}>
              <span>{tr(SECTION_LABEL[id])}</span>
              <button type="button" className="icon-btn" aria-label={tr('cv.orderUp', { name: tr(SECTION_LABEL[id]) })} disabled={i === 0} onClick={() => update({ order: swapAt(all, i, i - 1) })}><Icon name="up" /></button>
              <button type="button" className="icon-btn" aria-label={tr('cv.orderDown', { name: tr(SECTION_LABEL[id]) })} disabled={i === all.length - 1} onClick={() => update({ order: swapAt(all, i, i + 1) })}><Icon name="downArrow" /></button>
            </li>
          ))}
        </ol>
      </Section>

      <div className="card stack">
        <small className="faint">{tr('cv.privacy')}</small>
        {!cv.name.trim() && <small className="faint">{tr('cv.needName')}</small>}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end" style={{ gap: 8 }}>
          <BusyButton busy={busy === 'docx'} disabled={!cv.name.trim() || busy !== null} onClick={() => create('docx')} icon="file">{tr('cv.createDocx')}</BusyButton>
          <BusyButton busy={busy === 'pdf'} disabled={!cv.name.trim() || busy !== null} onClick={() => create('pdf')} icon="pdf">{tr('cv.createPdf')}</BusyButton>
        </div>
      </div>

      {output && (
        <div className="card stack" aria-live="polite">
          <h3>{tr('cv.ready')}</h3>
          <DocPreview source={output} page={1} label={output.name} />
          <SaveOptions file={output} toolName="cv" />
        </div>
      )}

      <OfferMatchCard cv={cv} offer={offer} setOffer={setOffer} onAddSkill={(term) => update({ skills: cv.skills.trim() ? `${cv.skills.trim().replace(/[,;]$/, '')}, ${term}` : term })} />
      <CoverLetterCard cv={cv} strengths={offerStrengths} />
    </div>
  )
}

/* ───────────── Comparar con una oferta (W-147.10) ───────────── */

function OfferMatchCard({ cv, offer, setOffer, onAddSkill }: { cv: CvData; offer: string; setOffer: (s: string) => void; onAddSkill: (term: string) => void }) {
  const match = useMemo(() => (offer.trim() ? matchOffer(cvText(cv), offer) : null), [cv, offer])
  const chip = (k: Keyword, missing: boolean) => (
    <li key={k.key} className={'kw-chip' + (missing ? ' is-missing' : ' is-found')}>
      <span>{k.term}</span>
      {missing && (
        <button type="button" className="kw-add" aria-label={tr('cv.offerAdd', { term: k.term })} title={tr('cv.offerAdd', { term: k.term })} onClick={() => onAddSkill(k.term)}>
          <Icon name="plus" />
        </button>
      )}
    </li>
  )
  return (
    <details className="card cv-extra" open={offer.trim() ? true : undefined}>
      <summary><Icon name="search" /> {tr('cv.offerTitle')}</summary>
      <div className="stack">
        <small className="faint">{tr('cv.offerHint')}</small>
        <label className="field">
          <span>{tr('cv.offerLabel')}</span>
          <textarea className="textarea" style={{ minHeight: 120 }} value={offer} placeholder={tr('cv.offerPh')} onChange={(e) => setOffer(e.target.value)} />
        </label>
        {match && (match.found.length + match.missing.length === 0 ? (
          <small className="faint">{tr('cv.offerNone')}</small>
        ) : (
          <div className="stack" aria-live="polite">
            <div className="stack" style={{ gap: 4 }}>
              <b>{tr('cv.offerScore', { n: match.score })}</b>
              <Progress value={match.score / 100} />
            </div>
            {match.missing.length > 0 ? (
              <div className="stack" style={{ gap: 6 }}>
                <span className="kw-title">{tr('cv.offerMissing', { n: match.missing.length })}</span>
                <ul className="kw-list" aria-label={tr('cv.offerMissing', { n: match.missing.length })}>{match.missing.map((k) => chip(k, true))}</ul>
                <small className="faint">{tr('cv.offerTip')}</small>
              </div>
            ) : (
              <Notice kind="success">{tr('cv.offerAllFound')}</Notice>
            )}
            {match.found.length > 0 && (
              <div className="stack" style={{ gap: 6 }}>
                <span className="kw-title">{tr('cv.offerFound', { n: match.found.length })}</span>
                <ul className="kw-list" aria-label={tr('cv.offerFound', { n: match.found.length })}>{match.found.map((k) => chip(k, false))}</ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

/* ───────────── Carta de presentación (W-147.10) ───────────── */

const LETTER_KEYS = ['greetingNamed', 'greetingCompany', 'greeting', 'intro', 'introNoCompany', 'current', 'past', 'strengths', 'education', 'closing', 'closingNoCompany', 'signoff'] as const

function CoverLetterCard({ cv, strengths }: { cv: CvData; strengths: string[] }) {
  const { lang } = useT()
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [recipient, setRecipient] = useState('')
  const [reason, setReason] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<'pdf' | 'docx' | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setOutput(null), [text, cv.paper, cv.font, cv.accent, cv.template])

  const write = () => {
    const t = Object.fromEntries(LETTER_KEYS.map((k) => [k, tr(`cv.letter.${k}` as MessageKey)])) as LetterTexts
    const date = new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(new Date())
    setText(coverLetterText(cv, { company, position, recipient, reason, strengths }, t, lang, date))
    track('cover_letter_written', { with_offer: strengths.length > 0 })
  }

  const create = async (format: 'pdf' | 'docx') => {
    setBusy(format)
    setError(null)
    try {
      const base = `${cvFileBase(cv.name, tr('file.coverLetter'))}`
      if (format === 'pdf') {
        const { layoutPdf } = await import('../../convert/core/officePdf')
        const pdf = await layoutPdf(letterPdfBlocks(text, cv), { title: tr('cv.letterTitle'), ...cvLayoutOptions(cv) })
        setOutput(new File([pdf as BlobPart], `${base}.pdf`, { type: 'application/pdf' }))
      } else {
        const { writeDocx } = await import('../../convert/core/pdfWord')
        setOutput(new File([writeDocx(letterWordDoc(text, cv)) as BlobPart], `${base}.docx`, { type: DOCX }))
      }
      track('cover_letter_created', { format })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <details className="card cv-extra">
      <summary><Icon name="mail" /> {tr('cv.letterTitle')}</summary>
      <div className="stack">
        <small className="faint">{tr('cv.letterHint')}</small>
        <div className="cv-fields">
          <label className="field"><span>{tr('cv.letterCompany')}</span><input className="input" maxLength={120} value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          <label className="field"><span>{tr('cv.letterPosition')}</span><input className="input" maxLength={120} value={position} placeholder={cv.headline || undefined} onChange={(e) => setPosition(e.target.value)} /></label>
          <label className="field cv-wide"><span>{tr('cv.letterRecipient')}</span><input className="input" maxLength={120} value={recipient} placeholder={tr('cv.letterRecipientPh')} onChange={(e) => setRecipient(e.target.value)} /></label>
          <label className="field cv-wide"><span>{tr('cv.letterReason')}</span><textarea className="textarea" style={{ minHeight: 60 }} value={reason} placeholder={tr('cv.letterReasonPh')} onChange={(e) => setReason(e.target.value)} /></label>
        </div>
        {strengths.length > 0 && <small className="faint">{tr('cv.letterStrengths', { list: strengths.slice(0, 4).join(', ') })}</small>}
        <div className="row row-end">
          <button type="button" className="btn btn-soft" disabled={!cv.name.trim()} onClick={write}><Icon name="edit" /> {text ? tr('cv.letterRewrite') : tr('cv.letterWrite')}</button>
        </div>
        {!cv.name.trim() && <small className="faint">{tr('cv.needName')}</small>}
        {text && (
          <>
            <label className="field">
              <span>{tr('cv.letterText')}</span>
              <textarea className="textarea cv-letter" value={text} onChange={(e) => setText(e.target.value)} />
            </label>
            {error && <Notice kind="error">{error}</Notice>}
            <div className="row row-end" style={{ gap: 8 }}>
              <BusyButton busy={busy === 'docx'} disabled={busy !== null || !text.trim()} onClick={() => create('docx')} icon="file">{tr('cv.letterDocx')}</BusyButton>
              <BusyButton busy={busy === 'pdf'} disabled={busy !== null || !text.trim()} onClick={() => create('pdf')} icon="pdf">{tr('cv.letterPdf')}</BusyButton>
            </div>
          </>
        )}
        {output && (
          <div className="stack" aria-live="polite">
            <DocPreview source={output} page={1} label={output.name} />
            <SaveOptions file={output} toolName="cover_letter" />
          </div>
        )}
      </div>
    </details>
  )
}

function swapAt<T>(list: readonly T[], a: number, b: number): T[] {
  const c = list.slice()
  ;[c[a], c[b]] = [c[b], c[a]]
  return c
}
