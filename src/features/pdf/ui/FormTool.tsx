// Formularios PDF: llenar los campos rellenables (AcroForm) de un PDF y crear campos nuevos (W-147.2).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../../app/state'
import { BusyButton, DropZone, FileRow, Notice, Segmented, errorMessage } from '../../../shared/ui/ui'
import { FormCreate } from './FormCreate'
import { baseName, download } from '../../../shared/files/files'
import { Icon } from '../../../shared/ui/Icon'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import { tr } from '../../../shared/i18n/translate'
import type { FormField, FormInfo, FormValues } from '../core/pdfForm'
import { track } from '../../../shared/platform/analytics'
import { PageNav, usePdfPreview } from './PdfPreview'

const inputId = (name: string) => 'campo-' + name.replace(/[^\w-]/g, '_')

export function FormTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  /** Resultado listo para ver y guardar (ya no se descarga solo). */
  const [output, setOutput] = useState<File | null>(null)
  useEffect(() => setOutput(null), [file])
  const { pages, ready, pageNo, setPageNo, preview, error, setError } = usePdfPreview(file)
  const [info, setInfo] = useState<FormInfo | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [active, setActive] = useState<string | null>(null)
  const [flatten, setFlatten] = useState(false)
  const [busy, setBusy] = useState(false)
  /** Llenar los campos que hay o crear campos nuevos. */
  const [mode, setMode] = useState<'fill' | 'create'>('fill')

  useEffect(() => {
    setInfo(null)
    setValues({})
    setActive(null)
    if (!file) return
    let cancelled = false
    void (async () => {
      try {
        const { readForm } = await import('../core/pdfForm')
        const r = await readForm(await file.arrayBuffer())
        if (cancelled) return
        setInfo(r)
        setValues(Object.fromEntries(r.fields.map((f) => [f.name, f.value])))
        if (r.fields[0]) setPageNo(r.fields[0].page)
      } catch (e) {
        if (!cancelled) setError(errorMessage(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file, setError, setPageNo])

  const byPage = useMemo(() => {
    const m = new Map<number, FormField[]>()
    info?.fields.forEach((f) => m.set(f.page, [...(m.get(f.page) ?? []), f]))
    return [...m.entries()]
  }, [info])

  const focusField = (f: FormField) => {
    setActive(f.name)
    if (f.page !== pageNo) setPageNo(f.page)
  }

  const set = (name: string, v: string | boolean | string[]) => setValues((p) => ({ ...p, [name]: v }))
  const filled = info?.fields.filter((f) => {
    const v = values[f.name]
    return Array.isArray(v) ? v.length > 0 : !!v
  }).length ?? 0
  const missing = info?.fields.filter((f) => f.required && !f.readOnly && !values[f.name]) ?? []

  // Guardar y cargar las respuestas (W-147.2): un .json en el equipo para llenar otra vez el mismo formulario.
  const answersInput = useRef<HTMLInputElement>(null)
  const saveAnswers = async () => {
    if (!file || !info) return
    const { answersToJson } = await import('../core/pdfForm')
    download(new Blob([answersToJson(values, info.fields, file.name)], { type: 'application/json' }), `${baseName(file.name)}-${tr('file.answers')}.json`)
    track('pdf_tool_used', { tool_name: 'form_answers_save' })
  }
  const loadAnswers = async (f: File) => {
    if (!info) return
    const { answersFromJson } = await import('../core/pdfForm')
    const r = answersFromJson(await f.text(), info.fields)
    if (!r) {
      setError(tr('form.answersBad'))
      return
    }
    setError(null)
    setValues((p) => ({ ...p, ...r.values }))
    toast(r.skipped ? tr('form.answersLoadedSome', { n: r.used, skipped: r.skipped }) : tr('form.answersLoaded', { n: r.used }))
    track('pdf_tool_used', { tool_name: 'form_answers_load' })
  }

  const save = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { fillForm } = await import('../core/pdfForm')
      setOutput(resultFile(await fillForm(await file.arrayBuffer(), values, { flatten }), `${baseName(file.name)}-${tr('file.filled')}.pdf`, 'application/pdf'))
      track('pdf_tool_used', { tool_name: 'fill_form' })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_fill_form', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title={tr('form.pick')} hint={tr('common.dragHere')} onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const pageFields = info?.fields.filter((f) => f.page === pageNo) ?? []

  return (
    <div className="stack">
      <div className="card stack">
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow
            file={file}
            extra={info ? (info.fields.length === 1 ? tr('form.oneField') : tr('form.fields', { n: info.fields.length })) : tr('common.reading')}
            actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>{tr('common.change')}</button>}
          />
        </ul>
        <Segmented
          label={tr('form.mode')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'fill', label: tr('form.mode.fill') },
            { value: 'create', label: tr('form.mode.create') },
          ]}
        />
        {mode === 'fill' && info && !info.fields.length && (
          <Notice kind="info">
            {info.hasXfa ? tr('form.noFieldsXfa') : tr('form.noFieldsCreate')}{' '}
            {!info.hasXfa && <button type="button" className="link-btn" onClick={() => setMode('create')}>{tr('form.mode.create')}</button>}
          </Notice>
        )}
        {info && info.unsupported > 0 && <Notice kind="plain">{tr('form.unsupported', { n: info.unsupported })}</Notice>}
        {error && <Notice kind="error">{error}</Notice>}
      </div>

      {mode === 'create' && info && <FormCreate file={file} existing={info.fields} onFill={(f) => { setFile(f); setMode('fill') }} />}

      {mode === 'fill' && info && info.fields.length > 0 && (
        <div className="form-layout">
          <div className="card stack form-preview">
            {preview ? (
              <>
                <div className="sign-frame">
                  <div className="sign-stage">
                    <img src={preview.url} alt={tr('single.pageAlt', { n: pageNo })} draggable={false} />
                    {pageFields.flatMap((f) =>
                      f.rects
                        .filter((r) => r.page === pageNo - 1)
                        .map((r, i) => (
                          <button
                            key={f.name + i}
                            type="button"
                            className={'form-rect' + (active === f.name ? ' is-active' : '') + (values[f.name] && (!Array.isArray(values[f.name]) || (values[f.name] as string[]).length) ? ' is-filled' : '')}
                            style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                            aria-label={tr('form.goField', { name: f.label })}
                            onClick={() => {
                              setActive(f.name)
                              const el = document.getElementById(inputId(f.name))
                              el?.focus()
                              el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                            }}
                          />
                        )),
                    )}
                  </div>
                </div>
                <PageNav pageNo={pageNo} pages={pages} onChange={setPageNo} />
              </>
            ) : (
              <p className="faint">{tr('common.preparingPreview')}</p>
            )}
          </div>

          <div className="card stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" disabled={!filled} onClick={saveAnswers}><Icon name="download" /> {tr('form.saveAnswers')}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => answersInput.current?.click()}><Icon name="upload" /> {tr('form.loadAnswers')}</button>
              <input ref={answersInput} type="file" accept=".json,application/json" hidden aria-label={tr('form.loadAnswers')} onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadAnswers(f); e.target.value = '' }} />
            </div>
            {byPage.map(([page, fields]) => (
              <fieldset key={page} className="form-group">
                {byPage.length > 1 && <legend>{tr('form.pageN', { n: page })}</legend>}
                {fields.map((f) => (
                  <Field key={f.name} field={f} value={values[f.name]} active={active === f.name} onFocus={() => focusField(f)} onChange={(v) => set(f.name, v)} />
                ))}
              </fieldset>
            ))}
            <label className="check">
              <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
              <span>{tr('form.flatten')}</span>
            </label>
            {missing.length > 0 && <Notice kind="plain">{tr('form.missing', { list: missing.map((f) => f.label).join(', ') })}</Notice>}
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="faint">{tr('form.filled', { n: filled, total: info.fields.length })}</span>
              <BusyButton busy={busy} disabled={!ready} onClick={save} icon="check">
                {tr('form.go')}
              </BusyButton>
            </div>
          </div>
        </div>
      )}
      {mode === 'fill' && file && output && (
        <div className="card">
          <BeforeAfter original={file} result={output} toolName="form" title={tr('form.title')} />
        </div>
      )}
    </div>
  )
}

function Field({ field: f, value, active, onFocus, onChange }: { field: FormField; value: FormValues[string]; active: boolean; onFocus: () => void; onChange: (v: string | boolean | string[]) => void }) {
  const id = inputId(f.name)
  const label = (
    <>
      {f.label}
      {f.required && <span className="form-req" aria-label={tr('form.required')}> *</span>}
      {f.readOnly && <span className="faint"> ({tr('form.readOnly')})</span>}
    </>
  )
  const cls = 'form-field' + (active ? ' is-active' : '')

  if (f.kind === 'checkbox') {
    return (
      <label className={cls + ' check'}>
        <input id={id} type="checkbox" checked={value === true} disabled={f.readOnly} onFocus={onFocus} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
      </label>
    )
  }
  if (f.kind === 'radio' || f.kind === 'list') {
    const multi = f.kind === 'list'
    const selected = multi ? ((value as string[]) ?? []) : [value as string]
    return (
      <fieldset className={cls + ' form-options'} onFocus={onFocus}>
        <legend>{label}</legend>
        {f.options.map((o, i) => (
          <label key={o} className="check">
            <input
              id={i === 0 ? id : undefined}
              type={multi ? 'checkbox' : 'radio'}
              name={id}
              checked={selected.includes(o)}
              disabled={f.readOnly}
              onChange={(e) => onChange(multi ? (e.target.checked ? [...selected, o] : selected.filter((x) => x !== o)) : o)}
            />
            <span>{o}</span>
          </label>
        ))}
        {!multi && value && !f.readOnly && (
          <button type="button" className="link-btn faint" onClick={() => onChange('')}>{tr('form.clearSel')}</button>
        )}
      </fieldset>
    )
  }
  if (f.kind === 'dropdown') {
    return (
      <label className={cls + ' field'}>
        <span>{label}</span>
        <select id={id} className="input" value={(value as string) ?? ''} disabled={f.readOnly} onFocus={onFocus} onChange={(e) => onChange(e.target.value)}>
          <option value="">{tr('form.chooseOpt')}</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    )
  }
  const common = {
    id,
    className: 'input',
    value: (value as string) ?? '',
    disabled: f.readOnly,
    maxLength: f.maxLength ?? undefined,
    onFocus,
  }
  return (
    <label className={cls + ' field'}>
      <span>{label}</span>
      {f.multiline ? <textarea rows={3} {...common} onChange={(e) => onChange(e.target.value)} /> : <input {...common} onChange={(e) => onChange(e.target.value)} />}
      {f.maxLength && <small className="faint">{((value as string) ?? '').length} / {f.maxLength}</small>}
    </label>
  )
}
