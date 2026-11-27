// Comprimir, proteger, desbloquear y reparar PDF (qpdf + pdf-lib + pdf.js, todo en el navegador).
import { useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented } from '../../../shared/ui/ui'
import { baseName, formatBytes } from '../../../shared/files/files'
import { MAX_PASSWORD_BYTES, QpdfError, WrongPasswordError, changeProtection, compressLossless, isEncrypted, passwordTooLong, protect, repair, unlock, type CompressResult } from '../core/pdfSecurity'
import { pdfLock, withoutRestrictions, type PdfLock } from '../core/openPdf'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { useAssistantOptions } from '../../../shared/files/toolOptions'
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
function PickPdf({ file, onFile, check = true }: { file: File | null; onFile: (f: File | null) => void; check?: boolean }) {
  if (!file) {
    return <DropZone accept={PDF} check={check} title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => onFile(f)} />
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
type Level = 'sin-perdida' | 'recomendada' | 'media' | 'alta'
/** Nombre de cada nivel (también el "fuerte" de solo fotos, que se usa al comprimir a un tamaño). */
const LEVEL_LABEL: Record<Level | 'fuerte', MessageKey> = { 'sin-perdida': 'compress.lossless', recomendada: 'compress.recommended', fuerte: 'compress.strongImages', media: 'compress.medium', alta: 'compress.high' }

/** Resultado de un PDF dentro de un lote. */
type BatchRow = { name: string; before: number; after: number; improved: boolean; error?: string }

export function CompressTool() {
  const [files, setFiles] = useState<File[]>([])
  // "Recomendada" conserva el texto y comprime las fotos: el punto de partida, como en iLovePDF (W-146.5).
  const [level, setLevel] = useState<Level>('recomendada')
  /** Tamaño máximo en MB ("" = sin límite): se prueban los niveles hasta que entre. */
  const [maxMb, setMaxMb] = useState('')
  const [gray, setGray] = useState(false)
  /** Con tamaño máximo: el nivel con el que entró (o el más liviano si no entró). */
  const [reached, setReached] = useState<{ level: Level | 'fuerte'; ok: boolean } | null>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<CompressResult | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  const [rows, setRows] = useState<BatchRow[] | null>(null)
  const [batchOut, setBatchOut] = useState<File[]>([])
  const [bundle, setBundle] = useState<File | null>(null)
  const { busy, error, run } = useJob('compress')
  // Desde el asistente (W-151.5): «comprime este pdf a 2 MB», «en blanco y negro».
  useAssistantOptions('comprimir-pdf', (o) => {
    if (typeof o.targetSize === 'number') setMaxMb(String(Math.round((o.targetSize / 1024 / 1024) * 100) / 100))
    if (o.grayscale === true) setGray(true)
  })
  /** Tamaños del menú, más el que pidió el asistente si no es uno de ellos (p. ej. 1,5 MB). */
  const sizes = [...new Set(['0.5', '1', '2', '5', '10', maxMb].filter(Boolean))].sort((a, b) => Number(a) - Number(b))
  const many = files.length > 1
  const file = many ? null : (files[0] ?? null)

  const reset = () => {
    setResult(null)
    setOutput(null)
    setRows(null)
    setBatchOut([])
    setBundle(null)
    setReached(null)
  }

  /** Un nivel: sin pérdida, solo las fotos (recomendada o fuerte) o cada página como imagen (media, alta). */
  const runLevel = async (bytes: Uint8Array, lv: Level | 'fuerte', onProgress: (done: number) => void): Promise<CompressResult> => {
    if (lv === 'sin-perdida') return compressLossless(bytes)
    let r: CompressResult
    if (lv === 'recomendada' || lv === 'fuerte') {
      const [{ compressImages, IMAGE_LEVELS }, { encodeImage }] = await Promise.all([import('../core/pdfImageCompress'), import('../infra/imageEncode')])
      r = await compressImages(bytes, { ...IMAGE_LEVELS[lv], gray }, encodeImage, (d, t) => onProgress(t ? d / t : 1))
    } else {
      const { compressStrong } = await import('../infra/pdfCompress')
      r = await compressStrong(bytes, lv, (d, t) => onProgress(d / t), gray)
    }
    // Encima también se aplica la optimización sin pérdida.
    const extra = await compressLossless(r.bytes)
    if (extra.improved) r = { ...r, bytes: extra.bytes, after: extra.after, improved: extra.after < r.before }
    return r
  }

  /** Comprime un PDF según el nivel elegido o, con tamaño máximo, con el primer nivel que entre. */
  const compressOne = async (f: File, onProgress: (done: number) => void): Promise<CompressResult> => {
    const raw = new Uint8Array(await f.arrayBuffer())
    // Con solo restricciones (se abre sin contraseña) se comprime igual; con contraseña, se avisa.
    const bytes = (await isEncrypted(raw)) ? await withoutRestrictions(raw) : raw
    const max = Number(maxMb)
    if (!max) return runLevel(bytes, level, onProgress)
    const { compressToSize, megabytes } = await import('../core/pdfImageCompress')
    const ladder: Array<Level | 'fuerte'> = ['sin-perdida', 'recomendada', 'fuerte', 'media', 'alta']
    const r = await compressToSize(ladder.map((lv) => ({ level: lv, run: () => runLevel(bytes, lv, onProgress) })), megabytes(max))
    setReached({ level: r.level, ok: r.reached })
    return r.result
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
              <Notice kind={reached && !reached.ok ? 'error' : 'success'}>
                {formatBytes(result.before)} → <b>{formatBytes(result.after)}</b> ({tr('common.lessPct', { n: saved })}).{' '}
                {reached ? tr(reached.ok ? 'compress.targetOk' : 'compress.targetMiss', { mb: maxMb, level: tr(LEVEL_LABEL[reached.level]) }) : tr('compress.summary')}
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
      <label className="field" style={{ maxWidth: 280 }}>
        <span>{tr('compress.maxSize')}</span>
        <select className="input" value={maxMb} onChange={(e) => { setMaxMb(e.target.value); reset() }}>
          <option value="">{tr('compress.noLimit')}</option>
          {sizes.map((mb) => <option key={mb} value={mb}>{tr('compress.underMb', { mb: mb.replace('.', ',') })}</option>)}
        </select>
        <small className="faint">{tr('compress.maxSizeHint')}</small>
      </label>
      {!maxMb && (
        <div className="field">
          <span>{tr('compress.level')}</span>
          <Segmented
            label={tr('compress.level')}
            value={level}
            onChange={(v) => { setLevel(v); reset() }}
            options={[
              { value: 'sin-perdida', label: tr('compress.lossless') },
              { value: 'recomendada', label: tr('compress.recommended') },
              { value: 'media', label: tr('compress.medium') },
              { value: 'alta', label: tr('compress.high') },
            ]}
          />
          <small className="faint">
            {level === 'sin-perdida' ? tr('compress.losslessHint') : level === 'recomendada' ? tr('compress.recommendedHint') : tr('compress.strongHint')}
          </small>
        </div>
      )}
      <label className="check">
        <input type="checkbox" checked={gray} onChange={(e) => { setGray(e.target.checked); reset() }} disabled={!maxMb && level === 'sin-perdida'} />
        <span>{tr('compress.gray')}</span>
      </label>
      {busy && (many || maxMb || level !== 'sin-perdida') && progress > 0 && <Progress value={progress} />}
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
  const [lock, setLock] = useState<PdfLock>('none')
  const encrypted = lock !== 'none'
  // Solo con contraseña de apertura hace falta escribir la actual (con solo restricciones, no).
  const needsCurrent = lock === 'password'
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
    !!file && (!needsCurrent || current.length > 0) && (mode === 'restrict' ? restricted : pw.length >= 4 && pw === pw2 && !tooLong)

  const pick = async (f: File | null) => {
    setFile(f)
    setOutput(null)
    setLock('none')
    setCurrent('')
    setError(null)
    if (!f) return
    try {
      setLock(await pdfLock(new Uint8Array(await f.arrayBuffer())))
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
      {needsCurrent && (
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
  const [lock, setLock] = useState<PdfLock | null>(null)
  const [pw, setPw] = useState('')
  const { busy, error, setError, run } = useJob('unlock')
  const [output, setOutput] = useState<{ file: File; password: string } | null>(null)

  const pick = async (f: File | null) => {
    setFile(f)
    setLock(null)
    setError(null)
    setPw('')
    setOutput(null)
    if (!f) return
    try {
      setLock(await pdfLock(new Uint8Array(await f.arrayBuffer())))
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
      {lock === 'none' && <Notice kind="info">{tr('unlock.notLocked')}</Notice>}
      {lock === 'restrictions' && <Notice kind="info">{tr('unlock.restrictionsOnly')}</Notice>}
      {lock === 'password' && (
        <>
          <PasswordInput label={tr('unlock.pw')} value={pw} onChange={setPw} autoComplete="current-password" />
          <small className="faint">{tr('unlock.hint')}</small>
        </>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file || !lock || lock === 'none'} onClick={go} icon="unlock">
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
  /** Si el archivo estaba cortado: cuántas páginas se rescataron (W-147.9). */
  const [rescued, setRescued] = useState<{ pages: number; expected: number | null } | null>(null)
  const { busy, error, run } = useJob('repair')

  const go = () =>
    run(async () => {
      setDone(null)
      setRescued(null)
      const r = await repair(new Uint8Array(await file!.arrayBuffer()))
      setRescued(r.rescued ?? null)
      setOutput(resultFile(r.bytes, `${baseName(file!.name)}-${tr('file.repaired')}.pdf`, PDF))
      setDone(r.hadProblems)
    }, tr('common.doneReview'))

  return (
    <div className="card stack">
      {/* Reparar recibe justamente PDF dañados: no se rechazan al elegirlos. */}
      <PickPdf check={false} file={file} onFile={(f) => { setFile(f); setDone(null); setOutput(null); setRescued(null) }} />
      {file && (
        <BeforeAfter
          original={file}
          result={output}
          toolName="repair"
          title={tr('repair.title')}
          previewTitle={tr('common.previewPdf')}
          placeholder={busy ? tr('repair.busy') : tr('repair.placeholder')}
          summary={
            rescued ? (
              <Notice kind={rescued.expected !== null && rescued.pages < rescued.expected ? 'info' : 'success'}>
                {rescued.expected !== null && rescued.expected > rescued.pages ? tr('repair.rescuedOf', { n: rescued.pages, total: rescued.expected }) : tr('repair.rescued', { n: rescued.pages })}
              </Notice>
            ) : done ? (
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
