// Renombrar varios archivos a la vez (W-111): se ve cómo quedan y se descargan en un ZIP.
import { useMemo, useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Segmented } from '../../../shared/ui/ui'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { bundleFiles } from '../../../shared/files/share'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { DEFAULT_RENAME, renameAll, type CaseMode, type RenameOptions } from '../core/renameBatch'

const PREVIEW_ROWS = 8

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" value={value} spellCheck={false} autoComplete="off" maxLength={80} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function RenameTool() {
  const { toast } = useApp()
  const [files, setFiles] = useState<File[]>([])
  const [o, setO] = useState<RenameOptions>(DEFAULT_RENAME)
  const [busy, setBusy] = useState(false)
  const [zip, setZip] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const names = useMemo(() => files.map((f) => f.name), [files])
  const planned = useMemo(() => renameAll(names, o, tr('file.files')), [names, o])
  const changed = planned.some((n, i) => n !== names[i])
  const set = <K extends keyof RenameOptions>(key: K, value: RenameOptions[K]) => {
    setO((prev) => ({ ...prev, [key]: value }))
    setZip(null)
  }

  const create = async () => {
    setBusy(true)
    setError(null)
    setZip(null)
    try {
      const renamedFiles = files.map((f, i) => new File([f], planned[i], { type: f.type, lastModified: f.lastModified }))
      setZip(await bundleFiles(renamedFiles, `${tr('ren.zipName')}.zip`))
      track('files_renamed', { files: files.length })
      toast(tr('common.doneReview'))
    } catch {
      setError(tr('arch.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card stack">
      <DropZone
        accept="*/*"
        multiple
        title={tr('ren.pick')}
        hint={tr('ren.pickHint')}
        onFiles={(f) => {
          setFiles((prev) => [...prev, ...f])
          setZip(null)
        }}
      />
      {files.length > 0 && (
        <>
          <ul className="file-list" style={{ maxHeight: 220, overflow: 'auto' }}>
            {files.map((f, i) => (
              <FileRow
                key={f.name + i}
                file={f}
                actions={
                  <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} disabled={busy} onClick={() => { setFiles((prev) => prev.filter((_, j) => j !== i)); setZip(null) }}>
                    <Icon name="close" />
                  </button>
                }
              />
            ))}
          </ul>
          <div className="rename-grid">
            <Text label={tr('ren.newName')} value={o.newName} onChange={(v) => set('newName', v)} />
            <Text label={tr('ren.find')} value={o.find} onChange={(v) => set('find', v)} />
            <Text label={tr('ren.replace')} value={o.replace} onChange={(v) => set('replace', v)} />
            <Text label={tr('ren.prefix')} value={o.prefix} onChange={(v) => set('prefix', v)} />
            <Text label={tr('ren.suffix')} value={o.suffix} onChange={(v) => set('suffix', v)} />
          </div>
          <label className="check">
            <input type="checkbox" checked={o.numbering} onChange={(e) => set('numbering', e.target.checked)} />
            <span>{tr('ren.numbering')}</span>
          </label>
          {o.numbering && (
            <div className="rename-grid">
              <label className="field">
                <span>{tr('ren.start')}</span>
                <input className="input" type="number" inputMode="numeric" min={0} max={999999} value={o.start} onChange={(e) => set('start', Number(e.target.value))} />
              </label>
              <label className="field">
                <span>{tr('ren.digits')}</span>
                <input className="input" type="number" inputMode="numeric" min={1} max={6} value={o.digits} onChange={(e) => set('digits', Number(e.target.value))} />
              </label>
            </div>
          )}
          <div className="field">
            <span>{tr('ren.case')}</span>
            <Segmented
              label={tr('ren.case')}
              value={o.caseMode}
              onChange={(v: CaseMode) => set('caseMode', v)}
              options={[
                { value: 'keep', label: tr('ren.caseKeep') },
                { value: 'lower', label: tr('ren.caseLower') },
                { value: 'upper', label: tr('ren.caseUpper') },
              ]}
            />
          </div>
          <section className="rename-preview" aria-label={tr('ren.preview')}>
            <h3>{tr('ren.preview')}</h3>
            <ul>
              {planned.slice(0, PREVIEW_ROWS).map((n, i) => (
                <li key={n + i}>
                  <span className="faint">{names[i]}</span>
                  <span aria-hidden="true">→</span>
                  <b>{n}</b>
                </li>
              ))}
            </ul>
            {planned.length > PREVIEW_ROWS && <small className="faint">{tr('ren.more', { n: planned.length - PREVIEW_ROWS })}</small>}
          </section>
          {!changed && <Notice kind="info">{tr('ren.same')}</Notice>}
          {error && <Notice kind="error">{error}</Notice>}
          <div className="row row-end">
            <BusyButton busy={busy} disabled={!changed} onClick={() => void create()} icon="download">
              {tr('ren.go', { n: files.length })}
            </BusyButton>
          </div>
          {zip && <SaveOptions file={zip} toolName="archive_rename" />}
        </>
      )}
    </div>
  )
}
