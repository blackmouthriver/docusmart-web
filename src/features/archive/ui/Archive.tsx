// Compresor y extractor de archivos (7-Zip en wasm): crear ZIP/7Z y abrir ZIP, RAR, 7Z, TAR y GZ.
import { useEffect, useMemo, useRef, useState } from 'react'
import { zipSync } from 'fflate'
import { go, useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import { baseName, download, formatBytes } from '../../../shared/files/files'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import {
  EXTRACT_ACCEPT,
  ArchiveError,
  ArchiveTooBigError,
  WrongArchivePasswordError,
  createArchive,
  extractArchive,
  isZipSafePassword,
  listArchive,
  type ArchiveEntry,
  type ArchiveFormat,
  type ArchiveInput,
  type ArchiveLevel,
} from '../core/archive'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'

// Por encima de esto el navegador puede quedarse sin memoria (todo se procesa en RAM).
const BIG = 700 * 1024 * 1024

/** Tipo por extensión, para que la vista previa reconozca PDF, imágenes y textos. */
function mimeFor(path: string): string {
  const e = path.toLowerCase().split('.').pop() ?? ''
  const map: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', txt: 'text/plain', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip' }
  return map[e] ?? 'application/octet-stream'
}

function friendly(e: unknown): string {
  if (e instanceof WrongArchivePasswordError) return tr('arch.wrongKey')
  if (e instanceof ArchiveTooBigError) return tr('libErr.archTooBig', { size: formatBytes(e.bytes), n: e.files })
  if (e instanceof ArchiveError) return e.message
  return tr('arch.failed')
}

export function ArchiveScreen({ sub }: { sub?: string }) {
  const mode = sub === 'extraer' ? 'extraer' : 'crear'
  return (
    <>
      <HeroCard title={tr('nav.archive')} subtitle={tr('arch.heroSub')} />
      <div style={{ margin: '18px 0 14px' }}>
        <Segmented
          label={tr('arch.mode')}
          value={mode}
          onChange={(m) => go('archivos', m)}
          options={[
            { value: 'crear', label: tr('arch.compress') },
            { value: 'extraer', label: tr('arch.decompress') },
          ]}
        />
      </div>
      {mode === 'crear' ? <CreateArchiveTool /> : <ExtractArchiveTool />}
    </>
  )
}

// ── Crear ZIP / 7Z ────────────────────────────────────────────────────
type Picked = { file: File; path: string }

export function CreateArchiveTool() {
  const { toast } = useApp()
  const [items, setItems] = useState<Picked[]>([])
  const [format, setFormat] = useState<ArchiveFormat>('zip')
  const [level, setLevel] = useState<ArchiveLevel>('normal')
  const [usePw, setUsePw] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [name, setName] = useState(() => tr('file.files'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ before: number; after: number } | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  const inputFiles = useMemo(() => items.map((i) => i.file), [items])
  useEffect(() => {
    setOutput(null)
    setDone(null)
  }, [items, format, level, usePw])
  const folderInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // webkitdirectory no está en los tipos de React: se agrega a mano.
    folderInput.current?.setAttribute('webkitdirectory', '')
  }, [])

  const add = (files: File[]) => {
    setDone(null)
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({ file, path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name })),
    ])
  }
  const total = items.reduce((n, i) => n + i.file.size, 0)
  const zipPwBad = usePw && format === 'zip' && pw.length > 0 && !isZipSafePassword(pw)
  const pwOk = !usePw || (pw.length >= 4 && pw === pw2 && !zipPwBad)

  const create = async () => {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const inputs: ArchiveInput[] = await Promise.all(items.map(async (i) => ({ path: i.path, data: new Uint8Array(await i.file.arrayBuffer()) })))
      const out = await createArchive(inputs, { format, level, password: usePw ? pw : undefined })
      setOutput(resultFile(out, `${(name.trim() || tr('file.files')).replace(/\.(zip|7z)$/i, '')}.${format}`, format === 'zip' ? 'application/zip' : 'application/octet-stream'))
      setDone({ before: total, after: out.length })
      track('archive_created', { format, level, files: items.length, encrypted: usePw })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(friendly(e))
      track('app_error', { error_context: 'archive_create', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card stack">
      <DropZone accept="*/*" multiple title={tr('arch.pickFiles')} hint={tr('arch.pickHint')} onFiles={add} />
      <div className="row">
        <button type="button" className="btn btn-soft btn-sm" onClick={() => folderInput.current?.click()}>
          <Icon name="folder" /> {tr('arch.addFolder')}
        </button>
        <input ref={folderInput} type="file" multiple hidden onChange={(e) => { add(Array.from(e.target.files ?? [])); e.target.value = '' }} />
        {items.length > 0 && (
          <span className="faint">
            {items.length === 1 ? tr('dp.file') : tr('dp.files', { n: items.length })} · {formatBytes(total)}
          </span>
        )}
      </div>
      {items.length > 0 && (
        <ul className="file-list" style={{ maxHeight: 260, overflow: 'auto' }}>
          {items.map((it, i) => (
            <li key={it.path + i} className="file-item">
              <span className="ico ico-blue"><Icon name="file" /></span>
              <div className="file-meta">
                <b title={it.path}>{it.path}</b>
                <small>{formatBytes(it.file.size)}</small>
              </div>
              <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: it.path })} onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {total > BIG && <Notice kind="info">{tr('arch.big', { size: formatBytes(total) })}</Notice>}

      <div className="row" style={{ gap: 16 }}>
        <div className="field">
          <span>{tr('single.format')}</span>
          <Segmented label={tr('single.format')} value={format} onChange={setFormat} options={[{ value: 'zip', label: 'ZIP' }, { value: '7z', label: '7Z' }]} />
        </div>
        <div className="field">
          <span>{tr('arch.level')}</span>
          <Segmented
            label={tr('arch.level')}
            value={level}
            onChange={setLevel}
            options={[
              { value: 'rapida', label: tr('arch.fast') },
              { value: 'normal', label: tr('arch.normal') },
              { value: 'maxima', label: tr('arch.max') },
            ]}
          />
        </div>
      </div>
      <small className="faint">
        {format === 'zip'
          ? tr('arch.zipNote')
          : tr('arch.7zNote')}
      </small>

      <label className="field">
        <span>{tr('arch.name')}</span>
        <input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="check">
        <input type="checkbox" checked={usePw} onChange={(e) => setUsePw(e.target.checked)} />
        <span>{tr('arch.protect')}</span>
      </label>
      {usePw && (
        <>
          <label className="field">
            <span>{tr('arch.key')}</span>
            <input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label className="field">
            <span>{tr('arch.key2')}</span>
            <input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          {zipPwBad && <small style={{ color: 'var(--danger)' }}>{tr('arch.zipKeyHint')}</small>}
          {pw.length > 0 && pw.length < 4 && <small style={{ color: 'var(--danger)' }}>{tr('arch.min4')}</small>}
          {pw2.length > 0 && pw !== pw2 && <small style={{ color: 'var(--danger)' }}>{tr('arch.mismatch')}</small>}
        </>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={items.length === 0 || !pwOk} onClick={create} icon="archive">
          {tr('arch.create', { fmt: format.toUpperCase() })}
        </BusyButton>
      </div>
      {items.length > 0 && (
        <BeforeAfter
          originals={inputFiles}
          result={output}
          labels={[tr('conv.yourFiles'), format.toUpperCase()]}
          toolName="archive_create"
          title={tr('arch.title', { fmt: format.toUpperCase() })}
          previewTitle={tr('arch.toCompress')}
          placeholder={busy ? tr('arch.compressing') : tr('arch.press', { fmt: format.toUpperCase() })}
          summary={
            done && (
              <Notice kind="success">
                {formatBytes(done.before)} → <b>{formatBytes(done.after)}</b>
                {done.after < done.before ? ` (${tr('common.lessPct', { n: Math.round((1 - done.after / done.before) * 100) })})` : ` (${tr('arch.alreadyCompressed')})`}.
              </Notice>
            )
          }
        />
      )}
    </div>
  )
}

// ── Extraer ZIP / RAR / 7Z / TAR / GZ ─────────────────────────────────
export function ExtractArchiveTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null)
  const [needsPw, setNeedsPw] = useState(false)
  const [pw, setPw] = useState('')
  const [extracted, setExtracted] = useState<ArchiveInput[] | null>(null)
  /** Lo extraído como archivos y el ZIP para guardarlo todo junto. */
  const extractedFiles = useMemo(() => (extracted ?? []).map((f) => resultFile(f.data, f.path.split('/').pop() || 'archivo', mimeFor(f.path))), [extracted])
  const [bundle, setBundle] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ext = (f: File) => (f.name.match(/\.([^.]+)$/)?.[1] ?? '').toLowerCase()

  const inspect = async (f: File, password = '') => {
    setBusy(true)
    setError(null)
    try {
      const list = await listArchive(f.name, new Uint8Array(await f.arrayBuffer()), password)
      setEntries(list)
      setNeedsPw(list.some((e) => e.encrypted))
    } catch (e) {
      if (e instanceof WrongArchivePasswordError) {
        // 7Z con nombres cifrados: ni siquiera se puede listar sin la clave.
        setNeedsPw(true)
        if (password) setError(tr('arch.wrongKey'))
      } else setError(friendly(e))
    } finally {
      setBusy(false)
    }
  }

  const pick = (f: File) => {
    setFile(f)
    setEntries(null)
    setExtracted(null)
    setNeedsPw(false)
    setPw('')
    void inspect(f)
  }

  const extract = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const files = await extractArchive(file.name, new Uint8Array(await file.arrayBuffer()), pw)
      if (!entries) setEntries(files.map((f) => ({ path: f.path, size: f.data.length, isDir: false, encrypted: needsPw })))
      setExtracted(files)
      track('archive_extracted', { format: ext(file), files: files.length })
      toast(files.length === 1 ? tr('arch.extractedOne') : tr('arch.extractedMany', { n: files.length }))
    } catch (e) {
      setError(friendly(e))
      track('app_error', { error_context: 'archive_extract', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  // Todo lo extraído en un ZIP (con sus carpetas) para guardarlo de una vez.
  useEffect(() => {
    if (!extracted || !file) {
      setBundle(null)
      return
    }
    const zip = zipSync(Object.fromEntries(extracted.map((f) => [f.path, f.data])), { level: 0 })
    setBundle(extracted.length === 1 ? extractedFiles[0] : resultFile(zip, `${baseName(file.name).replace(/\.tar$/i, '')}-${tr('file.extracted')}.zip`, 'application/zip'))
  }, [extracted, extractedFiles, file])

  const files = entries?.filter((e) => !e.isDir) ?? []

  return (
    <div className="card stack">
      {!file ? (
        <DropZone accept={EXTRACT_ACCEPT} title={tr('arch.pickArchive')} hint={tr('arch.archHint')} onFiles={([f]) => pick(f)} />
      ) : (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <li className="file-item">
            <span className="ico ico-violet"><Icon name="archive" /></span>
            <div className="file-meta">
              <b title={file.name}>{file.name}</b>
              <small>
                {formatBytes(file.size)}
                {entries ? ` · ${files.length === 1 ? tr('dp.file') : tr('dp.files', { n: files.length })}` : ''}
              </small>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setEntries(null); setExtracted(null); setError(null) }}>{tr('common.change')}</button>
          </li>
        </ul>
      )}

      {needsPw && !extracted && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            void extract()
          }}
        >
          <Notice kind="info">{tr('arch.hasKey')}</Notice>
          <label className="field">
            <span>{tr('arch.key')}</span>
            <input className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
        </form>
      )}

      {files.length > 0 && !extracted && (
        <ul className="file-list" style={{ maxHeight: 260, overflow: 'auto', marginTop: 0 }}>
          {files.map((e) => (
            <li key={e.path} className="file-item">
              <span className="ico ico-blue"><Icon name={e.encrypted ? 'lock' : 'file'} /></span>
              <div className="file-meta">
                <b title={e.path}>{e.path}</b>
                <small>{formatBytes(e.size)}</small>
              </div>
            </li>
          ))}
        </ul>
      )}

      {extracted && (
        <ul className="file-list" style={{ maxHeight: 300, overflow: 'auto', marginTop: 0 }}>
          {extracted.map((f) => (
            <li key={f.path} className="file-item">
              <span className="ico ico-green"><Icon name="file" /></span>
              <div className="file-meta">
                <b title={f.path}>{f.path}</b>
                <small>{formatBytes(f.data.length)}</small>
              </div>
              <button type="button" className="icon-btn" aria-label={tr('img.downloadOne', { name: f.path })} onClick={() => download(f.data, f.path.split('/').pop() || 'archivo')}>
                <Icon name="download" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {file && ext(file) === 'rar' && !error && <small className="faint">{tr('arch.rarNote')}</small>}

      <div className="row row-end">
        {!extracted && (
          <BusyButton busy={busy} disabled={!file || (needsPw && !pw)} onClick={extract} icon="archive">
            {tr('arch.extract')}
          </BusyButton>
        )}
      </div>
      {file && extracted && extractedFiles.length > 0 && (
        <BeforeAfter
          original={file}
          result={null}
          results={extractedFiles}
          saveAs={bundle}
          labels={[tr('arch.archived'), tr('arch.extractedLbl')]}
          toolName="archive_extract"
          title={tr('arch.inside')}
          summary={extractedFiles.length > 1 ? <Notice kind="success">{tr('arch.zipAll', { n: extractedFiles.length })}</Notice> : undefined}
        />
      )}
    </div>
  )
}
