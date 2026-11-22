// Comprimir, proteger, desbloquear y reparar PDF (qpdf + pdf-lib + pdf.js, todo en el navegador).
import { useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented } from '../../../shared/ui/ui'
import { baseName, formatBytes } from '../../../shared/files/files'
import { MAX_PASSWORD_BYTES, QpdfError, WrongPasswordError, changeProtection, compressLossless, isEncrypted, passwordTooLong, protect, repair, unlock, type CompressResult } from '../core/pdfSecurity'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { bundleFiles, resultFile } from '../../../shared/files/share'

const PDF = 'application/pdf'

function friendly(e: unknown): string {
  if (e instanceof WrongPasswordError) return tr('sec.wrongKey')
  const msg = e instanceof Error ? e.message : ''
  if (/encrypt|password/i.test(msg)) return tr('err.lockedPdf')
  if (e instanceof QpdfError) return e.message
  return tr('sec.invalidPdfCheck')
}

/** Selector de un PDF con la fila del archivo elegido y botón para cambiarlo. */
function PickPdf({ file, onFile }: { file: File | null; onFile: (f: File | null) => void }) {
  if (!file) {
    return <DropZone accept={PDF} title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => onFile(f)} />
  }
  return (
    <ul className="file-list" style={{ marginTop: 0 }}>
      <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => onFile(null)}>{tr('common.change')}</button>} />
    </ul>
  )
}

function useJob(toolName: string) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<void>, okMsg = tr('pdf.downloadedToast')) => {
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

/** Resultado de un PDF dentro de un lote. */
type BatchRow = { name: string; before: number; after: number; improved: boolean; error?: string }

export function CompressTool() {
  const [files, setFiles] = useState<File[]>([])
  const [level, setLevel] = useState<Level>('sin-perdida')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<CompressResult | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  const [rows, setRows] = useState<BatchRow[] | null>(null)
  const [batchOut, setBatchOut] = useState<File[]>([])
  const [bundle, setBundle] = useState<File | null>(null)
  const { busy, error, run } = useJob('compress')
  const many = files.length > 1
  const file = many ? null : (files[0] ?? null)

  const reset = () => {
    setResult(null)
    setOutput(null)
    setRows(null)
    setBatchOut([])
    setBundle(null)
  }

  /** Comprime un PDF según el nivel elegido. */
  const compressOne = async (f: File, onProgress: (done: number) => void): Promise<CompressResult> => {
    const bytes = new Uint8Array(await f.arrayBuffer())
    if (await isEncrypted(bytes)) throw new Error(tr('err.lockedPdf'))
    if (level === 'sin-perdida') return compressLossless(bytes)
    const { compressStrong } = await import('../infra/pdfCompress')
    let r = await compressStrong(bytes, level, (d, t) => onProgress(d / t))
    // Sobre el resultado fuerte también se aplica la optimización sin pérdida.
    if (r.improved) {
      const extra = await compressLossless(r.bytes)
      if (extra.improved) r = { ...r, bytes: extra.bytes, after: extra.after }
    }
    return r
  }

  const go = () =>
    run(async () => {
      reset()
      setProgress(0)
      const r = await compressOne(file!, setProgress)
      setResult(r)
      // Ya no se descarga solo: primero se ve el resultado y luego se elige cómo guardarlo.
      if (r.improved) setOutput(resultFile(r.bytes, `${baseName(file!.name)}-${tr('file.compressed')}.pdf`, PDF))
      track('pdf_compress_result', { level, before_kb: Math.round(r.before / 1024), after_kb: Math.round(r.after / 1024) })
    }, tr('common.doneReview'))

  /** Varios PDF (W-111): uno tras otro; si uno falla (p. ej. está protegido) los demás siguen. El ZIP lleva los comprimidos y, de los que ya estaban optimizados, el original. */
  const goMany = () =>
    run(async () => {
      reset()
      setProgress(0)
      const done: BatchRow[] = []
      const outs: File[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        try {
          const r = await compressOne(f, (p) => setProgress((i + p) / files.length))
          done.push({ name: f.name, before: r.before, after: r.after, improved: r.improved })
          outs.push(r.improved ? resultFile(r.bytes, `${baseName(f.name)}-${tr('file.compressed')}.pdf`, PDF) : f)
        } catch (e) {
          done.push({ name: f.name, before: f.size, after: f.size, improved: false, error: friendly(e) })
        }
        setProgress((i + 1) / files.length)
      }
      setRows(done)
      setBatchOut(outs)
      setBundle(await bundleFiles(outs, `${tr('file.zipCompressedPdfs')}.zip`))
      track('pdf_compress_batch', { files: files.length, ok: outs.length, level })
    }, tr('common.doneReview'))

  const saved = result && result.before > 0 ? Math.round((1 - result.after / result.before) * 100) : 0
  const okRows = (rows ?? []).filter((r) => !r.error)
  const totalBefore = okRows.reduce((n, r) => n + r.before, 0)
  const totalAfter = okRows.reduce((n, r) => n + r.after, 0)
  const batchSaved = totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0

  return (
    <div className="card stack">
      {files.length === 0 ? (
        <DropZone accept={PDF} multiple title={tr('compress.pickMany')} hint={tr('common.dragHere')} onFiles={(f) => { setFiles(f); reset() }} />
      ) : (
        <ul className="file-list" style={{ marginTop: 0 }}>
          {files.map((f, i) => (
            <FileRow
              key={f.name + i}
              file={f}
              actions={
                many ? (
                  <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} disabled={busy} onClick={() => { setFiles((prev) => prev.filter((_, j) => j !== i)); reset() }}>
                    <Icon name="close" />
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setFiles([]); reset() }}>
                    {tr('common.change')}
                  </button>
                )
              }
            />
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <div className="row">
          <label className="btn btn-soft btn-sm" style={{ cursor: busy ? 'default' : 'pointer' }}>
            <Icon name="plus" /> {tr('compress.addMore')}
            <input type="file" accept={PDF} multiple hidden disabled={busy} onChange={(e) => { setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]); reset(); e.target.value = '' }} />
          </label>
        </div>
      )}
      {file && (
        <BeforeAfter
          original={file}
          result={output}
          toolName="compress"
          title={tr('compress.title')}
          previewTitle={tr('common.previewPdf')}
          placeholder={busy ? tr('compress.busy') : tr('compress.placeholder')}
          summary={
            result && (
              <Notice kind="success">
                {formatBytes(result.before)} → <b>{formatBytes(result.after)}</b> ({tr('common.lessPct', { n: saved })}). {tr('compress.summary')}
              </Notice>
            )
          }
        />
      )}
      {many && rows && (
        <BeforeAfter
          originals={files}
          result={null}
          results={batchOut}
          saveAs={bundle}
          toolName="compress"
          title={tr('compress.title')}
          previewTitle={tr('common.previewPdf')}
          summary={
            okRows.length > 1 ? (
              <Notice kind="success">
                {tr('compress.batchSummary', { n: okRows.length, before: formatBytes(totalBefore), after: formatBytes(totalAfter), pct: batchSaved })}
              </Notice>
            ) : okRows.length === 1 ? (
              <Notice kind="success">
                {formatBytes(totalBefore)} → <b>{formatBytes(totalAfter)}</b> ({tr('common.lessPct', { n: batchSaved })}). {tr('compress.summary')}
              </Notice>
            ) : undefined
          }
        />
      )}
      {many && rows && (
        <ul className="file-list" style={{ marginTop: 0 }}>
          {rows.map((r, i) => (
            <li key={r.name + i} className="file-row img-result">
              <span className="img-result-info">
                <b>{r.name}</b>
                <small className={r.error ? undefined : 'faint'} style={r.error ? { color: 'var(--danger)' } : undefined}>
                  {r.error ?? (r.improved ? `${formatBytes(r.before)} → ${formatBytes(r.after)}` : tr('compress.alreadyShort'))}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="field">
        <span>{tr('compress.level')}</span>
        <Segmented
          label={tr('compress.level')}
          value={level}
          onChange={(v) => { setLevel(v); reset() }}
          options={[
            { value: 'sin-perdida', label: tr('compress.lossless') },
            { value: 'media', label: tr('compress.medium') },
            { value: 'alta', label: tr('compress.high') },
          ]}
        />
        <small className="faint">
          {level === 'sin-perdida'
            ? tr('compress.losslessHint')
            : tr('compress.strongHint')}
        </small>
      </div>
      {busy && (many || level !== 'sin-perdida') && progress > 0 && <Progress value={progress} />}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={files.length === 0} onClick={many ? goMany : go} icon="compress">
          {many ? tr('compress.goMany', { n: files.length }) : tr('compress.go')}
        </BusyButton>
      </div>
      {result && !result.improved && (
        <Notice kind="info">
          {tr('compress.already')}{level === 'sin-perdida' ? ` ${tr('compress.tryStronger')}` : ''}
        </Notice>
      )}
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
        <button type="button" className="icon-btn" aria-label={show ? tr('protect.hide') : tr('protect.show')} onClick={() => setShow((s) => !s)}>
          <Icon name={show ? 'eyeOff' : 'eye'} />
        </button>
      </div>
    </label>
  )
}

export function ProtectTool() {
  const [file, setFile] = useState<File | null>(null)
  /** El PDF elegido ya tiene contraseña: se pide la actual para cambiarla (W-146.3). */
  const [encrypted, setEncrypted] = useState(false)
  const [current, setCurrent] = useState('')
  /** 'open': contraseña para abrir; 'restrict': abre sin contraseña, solo con restricciones. */
  const [mode, setMode] = useState<'open' | 'restrict'>('open')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [allowPrint, setAllowPrint] = useState(true)
  const [allowCopy, setAllowCopy] = useState(true)
  const [allowModify, setAllowModify] = useState(true)
  const { busy, error, setError, run } = useJob('protect')
  const [output, setOutput] = useState<{ file: File; password: string } | null>(null)
  const mismatch = pw2.length > 0 && pw !== pw2
  const tooShort = pw.length > 0 && pw.length < 4
  const tooLong = passwordTooLong(pw)
  const restricted = !allowPrint || !allowCopy || !allowModify
  const ready =
    !!file && (!encrypted || current.length > 0) && (mode === 'restrict' ? restricted : pw.length >= 4 && pw === pw2 && !tooLong)

  const pick = async (f: File | null) => {
    setFile(f)
    setOutput(null)
    setEncrypted(false)
    setCurrent('')
    setError(null)
    if (!f) return
    try {
      setEncrypted(await isEncrypted(new Uint8Array(await f.arrayBuffer())))
    } catch {
      setError(tr('err.invalidPdf'))
    }
  }

  const go = () =>
    run(async () => {
      const bytes = new Uint8Array(await file!.arrayBuffer())
      const opts = { userPassword: mode === 'open' ? pw : '', allowPrint, allowCopy, allowModify }
      const out = encrypted ? await changeProtection(bytes, current, opts) : await protect(bytes, opts)
      setOutput({ file: resultFile(out, `${baseName(file!.name)}-${tr('file.protected')}.pdf`, PDF), password: opts.userPassword })
      setPw('')
      setPw2('')
      setCurrent('')
    }, tr('common.doneReview'))

  return (
    <div className="card stack">
      <PickPdf file={file} onFile={(f) => void pick(f)} />
      {encrypted && (
        <>
          <Notice kind="info">{tr('protect.change')}</Notice>
          <PasswordInput label={tr('protect.current')} value={current} onChange={setCurrent} autoComplete="current-password" />
        </>
      )}
      <Segmented
        label={tr('protect.mode')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'open', label: tr('protect.mode.open') },
          { value: 'restrict', label: tr('protect.mode.restrict') },
        ]}
      />
      {file && (
        <BeforeAfter
          original={file}
          result={output?.file ?? null}
          resultPassword={output?.password}
          toolName="protect"
          title={tr('protect.title')}
          previewTitle={tr('common.previewPdf')}
          placeholder={busy ? tr('protect.busy') : tr('protect.placeholder')}
          summary={<Notice kind="success">{tr('protect.summary')}</Notice>}
        />
      )}
      {mode === 'open' ? (
        <>
          <PasswordInput label={tr('protect.pw')} value={pw} onChange={setPw} autoComplete="new-password" />
          <PasswordInput label={tr('protect.pw2')} value={pw2} onChange={setPw2} autoComplete="new-password" />
          {tooShort && <small style={{ color: 'var(--danger)' }}>{tr('protect.tooShort')}</small>}
          {tooLong && <small style={{ color: 'var(--danger)' }}>{tr('protect.tooLong', { n: MAX_PASSWORD_BYTES })}</small>}
          {mismatch && <small style={{ color: 'var(--danger)' }}>{tr('protect.mismatch')}</small>}
        </>
      ) : (
        <Notice kind="info">{restricted ? tr('protect.restrictHint') : tr('protect.restrictPick')}</Notice>
      )}
      <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
        <legend className="faint" style={{ marginBottom: 6 }}>{tr('protect.perms')}</legend>
        {[
          [tr('protect.print'), allowPrint, setAllowPrint],
          [tr('protect.copy'), allowCopy, setAllowCopy],
          [tr('protect.modify'), allowModify, setAllowModify],
        ].map(([label, value, set]) => (
          <label key={label as string} className="check">
            <input type="checkbox" checked={value as boolean} onChange={(e) => (set as (v: boolean) => void)(e.target.checked)} />
            {label as string}
          </label>
        ))}
      </fieldset>
      {mode === 'open' && <Notice kind="info">{tr('protect.aes')}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!ready} onClick={go} icon="lock">
          {encrypted ? tr('protect.goChange') : tr('protect.go')}
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
  const [output, setOutput] = useState<{ file: File; password: string } | null>(null)

  const pick = async (f: File | null) => {
    setFile(f)
    setEncrypted(null)
    setError(null)
    setPw('')
    setOutput(null)
    if (!f) return
    try {
      setEncrypted(await isEncrypted(new Uint8Array(await f.arrayBuffer())))
    } catch {
      setError(tr('err.invalidPdf'))
    }
  }

  const go = () =>
    run(async () => {
      const out = await unlock(new Uint8Array(await file!.arrayBuffer()), pw)
      setOutput({ file: resultFile(out, `${baseName(file!.name)}-${tr('file.unlocked')}.pdf`, PDF), password: pw })
      setPw('')
    }, tr('common.doneReview'))

  return (
    <div className="card stack">
      <PickPdf file={file} onFile={pick} />
      {encrypted === false && <Notice kind="info">{tr('unlock.notLocked')}</Notice>}
      {encrypted && (
        <>
          <PasswordInput label={tr('unlock.pw')} value={pw} onChange={setPw} autoComplete="current-password" />
          <small className="faint">{tr('unlock.hint')}</small>
        </>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file || !encrypted} onClick={go} icon="unlock">
          {tr('unlock.go')}
        </BusyButton>
      </div>
      {file && output && (
        <BeforeAfter
          original={file}
          originalPassword={output.password || undefined}
          result={output.file}
          toolName="unlock"
          title={tr('unlock.title')}
          summary={<Notice kind="success">{tr('unlock.summary')}</Notice>}
        />
      )}
    </div>
  )
}

// ── Reparar ───────────────────────────────────────────────────────────
export function RepairTool() {
  const [file, setFile] = useState<File | null>(null)
  const [done, setDone] = useState<null | boolean>(null)
  const [output, setOutput] = useState<File | null>(null)
  const { busy, error, run } = useJob('repair')

  const go = () =>
    run(async () => {
      setDone(null)
      const r = await repair(new Uint8Array(await file!.arrayBuffer()))
      setOutput(resultFile(r.bytes, `${baseName(file!.name)}-${tr('file.repaired')}.pdf`, PDF))
      setDone(r.hadProblems)
    }, tr('common.doneReview'))

  return (
    <div className="card stack">
      <PickPdf file={file} onFile={(f) => { setFile(f); setDone(null); setOutput(null) }} />
      {file && (
        <BeforeAfter
          original={file}
          result={output}
          toolName="repair"
          title={tr('repair.title')}
          previewTitle={tr('common.previewPdf')}
          placeholder={busy ? tr('repair.busy') : tr('repair.placeholder')}
          summary={
            done ? (
              <Notice kind="success">{tr('repair.fixed')}</Notice>
            ) : (
              <Notice kind="info">{tr('repair.ok')}</Notice>
            )
          }
        />
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file} onClick={go} icon="wrench">
          {tr('repair.go')}
        </BusyButton>
      </div>
    </div>
  )
}
