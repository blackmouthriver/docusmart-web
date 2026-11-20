// Hash e integridad de archivos (W-105): calcular, verificar contra un hash pegado y
// comparar dos archivos. Todo se calcula en el navegador; nada se sube.
import { useEffect, useState } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, HeroCard, Notice, Segmented } from '../../../shared/ui/ui'
import { download, formatBytes } from '../../../shared/files/files'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { useT } from '../../../shared/i18n/I18n'
import {
  ALGORITHMS,
  checksumFileName,
  checksumText,
  detectAlgorithm,
  hashFile,
  hashesMatch,
  type HashAlgorithm,
  type HashResult,
} from '../core/hash'

// Por encima de esto el navegador puede quedarse sin memoria (el archivo se lee completo).
const BIG = 700 * 1024 * 1024

type Mode = 'calcular' | 'verificar' | 'comparar'
const MODES: readonly Mode[] = ['calcular', 'verificar', 'comparar']

export function HashScreen({ sub }: { sub?: string }) {
  const mode: Mode = MODES.includes(sub as Mode) ? (sub as Mode) : 'calcular'
  return (
    <>
      <HeroCard title={tr('tools.hash')} subtitle={tr('hash.heroSub')} />
      <HashTool mode={mode} onMode={(m) => go('hash', m)} />
    </>
  )
}

/** La herramienta con su selector de modo (en la app el modo va en la dirección; en la página propia, en el estado). */
export function HashTool({ mode: fixedMode, onMode }: { mode?: Mode; onMode?: (m: Mode) => void }) {
  const [ownMode, setOwnMode] = useState<Mode>('calcular')
  const mode = fixedMode ?? ownMode
  const setMode = onMode ?? setOwnMode
  return (
    <div className="stack" style={{ gap: 14 }}>
      <Segmented
        label={tr('hash.mode')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'calcular', label: tr('hash.calc') },
          { value: 'verificar', label: tr('hash.verify') },
          { value: 'comparar', label: tr('hash.compare') },
        ]}
      />
      {mode === 'calcular' && <CalculateHash />}
      {mode === 'verificar' && <VerifyHash />}
      {mode === 'comparar' && <CompareFiles />}
    </div>
  )
}

function failed(e: unknown, context: string): string {
  track('app_error', { error_context: context, error_message: e instanceof Error ? e.name : 'error' })
  return tr('hash.failed')
}

function AlgorithmPicker({ value, onChange }: { value: HashAlgorithm; onChange: (a: HashAlgorithm) => void }) {
  return (
    <div className="field">
      <span>{tr('hash.algorithm')}</span>
      <Segmented label={tr('hash.algorithm')} value={value} onChange={onChange} options={ALGORITHMS.map((a) => ({ value: a, label: a }))} />
      {(value === 'MD5' || value === 'SHA-1') && <small className="faint">{tr('hash.weakNote')}</small>}
    </div>
  )
}

function PickedFile({ file, onChange, label }: { file: File; onChange: () => void; label?: string }) {
  return (
    <ul className="file-list" style={{ marginTop: 0 }}>
      <li className="file-item">
        <span className="ico ico-blue"><Icon name="file" /></span>
        <div className="file-meta">
          {label && <small>{label}</small>}
          <b title={file.name}>{file.name}</b>
          <small>{formatBytes(file.size)}</small>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onChange}>{tr('common.change')}</button>
      </li>
    </ul>
  )
}

function HashValue({ value }: { value: string }) {
  return <code className="hash-value">{value}</code>
}

// ── Calcular ──────────────────────────────────────────────────────────
function CalculateHash() {
  const { toast } = useApp()
  const { lang } = useT()
  const [files, setFiles] = useState<File[]>([])
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256')
  const [results, setResults] = useState<HashResult[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setResults(null), [files, algorithm])
  const total = files.reduce((n, f) => n + f.size, 0)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const out: HashResult[] = []
      for (const f of files) out.push({ name: f.name, size: f.size, hash: await hashFile(f, algorithm) })
      setResults(out)
      track('hash_calculated', { algorithm, files: files.length })
    } catch (e) {
      setError(failed(e, 'hash_calculate'))
    } finally {
      setBusy(false)
    }
  }

  const copy = (text: string, msg: string) => void navigator.clipboard.writeText(text).then(() => toast(msg))

  const certificate = async () => {
    if (!results) return
    const { integrityCertificate, printableLabels } = await import('../core/certificate')
    const labels = {
      title: tr('hash.cert.title'),
      intro: tr('hash.cert.intro'),
      date: tr('hash.cert.date'),
      algorithm: tr('hash.algorithm'),
      file: tr('hash.cert.file'),
      size: tr('hash.cert.size'),
      footer: tr('hash.cert.footer'),
    }
    // Si los textos del idioma no caben en la fuente del PDF, todo va en inglés (también la fecha).
    const dateLang = printableLabels(labels) === labels ? lang : 'en'
    const dateText = new Intl.DateTimeFormat(dateLang, { dateStyle: 'long', timeStyle: 'short' }).format(new Date())
    const pdf = await integrityCertificate({ labels, results, algorithm, dateText, formatSize: formatBytes })
    download(pdf, `${tr('hash.cert.fileName')}.pdf`, 'application/pdf')
    track('hash_certificate', { algorithm, files: results.length })
  }

  return (
    <div className="card stack">
      <DropZone accept="*/*" multiple title={tr('hash.pickFiles')} hint={tr('hash.pickHint')} onFiles={(f) => setFiles((prev) => [...prev, ...f])} />
      {files.length > 0 && (
        <ul className="file-list" style={{ maxHeight: 260, overflow: 'auto' }}>
          {files.map((f, i) => (
            <li key={f.name + i} className="file-item">
              <span className="ico ico-blue"><Icon name="file" /></span>
              <div className="file-meta">
                <b title={f.name}>{f.name}</b>
                <small>{formatBytes(f.size)}</small>
              </div>
              <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {total > BIG && <Notice kind="info">{tr('hash.big', { size: formatBytes(total) })}</Notice>}
      <AlgorithmPicker value={algorithm} onChange={setAlgorithm} />
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={files.length === 0} onClick={run} icon="fingerprint">
          {tr('hash.run')}
        </BusyButton>
      </div>
      {results && (
        <div className="stack hash-results" style={{ gap: 10 }} aria-live="polite">
          <ul className="file-list" style={{ marginTop: 0 }}>
            {results.map((r, i) => (
              <li key={r.name + i} className="file-item hash-item">
                <span className="ico ico-green"><Icon name="fingerprint" /></span>
                <div className="file-meta">
                  <b title={r.name}>{r.name}</b>
                  <small>{algorithm} · {formatBytes(r.size)}</small>
                  <HashValue value={r.hash} />
                </div>
                <button type="button" className="icon-btn" aria-label={tr('hash.copyOne', { name: r.name })} onClick={() => copy(r.hash, tr('hash.copied'))}>
                  <Icon name="copy" />
                </button>
              </li>
            ))}
          </ul>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {results.length > 1 && (
              <button type="button" className="btn btn-soft btn-sm" onClick={() => copy(checksumText(results), tr('hash.copiedAll'))}>
                <Icon name="copy" /> {tr('hash.copyAll')}
              </button>
            )}
            <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([checksumText(results)], { type: 'text/plain' }), checksumFileName(algorithm), 'text/plain')}>
              <Icon name="download" /> {tr('hash.downloadList')}
            </button>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => void certificate()}>
              <Icon name="shield" /> {tr('hash.certificate')}
            </button>
          </div>
          <small className="faint">{tr('hash.certNote')}</small>
        </div>
      )}
    </div>
  )
}

// ── Verificar contra un hash pegado ───────────────────────────────────
function VerifyHash() {
  const [file, setFile] = useState<File | null>(null)
  const [expected, setExpected] = useState('')
  const [result, setResult] = useState<{ ok: boolean; hash: string; algorithm: HashAlgorithm } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setResult(null), [file, expected])
  const algorithm = detectAlgorithm(expected)
  const invalid = expected.trim().length > 0 && !algorithm

  const run = async () => {
    if (!file || !algorithm) return
    setBusy(true)
    setError(null)
    try {
      const hash = await hashFile(file, algorithm)
      const ok = hashesMatch(hash, expected)
      setResult({ ok, hash, algorithm })
      track('hash_verified', { algorithm, match: ok })
    } catch (e) {
      setError(failed(e, 'hash_verify'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card stack">
      {file ? (
        <PickedFile file={file} onChange={() => setFile(null)} />
      ) : (
        <DropZone accept="*/*" title={tr('hash.pickOne')} hint={tr('hash.pickHint')} onFiles={([f]) => setFile(f)} />
      )}
      <label className="field">
        <span>{tr('hash.expected')}</span>
        <textarea
          className="input hash-input"
          rows={2}
          value={expected}
          spellCheck={false}
          autoComplete="off"
          aria-describedby="hash-expected-hint"
          aria-invalid={invalid || undefined}
          onChange={(e) => setExpected(e.target.value)}
        />
        <small className="faint" id="hash-expected-hint">
          {invalid ? tr('hash.invalid') : algorithm ? tr('hash.detected', { algo: algorithm }) : tr('hash.expectedHint')}
        </small>
      </label>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file || !algorithm} onClick={run} icon="check">
          {tr('hash.runVerify')}
        </BusyButton>
      </div>
      {result && (
        <div aria-live="polite">
          <Notice kind={result.ok ? 'success' : 'error'}>
            <b>{result.ok ? tr('hash.match') : tr('hash.noMatch')}</b>
            <br />
            <small>{tr('hash.computedAs', { algo: result.algorithm })}</small> <HashValue value={result.hash} />
          </Notice>
        </div>
      )}
    </div>
  )
}

// ── Comparar dos archivos ─────────────────────────────────────────────
function CompareFiles() {
  const [a, setA] = useState<File | null>(null)
  const [b, setB] = useState<File | null>(null)
  const [result, setResult] = useState<{ same: boolean; ha: string; hb: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setResult(null), [a, b])

  const run = async () => {
    if (!a || !b) return
    setBusy(true)
    setError(null)
    try {
      const [ha, hb] = await Promise.all([hashFile(a, 'SHA-256'), hashFile(b, 'SHA-256')])
      setResult({ same: ha === hb, ha, hb })
      track('hash_compared', { match: ha === hb })
    } catch (e) {
      setError(failed(e, 'hash_compare'))
    } finally {
      setBusy(false)
    }
  }

  const slot = (file: File | null, set: (f: File | null) => void, label: string) =>
    file ? <PickedFile file={file} label={label} onChange={() => set(null)} /> : <DropZone accept="*/*" title={label} hint={tr('hash.pickHint')} onFiles={([f]) => set(f)} />

  return (
    <div className="card stack">
      <div className="two-col">
        {slot(a, setA, tr('hash.fileA'))}
        {slot(b, setB, tr('hash.fileB'))}
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!a || !b} onClick={run} icon="compare">
          {tr('hash.runCompare')}
        </BusyButton>
      </div>
      {result && a && b && (
        <div aria-live="polite">
          <Notice kind={result.same ? 'success' : 'error'}>
            <b>{result.same ? tr('hash.same') : tr('hash.different')}</b>
            <br />
            <small>SHA-256 · {a.name}</small> <HashValue value={result.ha} />
            <br />
            <small>SHA-256 · {b.name}</small> <HashValue value={result.hb} />
          </Notice>
        </div>
      )}
    </div>
  )
}
