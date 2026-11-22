// Comparar PDF: qué cambió entre dos versiones de un documento.
import { useMemo, useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, errorMessage } from '../../../shared/ui/ui'
import { baseName } from '../../../shared/files/files'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import { tr } from '../../../shared/i18n/translate'
import { compareTexts, reportText, type Comparison, type CompareOptions, type Line } from '../core/pdfCompare'
import { track } from '../../../shared/platform/analytics'

type Result = Comparison & { nameA: string; nameB: string; pagesA: number; pagesB: number }
/** El texto leído de los dos PDF: se vuelve a comparar al cambiar las opciones, sin leerlos otra vez. */
type Sources = { a: Line[]; b: Line[]; nameA: string; nameB: string; pagesA: number; pagesB: number }

/** Cuántos cambios se muestran de entrada; el resto, con "Ver más". */
const PAGE_SIZE = 30

export function CompareTool() {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<Sources | null>(null)
  const [options, setOptions] = useState<CompareOptions>({ ignoreCase: false, ignorePunctuation: false })
  const result = useMemo<Result | null>(() => (sources ? { ...compareTexts(sources.a, sources.b, 2, options), ...sources } : null), [sources, options])
  const setResult = (r: null) => setSources(r)
  const [shown, setShown] = useState(PAGE_SIZE)
  /** Lo que se guarda: el informe de cambios (si hay cambios). */
  const report = useMemo(
    () => (result && !result.identical ? resultFile(new Blob([reportText(result, result.nameA, result.nameB)], { type: 'text/plain;charset=utf-8' }), `${tr('file.comparison')}-${baseName(result.nameA)}.txt`, 'text/plain;charset=utf-8') : null),
    [result],
  )

  const pick = (set: (f: File | null) => void) => (f: File | null) => {
    set(f)
    setResult(null)
    setError(null)
  }

  const run = async () => {
    if (!fileA || !fileB) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const { pdfLines } = await import('../infra/pdfCompareSources')
      const [a, b] = await Promise.all([pdfLines(fileA), pdfLines(fileB)])
      if (!a.lines.length || !b.lines.length) {
        setError(!a.lines.length && !b.lines.length ? tr('compare.bothNoText') : tr('compare.oneNoText', { name: (!a.lines.length ? fileA : fileB).name }))
        return
      }
      setSources({ a: a.lines, b: b.lines, nameA: fileA.name, nameB: fileB.name, pagesA: a.pages, pagesB: b.pages })
      setShown(PAGE_SIZE)
      track('pdf_tool_used', { tool_name: 'compare' })
    } catch (e) {
      setError(/password/i.test(String(e)) ? tr('compare.locked') : errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_compare', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  const slot = (label: string, file: File | null, set: (f: File | null) => void) => (
    <div className="stack" style={{ gap: 8 }}>
      <b>{label}</b>
      {file ? (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => set(null)}>{tr('common.change')}</button>} />
        </ul>
      ) : (
        <DropZone accept="application/pdf" title={label === tr('compare.original') ? tr('compare.pickOriginal') : tr('compare.pickNew')} hint={tr('common.dragHere')} onFiles={([f]) => set(f)} />
      )}
    </div>
  )

  return (
    <div className="stack">
      <div className="card stack">
        <div className="compare-slots">
          {slot(tr('compare.original'), fileA, pick(setFileA))}
          {slot(tr('compare.newVersion'), fileB, pick(setFileB))}
        </div>
        <small className="faint">{tr('compare.help')}</small>
        <fieldset className="row" style={{ border: 0, padding: 0, margin: 0, gap: 16 }}>
          <legend className="sr-only">{tr('compare.options')}</legend>
          <label className="check">
            <input type="checkbox" checked={!!options.ignoreCase} onChange={(e) => setOptions((o) => ({ ...o, ignoreCase: e.target.checked }))} />
            <span>{tr('compare.ignoreCase')}</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={!!options.ignorePunctuation} onChange={(e) => setOptions((o) => ({ ...o, ignorePunctuation: e.target.checked }))} />
            <span>{tr('compare.ignorePunctuation')}</span>
          </label>
        </fieldset>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          {fileA && fileB && (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setFileA(fileB); setFileB(fileA); setResult(null) }}>
              <Icon name="convert" /> {tr('compare.swap')}
            </button>
          )}
          <BusyButton busy={busy} disabled={!fileA || !fileB} onClick={run} icon="split">
            {tr('compare.go')}
          </BusyButton>
        </div>
      </div>

      {result && fileA && fileB && (
        <div className="card">
          <BeforeAfter
            original={fileA}
            result={fileB}
            saveAs={report}
            labels={[tr('compare.original'), tr('compare.newVersion')]}
            toolName="compare"
            title={tr('compare.title')}
            summary={report ? <Notice kind="info">{tr('compare.summary')}</Notice> : undefined}
          />
        </div>
      )}

      {result && (
        <div className="card stack" aria-live="polite">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{result.tooDifferent ? tr('compare.tooDifferent') : result.identical ? tr('compare.identical') : result.hunks.length === 1 ? tr('compare.oneChange') : tr('compare.changes', { n: result.hunks.length })}</h3>
          </div>
          {result.tooDifferent ? (
            <p className="muted">{tr('compare.tooDifferentText')}</p>
          ) : result.identical ? (
            <Notice kind="success">
              {result.pagesA !== result.pagesB ? tr('compare.sameDiffPages', { a: result.pagesA, b: result.pagesB }) : tr('compare.same')}
            </Notice>
          ) : (
            <>
              <div className="row compare-legend">
                <span><ins className="diff-ins">+{result.added}</ins> {tr('compare.added')}</span>
                <span><del className="diff-del">−{result.removed}</del> {tr('compare.removed')}</span>
                {!!result.moved && <span><span className="diff-moved">↕ {result.moved}</span> {tr('compare.movedBlocks')}</span>}
              </div>
              <ol className="compare-hunks">
                {result.hunks.slice(0, shown).map((h, i) => (
                  <li key={i} className={'compare-hunk' + (h.moved ? ' is-moved' : '')}>
                    <div className="compare-hunk-head">
                      {tr('compare.changeN', { n: i + 1 })} · {h.pageA === h.pageB ? tr('compare.page', { n: h.pageA }) : tr('compare.pages', { a: h.pageA, b: h.pageB })}
                      {h.moved && <> · <span className="diff-moved">{tr(h.moved === 'from' ? 'compare.movedFrom' : 'compare.movedTo')}</span></>}
                    </div>
                    {h.before.map((t, j) => <p key={'b' + j} className="compare-ctx">{t}</p>)}
                    <p className="compare-change">
                      {h.segments.map((s, j) => {
                        const sep = j ? ' ' : ''
                        if (h.moved) return <span key={j} className="diff-moved-text">{sep + s.text}</span>
                        if (s.type === 'del') return <span key={j}>{sep}<del className="diff-del">{s.text}</del></span>
                        if (s.type === 'ins') return <span key={j}>{sep}<ins className="diff-ins">{s.text}</ins></span>
                        return <span key={j}>{sep + s.text}</span>
                      })}
                    </p>
                    {h.after.map((t, j) => <p key={'a' + j} className="compare-ctx">{t}</p>)}
                  </li>
                ))}
              </ol>
              {result.hunks.length > shown && (
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                    {tr('compare.more', { n: result.hunks.length - shown })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
