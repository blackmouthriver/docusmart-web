// Crear campos de formulario (W-147.2): se dibujan sobre la página y se guarda un PDF rellenable.
import { useRef, useState, type PointerEvent } from 'react'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BusyButton, Notice, Segmented, errorMessage } from '../../../shared/ui/ui'
import { baseName } from '../../../shared/files/files'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { track } from '../../../shared/platform/analytics'
import type { FormField } from '../core/pdfForm'
import type { NewField, NewFieldKind } from '../core/pdfFormCreate'
import { PageNav, usePdfPreview } from './PdfPreview'

type Draft = NewField & { id: number; optionsText: string }
type Point = { x: number; y: number }

const KINDS: Array<{ kind: NewFieldKind; icon: IconName }> = [
  { kind: 'text', icon: 'text' },
  { kind: 'multiline', icon: 'file' },
  { kind: 'checkbox', icon: 'check' },
  { kind: 'radio', icon: 'circle' },
  { kind: 'dropdown', icon: 'downArrow' },
]

/** Tamaño al hacer un clic sin arrastrar (fracción del ancho; el alto se calcula con la proporción de la página). */
const DEFAULT_SIZE: Record<NewFieldKind, [number, number]> = { text: [0.35, 0.045], multiline: [0.5, 0.14], checkbox: [0.035, 0.035], radio: [0.3, 0.12], dropdown: [0.3, 0.045] }

let nextId = 0
const clamp = (v: number) => Math.min(1, Math.max(0, v))

export function FormCreate({ file, existing, onFill }: { file: File; existing: FormField[]; onFill: (f: File) => void }) {
  const { pages, ready, pageNo, setPageNo, preview, error, setError } = usePdfPreview(file)
  const [kind, setKind] = useState<NewFieldKind>('text')
  const [fields, setFields] = useState<Draft[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [draft, setDraft] = useState<{ a: Point; b: Point } | null>(null)
  const [busy, setBusy] = useState(false)
  const [output, setOutput] = useState<File | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<{ mode: 'draw'; a: Point } | { mode: 'move'; id: number; from: Point; start: Point } | null>(null)

  const ratio = preview ? preview.widthPt / preview.heightPt : 0.7
  const at = (e: PointerEvent): Point => {
    const r = stage.current!.getBoundingClientRect()
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) }
  }
  const change = (id: number, patch: Partial<Draft>) => {
    setFields((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)))
    setOutput(null)
  }
  const add = (rect: { x: number; y: number; w: number; h: number }) => {
    const n = fields.length + 1
    const f: Draft = { id: ++nextId, kind, name: tr(`form.newName.${kind}` as MessageKey, { n }), page: pageNo - 1, ...rect, options: [], optionsText: kind === 'radio' || kind === 'dropdown' ? tr('form.newOptions') : '', required: false }
    f.options = f.optionsText ? f.optionsText.split(',').map((s) => s.trim()) : []
    setFields((list) => [...list, f])
    setSelected(f.id)
    setOutput(null)
    track('pdf_tool_used', { tool_name: 'form_field_add', kind })
  }

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.form-rect')) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const a = at(e)
    drag.current = { mode: 'draw', a }
    setDraft({ a, b: a })
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const p = at(e)
    if (d.mode === 'draw') setDraft({ a: d.a, b: p })
    else {
      const f = fields.find((x) => x.id === d.id)
      if (f) change(d.id, { x: clamp(Math.min(1 - f.w, d.start.x + p.x - d.from.x)), y: clamp(Math.min(1 - f.h, d.start.y + p.y - d.from.y)) })
    }
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (d?.mode !== 'draw' || !draft) return
    setDraft(null)
    const x = Math.min(draft.a.x, draft.b.x)
    const y = Math.min(draft.a.y, draft.b.y)
    const w = Math.abs(draft.b.x - draft.a.x)
    const h = Math.abs(draft.b.y - draft.a.y)
    if (w > 0.015 && h > 0.01) return add({ x, y, w, h })
    // Un clic: el tamaño por defecto, sin salirse de la página.
    const [dw, dhw] = DEFAULT_SIZE[kind]
    const dh = kind === 'checkbox' ? dw * ratio : dhw
    add({ x: Math.min(x, 1 - dw), y: Math.min(y, 1 - dh), w: dw, h: dh })
  }
  const startMove = (e: PointerEvent<HTMLButtonElement>, f: Draft) => {
    e.stopPropagation()
    setSelected(f.id)
    stage.current?.setPointerCapture?.(e.pointerId)
    drag.current = { mode: 'move', id: f.id, from: at(e), start: { x: f.x, y: f.y } }
  }

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const { addFormFields } = await import('../core/pdfFormCreate')
      const out = await addFormFields(await file.arrayBuffer(), fields.map(({ id: _id, optionsText: _t, ...f }) => f))
      setOutput(resultFile(out, `${baseName(file.name)}-${tr('file.fillable')}.pdf`, 'application/pdf'))
      track('pdf_tool_used', { tool_name: 'form_create', fields: fields.length })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const onPage = fields.filter((f) => f.page === pageNo - 1)
  const existingRects = existing.flatMap((f) => f.rects.filter((r) => r.page === pageNo - 1).map((r, i) => ({ key: f.name + i, ...r })))
  const sel = fields.find((f) => f.id === selected) ?? null
  const draftBox = draft && { x: Math.min(draft.a.x, draft.b.x), y: Math.min(draft.a.y, draft.b.y), w: Math.abs(draft.b.x - draft.a.x), h: Math.abs(draft.b.y - draft.a.y) }
  const pct = (v: number) => `${v * 100}%`

  return (
    <div className="form-layout">
      <div className="card stack form-preview">
        <div className="field">
          <span aria-hidden="true">{tr('form.newKind')}</span>
          <Segmented label={tr('form.newKind')} value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k.kind, label: tr(`form.kind.${k.kind}` as MessageKey) }))} />
          <small className="faint">{tr('form.createHint')}</small>
        </div>
        {preview ? (
          <>
            <div className="sign-frame">
              <div className="sign-stage form-create-stage" ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="application" aria-label={tr('form.createStage', { n: pageNo })}>
                <img src={preview.url} alt={tr('single.pageAlt', { n: pageNo })} draggable={false} />
                {existingRects.map((r) => (
                  <span key={r.key} className="form-rect is-existing" style={{ left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) }} aria-hidden="true" />
                ))}
                {onPage.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={'form-rect is-new' + (f.id === selected ? ' is-active' : '')}
                    style={{ left: pct(f.x), top: pct(f.y), width: pct(f.w), height: pct(f.h) }}
                    aria-label={tr('form.selectField', { name: f.name })}
                    onPointerDown={(e) => startMove(e, f)}
                    onClick={() => setSelected(f.id)}
                  >
                    <span className="form-rect-label">{f.name}</span>
                  </button>
                ))}
                {draftBox && <span className="form-rect is-draft" style={{ left: pct(draftBox.x), top: pct(draftBox.y), width: pct(draftBox.w), height: pct(draftBox.h) }} aria-hidden="true" />}
              </div>
            </div>
            <PageNav pageNo={pageNo} pages={pages} onChange={setPageNo} />
          </>
        ) : (
          <p className="faint">{tr('common.preparingPreview')}</p>
        )}
      </div>

      <div className="card stack">
        <h3>{fields.length ? tr('form.newCount', { n: fields.length }) : tr('form.newNone')}</h3>
        {fields.map((f) => (
          <fieldset key={f.id} className={'form-group form-new' + (f.id === sel?.id ? ' is-active' : '')} onFocus={() => setSelected(f.id)}>
            <legend>
              <Icon name={KINDS.find((k) => k.kind === f.kind)!.icon} /> {tr(`form.kind.${f.kind}` as MessageKey)} · {tr('form.pageN', { n: f.page + 1 })}
            </legend>
            <label className="field">
              <span>{tr('form.newFieldName')}</span>
              <input className="input" maxLength={80} value={f.name} onChange={(e) => change(f.id, { name: e.target.value })} />
            </label>
            {(f.kind === 'radio' || f.kind === 'dropdown') && (
              <label className="field">
                <span>{tr('form.newFieldOptions')}</span>
                <textarea
                  className="textarea"
                  rows={2}
                  value={f.optionsText}
                  onChange={(e) => change(f.id, { optionsText: e.target.value, options: e.target.value.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean) })}
                />
                <small className="faint">{tr('form.newFieldOptionsHint')}</small>
              </label>
            )}
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <label className="check">
                <input type="checkbox" checked={f.required} onChange={(e) => change(f.id, { required: e.target.checked })} />
                <span>{tr('form.newRequired')}</span>
              </label>
              <div className="row" style={{ gap: 4 }}>
                {f.page !== pageNo - 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPageNo(f.page + 1)}>{tr('form.goToPage')}</button>}
                <button type="button" className="icon-btn" aria-label={tr('form.removeField', { name: f.name })} onClick={() => { setFields((list) => list.filter((x) => x.id !== f.id)); setOutput(null) }}><Icon name="trash" /></button>
              </div>
            </div>
          </fieldset>
        ))}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!ready || !fields.length} onClick={save} icon="check">
            {tr('form.createGo')}
          </BusyButton>
        </div>
        {output && (
          <div className="stack" aria-live="polite">
            <Notice kind="success">{tr('form.createDone', { n: fields.length })}</Notice>
            <SaveOptions file={output} toolName="form_create" />
            <button type="button" className="btn btn-soft" onClick={() => onFill(output)}><Icon name="edit" /> {tr('form.fillNow')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
