// Compresor y extractor de archivos (7-Zip en wasm): crear ZIP/7Z y abrir ZIP, RAR, 7Z, TAR y GZ.
import { useEffect, useRef, useState } from 'react'
import { zipSync } from 'fflate'
import { go, useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, HeroCard, Notice, Segmented } from '../components/ui'
import { baseName, download, formatBytes } from '../lib/files'
import {
  EXTRACT_ACCEPT,
  WrongArchivePasswordError,
  ZIP_PASSWORD_HINT,
  createArchive,
  extractArchive,
  isZipSafePassword,
  listArchive,
  type ArchiveEntry,
  type ArchiveFormat,
  type ArchiveInput,
  type ArchiveLevel,
} from '../lib/archive'
import { track } from '../../shared/analytics'

// Por encima de esto el navegador puede quedarse sin memoria (todo se procesa en RAM).
const BIG = 700 * 1024 * 1024

function friendly(e: unknown): string {
  if (e instanceof WrongArchivePasswordError) return 'La contraseña no es correcta.'
  const msg = e instanceof Error ? e.message : ''
  if (/^(El |La |En |No |Agrega )/.test(msg)) return msg
  return 'No se pudo procesar el archivo. Si es muy grande, prueba con menos archivos.'
}

export function ArchiveScreen({ sub }: { sub?: string }) {
  const mode = sub === 'extraer' ? 'extraer' : 'crear'
  return (
    <>
      <HeroCard title="Comprimir archivos" subtitle="Crea ZIP o 7Z y abre ZIP, RAR, 7Z, TAR o GZ, sin subir nada." />
      <div style={{ margin: '18px 0 14px' }}>
        <Segmented
          label="Modo"
          value={mode}
          onChange={(m) => go('archivos', m)}
          options={[
            { value: 'crear', label: 'Comprimir' },
            { value: 'extraer', label: 'Descomprimir' },
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
  const [name, setName] = useState('archivos')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ before: number; after: number } | null>(null)
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
      download(out, `${(name.trim() || 'archivos').replace(/\.(zip|7z)$/i, '')}.${format}`, format === 'zip' ? 'application/zip' : 'application/octet-stream')
      setDone({ before: total, after: out.length })
      track('archive_created', { format, level, files: items.length, encrypted: usePw })
      toast('Listo. El archivo comprimido se descargó.')
    } catch (e) {
      setError(friendly(e))
      track('app_error', { error_context: 'archive_create', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card stack">
      <DropZone accept="*/*" multiple title="Toca para agregar archivos" hint="Puedes agregar varios, de cualquier tipo" onFiles={add} />
      <div className="row">
        <button type="button" className="btn btn-soft btn-sm" onClick={() => folderInput.current?.click()}>
          <Icon name="folder" /> Agregar una carpeta
        </button>
        <input ref={folderInput} type="file" multiple hidden onChange={(e) => { add(Array.from(e.target.files ?? [])); e.target.value = '' }} />
        {items.length > 0 && (
          <span className="faint">
            {items.length} archivo{items.length === 1 ? '' : 's'} · {formatBytes(total)}
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
              <button type="button" className="icon-btn" aria-label={`Quitar ${it.path}`} onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {total > BIG && <Notice kind="info">Son {formatBytes(total)}: todo se procesa en la memoria del navegador y podría tardar o fallar. Si pasa, divide en partes.</Notice>}

      <div className="row" style={{ gap: 16 }}>
        <div className="field">
          <span>Formato</span>
          <Segmented label="Formato" value={format} onChange={setFormat} options={[{ value: 'zip', label: 'ZIP' }, { value: '7z', label: '7Z' }]} />
        </div>
        <div className="field">
          <span>Compresión</span>
          <Segmented
            label="Compresión"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'rapida', label: 'Rápida' },
              { value: 'normal', label: 'Normal' },
              { value: 'maxima', label: 'Máxima' },
            ]}
          />
        </div>
      </div>
      <small className="faint">
        {format === 'zip'
          ? 'ZIP se abre en cualquier equipo sin instalar nada.'
          : '7Z comprime más y, con contraseña, también oculta los nombres de los archivos. Para abrirlo se necesita 7-Zip, WinRAR o DocuSmart.'}
      </small>

      <label className="field">
        <span>Nombre del archivo</span>
        <input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="check">
        <input type="checkbox" checked={usePw} onChange={(e) => setUsePw(e.target.checked)} />
        <span>Proteger con contraseña (AES-256)</span>
      </label>
      {usePw && (
        <>
          <label className="field">
            <span>Contraseña</span>
            <input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label className="field">
            <span>Repite la contraseña</span>
            <input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          {zipPwBad && <small style={{ color: 'var(--danger)' }}>{ZIP_PASSWORD_HINT}</small>}
          {pw.length > 0 && pw.length < 4 && <small style={{ color: 'var(--danger)' }}>Usa al menos 4 caracteres.</small>}
          {pw2.length > 0 && pw !== pw2 && <small style={{ color: 'var(--danger)' }}>Las contraseñas no coinciden.</small>}
        </>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {done && (
        <Notice kind="success">
          {formatBytes(done.before)} → <b>{formatBytes(done.after)}</b>
          {done.after < done.before ? ` (${Math.round((1 - done.after / done.before) * 100)}% menos)` : ' (estos archivos ya venían comprimidos)'}. El archivo se descargó.
        </Notice>
      )}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={items.length === 0 || !pwOk} onClick={create} icon="archive">
          {`Crear ${format.toUpperCase()}`}
        </BusyButton>
      </div>
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
        if (password) setError('La contraseña no es correcta.')
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
      toast(`Se extrajeron ${files.length} archivo${files.length === 1 ? '' : 's'}.`)
    } catch (e) {
      setError(friendly(e))
      track('app_error', { error_context: 'archive_extract', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  const downloadAll = () => {
    if (!extracted || !file) return
    const zip = zipSync(Object.fromEntries(extracted.map((f) => [f.path, f.data])), { level: 0 })
    download(zip, `${baseName(file.name).replace(/\.tar$/i, '')}-extraido.zip`, 'application/zip')
  }

  const files = entries?.filter((e) => !e.isDir) ?? []

  return (
    <div className="card stack">
      {!file ? (
        <DropZone accept={EXTRACT_ACCEPT} title="Toca para abrir un comprimido" hint="ZIP, RAR, 7Z, TAR, GZ, BZ2 o XZ" onFiles={([f]) => pick(f)} />
      ) : (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <li className="file-item">
            <span className="ico ico-violet"><Icon name="archive" /></span>
            <div className="file-meta">
              <b title={file.name}>{file.name}</b>
              <small>
                {formatBytes(file.size)}
                {entries ? ` · ${files.length} archivo${files.length === 1 ? '' : 's'}` : ''}
              </small>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setEntries(null); setExtracted(null); setError(null) }}>Cambiar</button>
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
          <Notice kind="info">Este archivo tiene contraseña.</Notice>
          <label className="field">
            <span>Contraseña</span>
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
              <button type="button" className="icon-btn" aria-label={`Descargar ${f.path}`} onClick={() => download(f.data, f.path.split('/').pop() || 'archivo')}>
                <Icon name="download" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      {file && ext(file) === 'rar' && !error && <small className="faint">Los RAR se pueden abrir aquí; para crear uno nuevo usa ZIP o 7Z (el formato RAR es propietario).</small>}

      <div className="row row-end">
        {extracted ? (
          <button type="button" className="btn btn-primary" onClick={downloadAll}>
            <Icon name="download" /> Descargar todo (ZIP)
          </button>
        ) : (
          <BusyButton busy={busy} disabled={!file || (needsPw && !pw)} onClick={extract} icon="archive">
            Extraer archivos
          </BusyButton>
        )}
      </div>
    </div>
  )
}
