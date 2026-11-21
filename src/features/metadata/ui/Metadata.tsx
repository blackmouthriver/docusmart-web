// Quitar metadatos (W-106): muestra qué datos ocultos traen fotos, PDF y documentos de
// Office, y entrega una copia sin ellos. Todo en el navegador.
import { useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, HeroCard, Notice } from '../../../shared/ui/ui'
import { SaveOptions } from '../../../shared/ui/DocPreview'
import { bundleFiles, resultFile } from '../../../shared/files/share'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { META_ACCEPT, MetaError, cleanFileName, isKept, leftovers, readMetadata, stripMetadata, type MetaField } from '../core/metadata'

type Item = { file: File; fields?: MetaField[]; error?: string }
type Done = { file: File; before: MetaField[]; after: MetaField[] }

const errorText = (e: unknown) => tr(e instanceof MetaError ? (`meta.err.${e.reason}` as MessageKey) : 'meta.err.damaged')
const bytesOf = async (f: File) => new Uint8Array(await f.arrayBuffer())

export function MetadataScreen() {
  return (
    <>
      <HeroCard title={tr('tools.meta')} subtitle={tr('meta.heroSub')} />
      <div style={{ marginTop: 18 }}>
        <MetadataTool />
      </div>
    </>
  )
}

function Fields({ fields, title }: { fields: MetaField[]; title: string }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <b className="meta-title">{title}</b>
      <dl className="meta-list">
        {fields.map((f, i) => (
          <div key={i} className={f.key === 'gps' ? 'meta-gps' : undefined}>
            <dt>{f.key === 'gps' && <Icon name="alert" />} {tr(`meta.k.${f.key}` as MessageKey)}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function MetadataTool() {
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Done[] | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pick = async (files: File[]) => {
    setDone(null)
    setOutput(null)
    setError(null)
    const read = await Promise.all(
      files.map(async (file): Promise<Item> => {
        try {
          return { file, fields: await readMetadata(file.name, await bytesOf(file)) }
        } catch (e) {
          return { file, error: errorText(e) }
        }
      }),
    )
    setItems((prev) => [...prev, ...read])
  }

  const usable = items.filter((i) => i.fields)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const results: Done[] = []
      for (const it of usable) {
        const r = await stripMetadata(it.file.name, await bytesOf(it.file))
        results.push({ file: resultFile(r.bytes, cleanFileName(it.file.name, tr('file.noMeta')), it.file.type || 'application/octet-stream'), before: r.before, after: r.after })
      }
      setDone(results)
      setOutput(await bundleFiles(results.map((r) => r.file), `${tr('file.zipNoMeta')}.zip`))
      track('metadata_removed', { files: results.length, found: results.reduce((n, r) => n + r.before.length, 0) })
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = (i: number) => {
    setItems((prev) => prev.filter((_, j) => j !== i))
    setDone(null)
    setOutput(null)
  }

  return (
    <div className="stack">
      <div className="card stack">
        <DropZone accept={META_ACCEPT} multiple onFiles={(fs) => void pick(fs)} title={tr('meta.pick')} hint={tr('meta.pickHint')} />
        {items.map((it, i) => (
          <div key={i} className="meta-item stack">
            <ul className="file-list" style={{ marginTop: 0 }}>
              <FileRow
                file={it.file}
                extra={it.fields ? tr('meta.count', { n: it.fields.length }) : undefined}
                actions={
                  <button type="button" className="icon-btn" aria-label={`${tr('meta.removeFile')} ${it.file.name}`} disabled={busy} onClick={() => remove(i)}>
                    <Icon name="close" />
                  </button>
                }
              />
            </ul>
            {it.error && <Notice kind="error">{it.error}</Notice>}
            {it.fields && (it.fields.length ? <Fields fields={it.fields} title={tr('meta.found', { n: it.fields.length })} /> : <small className="faint">{tr('meta.none')}</small>)}
            {it.fields?.some((f) => f.key === 'gps') && <Notice kind="info">{tr('meta.gpsWarn')}</Notice>}
          </div>
        ))}
        <small className="faint">{tr('meta.note')}</small>
        <small className="faint">{tr('meta.privacy')}</small>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!usable.length} onClick={() => void run()} icon="eraser">
            {usable.length > 1 ? tr('meta.goN', { n: usable.length }) : tr('meta.go')}
          </BusyButton>
        </div>
      </div>

      {done && (
        <div className="card stack" aria-live="polite">
          <h3>{done.length > 1 ? tr('meta.doneMany', { n: done.length }) : tr('meta.doneOne')}</h3>
          {done.map((d, i) => {
            const left = leftovers(d.after)
            return (
              <div key={i} className="meta-item stack">
                <b>{d.file.name}</b>
                <small>{tr('meta.beforeAfter', { before: d.before.length, after: left.length })}</small>
                {left.length ? (
                  <Notice kind="error">{tr('meta.left', { list: left.map((f) => tr(`meta.k.${f.key}` as MessageKey)).join(', ') })}</Notice>
                ) : (
                  <small className="faint">{d.after.some(isKept) ? tr('meta.afterKept') : tr('meta.after')}</small>
                )}
              </div>
            )
          })}
          {output && <SaveOptions file={output} toolName="metadata" />}
        </div>
      )}
    </div>
  )
}
