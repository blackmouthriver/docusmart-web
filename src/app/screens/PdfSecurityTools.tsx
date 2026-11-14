// Comprimir, proteger, desbloquear y reparar PDF (qpdf + pdf-lib + pdf.js, todo en el navegador).
import { useState } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented } from '../components/ui'
import { baseName, download, formatBytes } from '../lib/files'
import { WrongPasswordError, compressLossless, isEncrypted, protect, repair, unlock, type CompressResult } from '../lib/pdfSecurity'
import { track } from '../../shared/analytics'

const PDF = 'application/pdf'

function friendly(e: unknown): string {
  if (e instanceof WrongPasswordError) return 'La contraseña no es correcta.'
  const msg = e instanceof Error ? e.message : ''
  if (/encrypt|password/i.test(msg)) return 'Este PDF tiene contraseña. Quítala primero con "Desbloquear PDF".'
  if (/^(El |La |No |Falta |Este )/.test(msg)) return msg
  return 'No se pudo procesar el archivo. Revisa que sea un PDF válido.'
}

/** Selector de un PDF con la fila del archivo elegido y botón para cambiarlo. */
function PickPdf({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  if (!file) {
    return <DropZone accept={PDF} title="Toca para seleccionar un PDF" hint="O arrástralo aquí" onFiles={([f]) => onFile(f)} />
  }
  return (
    <ul className="file-list" style={{ marginTop: 0 }}>
      <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => onFile(null)}>Cambiar</button>} />
    </ul>
  )
}

function useJob(toolName: string) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<void>, okMsg = 'Listo. El archivo se descargó.') => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      track('pdf_tool_used', { tool_name: toolName })
      toast(okMsg)
    } catch (e) {
      setError(friendly(e))
      track('app_error', { error_context: 'pdf_tool_' + toolName, error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

// ── Comprimir ─────────────────────────────────────────────────────────
type Level = 'sin-perdida' | 'media' | 'alta'

export function CompressTool() {
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<Level>('sin-perdida')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<CompressResult | null>(null)
  const { busy, error, run } = useJob('compress')

  const go = () =>
    run(async () => {
      setResult(null)
      setProgress(0)
      const bytes = new Uint8Array(await file!.arrayBuffer())
      if (await isEncrypted(bytes)) throw new Error('Este PDF tiene contraseña. Quítala primero con "Desbloquear PDF".')
      let r: CompressResult
      if (level === 'sin-perdida') {
        r = await compressLossless(bytes)
      } else {
        const { compressStrong } = await import('../lib/pdfCompress')
        r = await compressStrong(bytes, level, (d, t) => setProgress(d / t))
        // Sobre el resultado fuerte también se aplica la optimización sin pérdida.
        if (r.improved) {
          const extra = await compressLossless(r.bytes)
          if (extra.improved) r = { ...r, bytes: extra.bytes, after: extra.after }
        }
      }
      setResult(r)
      if (r.improved) download(r.bytes, `${baseName(file!.name)}-comprimido.pdf`, PDF)
      track('pdf_compress_result', { level, before_kb: Math.round(r.before / 1024), after_kb: Math.round(r.after / 1024) })
    }, 'Listo.')

  const saved = result && result.before > 0 ? Math.round((1 - result.after / result.before) * 100) : 0

  return (
    <div className="card stack">
      <PickPdf file={file} onFile={(f) => { setFile(f); setResult(null) }} />
      <div className="field">
        <span>Nivel de compresión</span>
        <Segmented
          label="Nivel de compresión"
          value={level}
          onChange={(v) => { setLevel(v); setResult(null) }}
          options={[
            { value: 'sin-perdida', label: 'Sin pérdida' },
            { value: 'media', label: 'Media' },
            { value: 'alta', label: 'Alta' },
          ]}
        />
        <small className="faint">
          {level === 'sin-perdida'
            ? 'Optimiza la estructura del archivo sin tocar la calidad. El texto sigue siendo seleccionable.'
            : 'Vuelve a dibujar cada página como imagen: reduce mucho el peso de PDF escaneados o con fotos, pero el texto deja de ser seleccionable.'}
        </small>
      </div>
      {busy && level !== 'sin-perdida' && progress > 0 && <Progress value={progress} />}
      {error && <Notice kind="error">{error}</Notice>}
      {result &&
        (result.improved ? (
          <Notice kind="success">
            {formatBytes(result.before)} → <b>{formatBytes(result.after)}</b> ({saved}% menos). El archivo se descargó.
          </Notice>
        ) : (
          <Notice kind="info">
            Este PDF ya estaba optimizado: no se pudo reducir más{level === 'sin-perdida' ? '. Prueba con el nivel "Media" o "Alta".' : '.'}
          </Notice>
        ))}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file} onClick={go} icon="compress">
          Comprimir PDF
        </BusyButton>
      </div>
    </div>
  )
}

// ── Proteger ──────────────────────────────────────────────────────────
function PasswordInput({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <label className="field">
      <span>{label}</span>
      <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
        <input className="input" type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="icon-btn" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow((s) => !s)}>
          <Icon name={show ? 'eyeOff' : 'eye'} />
        </button>
      </div>
    </label>
  )
}

export function ProtectTool() {
  const [file, setFile] = useState<File | null>(null)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [allowPrint, setAllowPrint] = useState(true)
  const [allowCopy, setAllowCopy] = useState(true)
  const [allowModify, setAllowModify] = useState(true)
  const { busy, error, run } = useJob('protect')
  const mismatch = pw2.length > 0 && pw !== pw2
  const tooShort = pw.length > 0 && pw.length < 4

  const go = () =>
    run(async () => {
      const bytes = new Uint8Array(await file!.arrayBuffer())
      if (await isEncrypted(bytes)) throw new Error('Este PDF ya tiene contraseña. Quítala primero con "Desbloquear PDF".')
      const out = await protect(bytes, { userPassword: pw, allowPrint, allowCopy, allowModify })
      download(out, `${baseName(file!.name)}-protegido.pdf`, PDF)
      setPw('')
      setPw2('')
    })

  return (
    <div className="card stack">
      <PickPdf file={file} onFile={setFile} />
      <PasswordInput label="Contraseña para abrir el PDF" value={pw} onChange={setPw} autoComplete="new-password" />
      <PasswordInput label="Repite la contraseña" value={pw2} onChange={setPw2} autoComplete="new-password" />
      {tooShort && <small style={{ color: 'var(--danger)' }}>Usa al menos 4 caracteres.</small>}
      {mismatch && <small style={{ color: 'var(--danger)' }}>Las contraseñas no coinciden.</small>}
      <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
        <legend className="faint" style={{ marginBottom: 6 }}>Permisos de quien abra el PDF</legend>
        {[
          ['Imprimir', allowPrint, setAllowPrint],
          ['Copiar texto e imágenes', allowCopy, setAllowCopy],
          ['Modificar el documento', allowModify, setAllowModify],
        ].map(([label, value, set]) => (
          <label key={label as string} className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={value as boolean} onChange={(e) => (set as (v: boolean) => void)(e.target.checked)} />
            {label as string}
          </label>
        ))}
      </fieldset>
      <Notice kind="info">Cifrado AES-256. Guarda bien la contraseña: si la olvidas, nadie puede recuperar el PDF.</Notice>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file || pw.length < 4 || pw !== pw2} onClick={go} icon="lock">
          Proteger PDF
        </BusyButton>
      </div>
    </div>
  )
}

// ── Desbloquear ───────────────────────────────────────────────────────
export function UnlockTool() {
  const [file, setFile] = useState<File | null>(null)
  const [encrypted, setEncrypted] = useState<boolean | null>(null)
  const [pw, setPw] = useState('')
  const { busy, error, setError, run } = useJob('unlock')

  const pick = async (f: File | null) => {
    setFile(f)
    setEncrypted(null)
    setError(null)
    setPw('')
    if (!f) return
    try {
      setEncrypted(await isEncrypted(new Uint8Array(await f.arrayBuffer())))
    } catch {
      setError('El archivo no parece un PDF válido.')
    }
  }

  const go = () =>
    run(async () => {
      const out = await unlock(new Uint8Array(await file!.arrayBuffer()), pw)
      download(out, `${baseName(file!.name)}-desbloqueado.pdf`, PDF)
      setPw('')
    })

  return (
    <div className="card stack">
      <PickPdf file={file} onFile={pick} />
      {encrypted === false && <Notice kind="info">Este PDF no tiene contraseña ni restricciones: no hace falta desbloquearlo.</Notice>}
      {encrypted && (
        <>
          <PasswordInput label="Contraseña del PDF" value={pw} onChange={setPw} autoComplete="current-password" />
          <small className="faint">Si el PDF abre sin contraseña pero no deja imprimir o copiar, déjala vacía.</small>
        </>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file || !encrypted} onClick={go} icon="unlock">
          Desbloquear PDF
        </BusyButton>
      </div>
    </div>
  )
}

// ── Reparar ───────────────────────────────────────────────────────────
export function RepairTool() {
  const [file, setFile] = useState<File | null>(null)
  const [done, setDone] = useState<null | boolean>(null)
  const { busy, error, run } = useJob('repair')

  const go = () =>
    run(async () => {
      setDone(null)
      const r = await repair(new Uint8Array(await file!.arrayBuffer()))
      download(r.bytes, `${baseName(file!.name)}-reparado.pdf`, PDF)
      setDone(r.hadProblems)
    })

  return (
    <div className="card stack">
      <PickPdf file={file} onFile={(f) => { setFile(f); setDone(null) }} />
      {error && <Notice kind="error">{error}</Notice>}
      {done === true && <Notice kind="success">Se encontraron y corrigieron problemas en la estructura del PDF. El archivo reparado se descargó.</Notice>}
      {done === false && <Notice kind="info">No se encontraron problemas; igual se descargó una copia reescrita del PDF.</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file} onClick={go} icon="wrench">
          Reparar PDF
        </BusyButton>
      </div>
    </div>
  )
}
