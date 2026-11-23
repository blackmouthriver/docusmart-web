// Compresor y extractor de archivos (7-Zip en wasm): crear ZIP/7Z y abrir ZIP, RAR, 7Z, TAR y GZ.
import { useEffect, useMemo, useRef, useState } from 'react'
import { zipSync } from 'fflate'
import { go, useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import { baseName, download, formatBytes } from '../../../shared/files/files'
import { BeforeAfter, DocPreview } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import {
  EXTRACT_ACCEPT,
  ArchiveError,
  ArchiveTooBigError,
  WrongArchivePasswordError,
  VOLUME_SIZES,
  createArchiveParts,
  extractArchive,
  isFolderEntry,
  isZipSafePassword,
  listArchive,
  safeEntryPath,
  splitVolumes,
  type ArchiveEntry,
  type ArchivePart,
  type ArchiveFormat,
  type ArchiveInput,
  type ArchiveLevel,
} from '../core/archive'
import { track } from '../../../shared/platform/analytics'
import { RenameTool } from './RenameTool'
import { tr } from '../../../shared/i18n/translate'

// Por encima de esto el navegador puede quedarse sin memoria (todo se procesa en RAM).
const BIG = 700 * 1024 * 1024

/** Tipo por extensión, para que la vista previa reconozca PDF, imágenes y textos. */
function mimeFor(path: string): string {
  const e = path.toLowerCase().split('.').pop() ?? ''
  const map: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', txt: 'text/plain', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip' }
  return map[e] ?? 'application/octet-stream'
}

/** Archivos (no carpetas) de la lista. */
const files0 = (entries: ArchiveEntry[] | null) => entries?.filter((e) => !e.isDir) ?? []

/** Lo que la vista previa sabe mostrar: imágenes, PDF, texto y Office. */
const canView = (f: File) => /^(image\/(jpeg|png|webp|gif|bmp)|application\/pdf|text\/plain)$/.test(f.type) || /\.(docx|xlsx)$/i.test(f.name)

function friendly(e: unknown): string {
  if (e instanceof WrongArchivePasswordError) return tr('arch.wrongKey')
  if (e instanceof ArchiveTooBigError) return tr('libErr.archTooBig', { size: formatBytes(e.bytes), n: e.files })
  if (e instanceof ArchiveError) return e.message
  return tr('arch.failed')
}

export function ArchiveScreen({ sub }: { sub?: string }) {
  const mode = sub === 'extraer' || sub === 'renombrar' ? sub : 'crear'
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
            { value: 'renombrar', label: tr('arch.rename') },
          ]}
        />
      </div>
      {mode === 'crear' ? <CreateArchiveTool /> : mode === 'extraer' ? <ExtractArchiveTool /> : <RenameTool />}
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
  /** Dividido en partes para mandarlo en varios correos (W-146.10): 0 = sin dividir. */
  const [volumeMb, setVolumeMb] = useState(0)
  const [parts, setParts] = useState<File[] | null>(null)
  const inputFiles = useMemo(() => items.map((i) => i.file), [items])
  useEffect(() => {
    setOutput(null)
    setParts(null)
    setDone(null)
  }, [items, format, level, usePw, volumeMb])
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
      const made = await createArchiveParts(inputs, { format, level, password: usePw ? pw : undefined, volumeBytes: volumeMb * 1024 * 1024 })
      const base = `${(name.trim() || tr('file.files')).replace(/\.(zip|7z)$/i, '')}.${format}`
      const mime = format === 'zip' ? 'application/zip' : 'application/octet-stream'
      if (made.length === 1) {
        setOutput(resultFile(made[0].data, base, mime))
        setParts(null)
      } else {
        // "nombre.zip.001", ".002"…: cada parte por separado (para adjuntarlas en correos distintos).
        const files = made.map((m) => resultFile(m.data, base + m.name.slice(m.name.lastIndexOf('.')), 'application/octet-stream'))
        setParts(files)
        setOutput(null)
      }
      setDone({ before: total, after: made.reduce((n, m) => n + m.data.length, 0) })
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

      <div className="field">
        <span aria-hidden="true">{tr('arch.split')}</span>
        <Segmented
          label={tr('arch.split')}
          value={String(volumeMb)}
          onChange={(v: string) => setVolumeMb(Number(v))}
          options={[{ value: '0', label: tr('arch.noSplit') }, ...VOLUME_SIZES.map((mb) => ({ value: String(mb), label: `${mb} MB` }))]}
        />
        {volumeMb > 0 && <small className="faint">{tr('arch.splitHint')}</small>}
      </div>

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
      {parts && (
        <div className="stack">
          <Notice kind="success">{tr('arch.partsReady', { n: parts.length })}</Notice>
          <ul className="file-list" style={{ marginTop: 0 }}>
            {parts.map((f) => (
              <li key={f.name} className="file-item">
                <span className="ico ico-violet"><Icon name="archive" /></span>
                <div className="file-meta">
                  <b title={f.name}>{f.name}</b>
                  <small>{formatBytes(f.size)}</small>
                </div>
                <button type="button" className="icon-btn" aria-label={tr('img.downloadOne', { name: f.name })} onClick={() => download(f, f.name)}>
                  <Icon name="download" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {items.length > 0 && !parts && (
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
  /** Las otras partes de un archivo dividido (W-146.10). */
  const [parts, setParts] = useState<File[]>([])
  const [entries, setEntries] = useState<ArchiveEntry[] | null>(null)
  /** Qué archivos extraer (todos al principio) y cuál se está viendo. */
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [viewing, setViewing] = useState<File | null>(null)
  const [viewPage, setViewPage] = useState(1)
  const [viewPages, setViewPages] = useState(1)
  const [needsPw, setNeedsPw] = useState(false)
  const [pw, setPw] = useState('')
  const [extracted, setExtracted] = useState<ArchiveInput[] | null>(null)
  /** Lo extraído como archivos y el ZIP para guardarlo todo junto. */
  const extractedFiles = useMemo(() => (extracted ?? []).filter((f) => !isFolderEntry(f)).map((f) => resultFile(f.data, f.path.split('/').pop() || 'archivo', mimeFor(f.path))), [extracted])
  const [bundle, setBundle] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ext = (f: File) => (f.name.match(/\.([^.]+)$/)?.[1] ?? '').toLowerCase()

  const partData = async (list: File[]): Promise<ArchivePart[]> => Promise.all(list.map(async (p) => ({ name: p.name, data: new Uint8Array(await p.arrayBuffer()) })))

  const inspect = async (f: File, password = '', others: File[] = parts) => {
    setBusy(true)
    setError(null)
    try {
      const list = await listArchive(f.name, new Uint8Array(await f.arrayBuffer()), password, await partData(others))
      setEntries(list)
      setChosen(new Set(list.filter((e) => !e.isDir).map((e) => e.path)))
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

  const pick = (picked: File[]) => {
    setError(null)
    let main = picked[0]
    let others: File[] = []
    if (picked.length > 1) {
      // Varias partes de un mismo archivo: se abre la primera con las demás al lado.
      const set = splitVolumes(picked.map((p) => p.name))
      if (!set) {
        setError(tr('arch.notParts'))
        return
      }
      main = picked.find((p) => p.name === set.main)!
      others = picked.filter((p) => p !== main)
    }
    setFile(main)
    setParts(others)
    setEntries(null)
    setExtracted(null)
    setViewing(null)
    setNeedsPw(false)
    setPw('')
    void inspect(main, '', others)
  }

  const extract = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const all = await extractArchive(file.name, new Uint8Array(await file.arrayBuffer()), pw, 0, await partData(parts))
      if (!entries) setEntries(all.map((f) => ({ path: f.path, size: f.data.length, isDir: isFolderEntry(f), encrypted: needsPw })))
      // Solo lo elegido (las carpetas vacías se conservan).
      const wanted = new Set([...chosen].map(safeEntryPath))
      const files = !entries || chosen.size === files0(entries).length ? all : all.filter((f) => isFolderEntry(f) || wanted.has(f.path))
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

  const files = files0(entries)
  const toggle = (path: string) =>
    setChosen((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  return (
    <div className="card stack">
      {!file ? (
        <DropZone accept={EXTRACT_ACCEPT} multiple title={tr('arch.pickArchive')} hint={tr('arch.archHint2')} onFiles={pick} />
      ) : (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <li className="file-item">
            <span className="ico ico-violet"><Icon name="archive" /></span>
            <div className="file-meta">
              <b title={file.name}>{file.name}</b>
              <small>
                {formatBytes(file.size)}
                {entries ? ` · ${files.length === 1 ? tr('dp.file') : tr('dp.files', { n: files.length })}` : ''}
                {parts.length > 0 ? ` · ${tr('arch.partsN', { n: parts.length + 1 })}` : ''}
              </small>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setParts([]); setEntries(null); setExtracted(null); setViewing(null); setError(null) }}>{tr('common.change')}</button>
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
        <>
          {files.length > 1 && (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <small className="faint">{tr('arch.chosen', { n: chosen.size, total: files.length })}</small>
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setChosen(new Set(files.map((e) => e.path)))}>{tr('arch.all')}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setChosen(new Set())}>{tr('arch.none')}</button>
              </span>
            </div>
          )}
          <ul className="file-list" style={{ maxHeight: 260, overflow: 'auto', marginTop: 0 }}>
            {files.map((e) => (
              <li key={e.path} className="file-item">
                <input type="checkbox" checked={chosen.has(e.path)} onChange={() => toggle(e.path)} aria-label={tr('arch.choose', { name: e.path })} />
                <span className="ico ico-blue"><Icon name={e.encrypted ? 'lock' : 'file'} /></span>
                <div className="file-meta">
                  <b title={e.path}>{e.path}</b>
                  <small>{formatBytes(e.size)}</small>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {viewing && (
        <div className="card stack" style={{ padding: 12 }}>
          <DocPreview key={viewing.name} source={viewing} page={viewPage} label={viewing.name} onPages={setViewPages} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            {viewPages > 1 ? (
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn-ghost btn-sm" disabled={viewPage <= 1} onClick={() => setViewPage((n) => n - 1)}>‹</button>
                <small className="faint">{viewPage} / {viewPages}</small>
                <button type="button" className="btn btn-ghost btn-sm" disabled={viewPage >= viewPages} onClick={() => setViewPage((n) => n + 1)}>›</button>
              </span>
            ) : <span />}
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setViewing(null)}>{tr('arch.closeView')}</button>
          </div>
        </div>
      )}

      {extracted && (
        <ul className="file-list" style={{ maxHeight: 300, overflow: 'auto', marginTop: 0 }}>
          {extracted.map((f, i) => {
            const folder = isFolderEntry(f)
            const asFile = folder ? null : extractedFiles[extracted.slice(0, i).filter((x) => !isFolderEntry(x)).length]
            return (
              <li key={f.path} className="file-item">
                <span className={'ico ' + (folder ? 'ico-amber' : 'ico-green')}><Icon name={folder ? 'folder' : 'file'} /></span>
                <div className="file-meta">
                  <b title={f.path}>{f.path}</b>
                  <small>{folder ? tr('arch.emptyFolder') : formatBytes(f.data.length)}</small>
                </div>
                {asFile && canView(asFile) && (
                  <button type="button" className="icon-btn" aria-label={tr('arch.view', { name: f.path })} onClick={() => { setViewing(asFile); setViewPage(1); setViewPages(1) }}>
                    <Icon name="eye" />
                  </button>
                )}
                {!folder && (
                  <button type="button" className="icon-btn" aria-label={tr('img.downloadOne', { name: f.path })} onClick={() => download(f.data, f.path.split('/').pop() || 'archivo')}>
                    <Icon name="download" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {file && ext(file) === 'rar' && !error && <small className="faint">{tr('arch.rarNote')}</small>}

      <div className="row row-end">
        {!extracted && (
          <BusyButton busy={busy} disabled={!file || (needsPw && !pw) || (!!entries && files.length > 0 && chosen.size === 0)} onClick={extract} icon="archive">
            {entries && files.length > 1 && chosen.size < files.length ? tr('arch.extractN', { n: chosen.size }) : tr('arch.extract')}
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
