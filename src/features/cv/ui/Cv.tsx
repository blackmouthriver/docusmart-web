// Hoja de vida (W-131): formulario por secciones que arma el PDF o el Word en el navegador. El
// borrador se guarda como archivo .json que la persona descarga (nada queda en el navegador).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, HeroCard, Notice, Segmented, errorMessage } from '../../../shared/ui/ui'
import { DocPreview, SaveOptions } from '../../../shared/ui/DocPreview'
import { download } from '../../../shared/files/files'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { isWinAnsi } from '../../integrity/core/certificate'
import {
  ENGLISH_CV_LABELS,
  cvFileBase,
  cvPdfBlocks,
  cvWordDoc,
  draftJson,
  emptyCourse,
  emptyCv,
  emptyJob,
  emptyLang,
  emptyReference,
  emptyStudy,
  hasContent,
  parseDraft,
  type CvData,
  type CvLabels,
  type CvPhoto,
  type CvTemplate,
} from '../core/cv'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

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
  const [cv, setCv] = useState<CvData>(emptyCv)
  const [photo, setPhoto] = useState<(CvPhoto & { url: string }) | null>(null)
  const [busy, setBusy] = useState<'pdf' | 'docx' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  /** Hay cambios sin guardar en un borrador ni exportar. */
  const [dirty, setDirty] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)
  const draftInput = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<CvData>) => {
    setCv((c) => ({ ...c, ...patch }))
    setDirty(true)
    setOutput(null)
  }
  // Aviso del navegador si se va con cambios sin guardar.
  useEffect(() => {
    if (!dirty || !hasContent(cv)) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, cv])
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

  const labels = (): { l: CvLabels; latin: boolean } => {
    const local: CvLabels = { profile: tr('cv.profile'), experience: tr('cv.experience'), education: tr('cv.education'), skills: tr('cv.skills'), languages: tr('cv.languages'), courses: tr('cv.courses'), references: tr('cv.references'), present: tr('cv.present') }
    const latin = isWinAnsi(JSON.stringify(local))
    return { l: local, latin }
  }

  const create = async (format: 'pdf' | 'docx') => {
    setBusy(format)
    setError(null)
    try {
      const base = cvFileBase(cv.name, tr('file.cv'))
      const { l, latin } = labels()
      const pic = cv.template === 'foto' && photo ? photo : undefined
      if (format === 'pdf') {
        const { layoutPdf } = await import('../../convert/core/officePdf')
        // Las fuentes estándar del PDF solo cubren el alfabeto latino: si no, los títulos van en inglés.
        const pdf = await layoutPdf(cvPdfBlocks(cv, latin ? l : ENGLISH_CV_LABELS, pic), { title: cv.name.trim() || tr('tools.cv') })
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
          <Segmented label={tr('cv.template')} value={cv.template} onChange={(t: CvTemplate) => update({ template: t })} options={[{ value: 'ats', label: tr('cv.template.ats') }, { value: 'foto', label: tr('cv.template.foto') }]} />
          <small className="faint">{tr(cv.template === 'ats' ? 'cv.templateHint.ats' : 'cv.templateHint.foto')}</small>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => draftInput.current?.click()}><Icon name="upload" /> {tr('cv.openDraft')}</button>
          <input ref={draftInput} type="file" accept=".json,application/json" hidden aria-label={tr('cv.openDraft')} onChange={(e) => { void openDraft(e.target.files?.[0]); e.target.value = '' }} />
          <button type="button" className="btn btn-outline btn-sm" disabled={!hasContent(cv)} onClick={saveDraft}><Icon name="download" /> {tr('cv.saveDraft')}</button>
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
    </div>
  )
}
