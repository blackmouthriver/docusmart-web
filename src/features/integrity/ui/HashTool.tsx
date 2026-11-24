// Hash e integridad de archivos (W-105): calcular, verificar contra un hash pegado y
// comparar dos archivos. Todo se calcula en el navegador; nada se sube. W-147.9: archivos de
// varios GB por partes (con avance) y verificar una lista SHA256SUMS completa.
import { useEffect, useRef, useState } from 'react'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { go, useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, HeroCard, Notice, Progress, Segmented } from '../../../shared/ui/ui'
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
  matchChecksumFiles,
  parseChecksumList,
  STREAM_FROM,
  type ChecksumEntry,
  type HashAlgorithm,
  type HashResult,
} from '../core/hash'

type Mode = 'calcular' | 'verificar' | 'comparar' | 'lista'
const MODES: readonly Mode[] = ['calcular', 'verificar', 'comparar', 'lista']

/** Avance de varios archivos juntos: lo leído sobre el total (0 a 1). */
function useProgress() {
  const [value, setValue] = useState<number | null>(null)
  return {
    value,
    start: () => setValue(0),
    stop: () => setValue(null),
    /** Para el archivo que empieza en `offset` bytes del total `total`. */
    track: (offset: number, total: number) => (done: number) => setValue(total ? (offset + done) / total : 1),
  }
}

/** La barra solo se muestra si hay archivos grandes (los chicos terminan al instante). */
function BigProgress({ value, total }: { value: number | null; total: number }) {
  if (value === null || total <= STREAM_FROM) return null
  return (
    <div className="stack" style={{ gap: 4 }}>
      <Progress value={value} />
      <small className="faint">{tr('hash.progress', { pct: Math.floor(value * 100) })}</small>
    </div>
  )
}

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
          { value: 'lista', label: tr('hash.list') },
        ]}
      />
      {mode === 'calcular' && <CalculateHash />}
      {mode === 'verificar' && <VerifyHash />}
      {mode === 'comparar' && <CompareFiles />}
      {mode === 'lista' && <VerifyList />}
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
  const progress = useProgress()

  const run = async () => {
    setBusy(true)
    setError(null)
    progress.start()
    try {
      const out: HashResult[] = []
      let offset = 0
      for (const f of files) {
        out.push({ name: f.name, size: f.size, hash: await hashFile(f, algorithm, progress.track(offset, total)) })
        offset += f.size
      }
      setResults(out)
      track('hash_calculated', { algorithm, files: files.length })
    } catch (e) {
      setError(failed(e, 'hash_calculate'))
    } finally {
      setBusy(false)
      progress.stop()
    }
  }

  const copy = (text: string, msg: string) => void navigator.clipboard.writeText(text).then(() => toast(msg))

  const certificate = async () => {
    if (!results) return
    const { integrityCertificate } = await import('../core/certificate')
    const labels = {
      title: tr('hash.cert.title'),
      intro: tr('hash.cert.intro'),
      date: tr('hash.cert.date'),
      algorithm: tr('hash.algorithm'),
      file: tr('hash.cert.file'),
      size: tr('hash.cert.size'),
      footer: tr('hash.cert.footer'),
    }
    // Las fuentes incrustadas muestran cualquier idioma: textos y fecha en el idioma del usuario.
    const dateText = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeStyle: 'short' }).format(new Date())
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
      {total > STREAM_FROM && <Notice kind="info">{tr('hash.big', { size: formatBytes(total) })}</Notice>}
      <AlgorithmPicker value={algorithm} onChange={setAlgorithm} />
      <BigProgress value={progress.value} total={total} />
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
  const progress = useProgress()

  const run = async () => {
    if (!file || !algorithm) return
    setBusy(true)
    setError(null)
    progress.start()
    try {
      const hash = await hashFile(file, algorithm, progress.track(0, file.size))
      const ok = hashesMatch(hash, expected)
      setResult({ ok, hash, algorithm })
      track('hash_verified', { algorithm, match: ok })
    } catch (e) {
      setError(failed(e, 'hash_verify'))
    } finally {
      setBusy(false)
      progress.stop()
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
      <BigProgress value={progress.value} total={file?.size ?? 0} />
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
  const progress = useProgress()
  const total = (a?.size ?? 0) + (b?.size ?? 0)

  const run = async () => {
    if (!a || !b) return
    setBusy(true)
    setError(null)
    progress.start()
    try {
      // Uno después del otro: con archivos grandes, la memoria y el avance se entienden mejor.
      const ha = await hashFile(a, 'SHA-256', progress.track(0, total))
      const hb = await hashFile(b, 'SHA-256', progress.track(a.size, total))
      setResult({ same: ha === hb, ha, hb })
      track('hash_compared', { match: ha === hb })
    } catch (e) {
      setError(failed(e, 'hash_compare'))
    } finally {
      setBusy(false)
      progress.stop()
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
      <BigProgress value={progress.value} total={total} />
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

// ── Verificar una lista (SHA256SUMS, MD5SUMS…) — W-147.9 ─────────────
type ListResult = { entry: ChecksumEntry; file: File | null; status: 'ok' | 'bad' | 'missing'; hash?: string }

function VerifyList() {
  const [listText, setListText] = useState('')
  const [listName, setListName] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<{ rows: ListResult[]; extra: File[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listInput = useRef<HTMLInputElement>(null)
  const progress = useProgress()
  useEffect(() => setResults(null), [listText, files])
  const parsed = parseChecksumList(listText)
  const matched = matchChecksumFiles(parsed.entries, files.map((f) => f.name))
  const total = matched.pairs.reduce((n, p) => n + (p.file !== null ? files[p.file].size : 0), 0)

  const loadList = async (f: File | undefined) => {
    if (!f) return
    setListName(f.name)
    setListText(await f.text())
  }

  const run = async () => {
    setBusy(true)
    setError(null)
    progress.start()
    try {
      const rows: ListResult[] = []
      let offset = 0
      for (const { entry, file } of matched.pairs) {
        if (file === null) {
          rows.push({ entry, file: null, status: 'missing' })
          continue
        }
        const f = files[file]
        const hash = await hashFile(f, entry.algorithm, progress.track(offset, total))
        offset += f.size
        rows.push({ entry, file: f, status: hash === entry.hash ? 'ok' : 'bad', hash })
      }
      setResults({ rows, extra: matched.extra.map((i) => files[i]) })
      track('hash_list_verified', { entries: rows.length, ok: rows.filter((r) => r.status === 'ok').length })
    } catch (e) {
      setError(failed(e, 'hash_list'))
    } finally {
      setBusy(false)
      progress.stop()
    }
  }

  const ok = results?.rows.filter((r) => r.status === 'ok').length ?? 0
  const bad = results?.rows.filter((r) => r.status === 'bad').length ?? 0
  const missing = results?.rows.filter((r) => r.status === 'missing').length ?? 0

  return (
    <div className="card stack">
      <small className="faint">{tr('hash.listHelp')}</small>
      <label className="field">
        <span>{tr('hash.listLabel')}</span>
        <textarea className="input hash-input" rows={4} value={listText} spellCheck={false} autoComplete="off" placeholder={'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  archivo.zip'} onChange={(e) => { setListText(e.target.value); setListName(null) }} />
      </label>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-soft btn-sm" onClick={() => listInput.current?.click()}><Icon name="upload" /> {tr('hash.listLoad')}</button>
        <input ref={listInput} type="file" accept=".sha256,.sha1,.sha512,.md5,.txt,.sum,.sums,text/plain" hidden onChange={(e) => { void loadList(e.target.files?.[0]); e.target.value = '' }} />
        {listText.trim() && (
          <small className="faint">
            {listName ? `${listName} · ` : ''}
            {tr('hash.listEntries', { n: parsed.entries.length })}
            {parsed.invalid ? ` · ${tr('hash.listInvalid', { n: parsed.invalid })}` : ''}
          </small>
        )}
      </div>
      <DropZone accept="*/*" multiple title={tr('hash.listFiles')} hint={tr('hash.pickHint')} onFiles={(f) => setFiles((prev) => [...prev, ...f])} />
      {files.length > 0 && (
        <small className="faint">{tr('hash.listMatched', { n: matched.pairs.filter((p) => p.file !== null).length, total: parsed.entries.length })}</small>
      )}
      <BigProgress value={progress.value} total={total} />
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        {files.length > 0 && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setFiles([])}>{tr('hash.listClear')}</button>}
        <BusyButton busy={busy} disabled={!parsed.entries.length || !files.length} onClick={run} icon="check">
          {tr('hash.listRun')}
        </BusyButton>
      </div>
      {results && (
        <div className="stack" style={{ gap: 10 }} aria-live="polite">
          <Notice kind={bad || missing ? 'error' : 'success'}>
            <b>{bad || missing ? tr('hash.listSomeBad', { ok, total: results.rows.length }) : tr('hash.listAllOk', { n: ok })}</b>
          </Notice>
          <ul className="file-list hash-list" style={{ marginTop: 0 }}>
            {results.rows.map((r, i) => (
              <li key={i} className={'file-item hash-item is-' + r.status}>
                <span className={'ico ' + (r.status === 'ok' ? 'ico-green' : r.status === 'bad' ? 'ico-red' : 'ico-amber')}><Icon name={r.status === 'ok' ? 'check' : 'alert'} /></span>
                <div className="file-meta">
                  <b title={r.entry.name}>{r.entry.name}</b>
                  <small>{r.entry.algorithm} · {tr(`hash.listStatus.${r.status}` as MessageKey)}</small>
                  {r.status === 'bad' && r.hash && <HashValue value={r.hash} />}
                </div>
              </li>
            ))}
          </ul>
          {results.extra.length > 0 && <Notice kind="plain">{tr('hash.listExtra', { list: results.extra.map((f) => f.name).join(', ') })}</Notice>}
        </div>
      )}
    </div>
  )
}
