// Comparar PDF: qué cambió entre dos versiones de un documento, en el texto o en cómo se ve
// cada página (W-147.7).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented, errorMessage } from '../../../shared/ui/ui'
import { baseName } from '../../../shared/files/files'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import { tr } from '../../../shared/i18n/translate'
import { compareTexts, reportText, type Comparison, type CompareOptions, type Line } from '../core/pdfCompare'
import { track } from '../../../shared/platform/analytics'
import { visualSummary, type Box } from '../core/pdfVisualDiff'
import type { VisualResult } from '../infra/pdfVisualSources'

type Mode = 'text' | 'visual'

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
  const [mode, setMode] = useState<Mode>('text')
  /** Comparación visual: páginas, imágenes e informe en PDF. */
  const [visual, setVisual] = useState<VisualResult | null>(null)
  const [visualReport, setVisualReport] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [vPage, setVPage] = useState<number | null>(null)
  const [view, setView] = useState<'side' | 'overlay'>('side')
  // Las imágenes de la comparación visual se liberan al cambiar o salir.
  const visualRef = useRef(visual)
  useEffect(() => {
    const prev = visualRef.current
    visualRef.current = visual
    if (prev && prev !== visual) void import('../infra/pdfVisualSources').then((m) => m.revokeVisual(prev))
  }, [visual])
  useEffect(() => () => void import('../infra/pdfVisualSources').then((m) => m.revokeVisual(visualRef.current)), [])
  const clearVisual = () => {
    setVisual(null)
    setVisualReport(null)
    setVPage(null)
  }
  /** Lo que se guarda: el informe de cambios (si hay cambios). */
  const report = useMemo(
    () => (result && !result.identical ? resultFile(new Blob([reportText(result, result.nameA, result.nameB)], { type: 'text/plain;charset=utf-8' }), `${tr('file.comparison')}-${baseName(result.nameA)}.txt`, 'text/plain;charset=utf-8') : null),
    [result],
  )

  const pick = (set: (f: File | null) => void) => (f: File | null) => {
    set(f)
    setResult(null)
    clearVisual()
    setError(null)
  }

  const runVisual = async () => {
    if (!fileA || !fileB) return
    setBusy(true)
    setError(null)
    clearVisual()
    setProgress(0)
    try {
      const { visualCompare } = await import('../infra/pdfVisualSources')
      const r = await visualCompare(fileA, fileB, (done, total) => setProgress(done / total))
      setVisual(r)
      const first = r.pages.find((pg) => pg.status !== 'same')
      setVPage(first ? first.page : null)
      if (r.report.length) {
        const { visualReportPdf } = await import('../core/pdfVisualDiff')
        const pdf = await visualReportPdf(r.report, tr('compare.visualReportTitle'))
        setVisualReport(resultFile(pdf, `${tr('file.comparison')}-${baseName(fileA.name)}-visual.pdf`, 'application/pdf'))
      }
      track('pdf_tool_used', { tool_name: 'compare', format: 'visual' })
    } catch (e) {
      setError(/password/i.test(String(e)) ? tr('compare.locked') : errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_compare_visual', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const run = async () => {
    if (!fileA || !fileB) return
    if (mode === 'visual') return runVisual()
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
        <div className="field">
          <span aria-hidden="true">{tr('compare.mode')}</span>
          <Segmented
            label={tr('compare.mode')}
            value={mode}
            onChange={(m: Mode) => {
              setMode(m)
              setResult(null)
              clearVisual()
            }}
            options={[
              { value: 'text', label: tr('compare.mode.text') },
              { value: 'visual', label: tr('compare.mode.visual') },
            ]}
          />
        </div>
        <small className="faint">{mode === 'visual' ? tr('compare.visualHelp') : tr('compare.help')}</small>
        {mode === 'text' && <fieldset className="row" style={{ border: 0, padding: 0, margin: 0, gap: 16 }}>
          <legend className="sr-only">{tr('compare.options')}</legend>
          <label className="check">
            <input type="checkbox" checked={!!options.ignoreCase} onChange={(e) => setOptions((o) => ({ ...o, ignoreCase: e.target.checked }))} />
            <span>{tr('compare.ignoreCase')}</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={!!options.ignorePunctuation} onChange={(e) => setOptions((o) => ({ ...o, ignorePunctuation: e.target.checked }))} />
            <span>{tr('compare.ignorePunctuation')}</span>
          </label>
        </fieldset>}
        {progress !== null && (
          <>
            <Progress value={progress} />
            <small className="faint">{tr('compare.visualBusy')}</small>
          </>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          {fileA && fileB && (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setFileA(fileB); setFileB(fileA); setResult(null); clearVisual() }}>
              <Icon name="convert" /> {tr('compare.swap')}
            </button>
          )}
          <BusyButton busy={busy} disabled={!fileA || !fileB} onClick={run} icon="split">
            {tr('compare.go')}
          </BusyButton>
        </div>
      </div>

      {visual && fileA && fileB && <VisualView visual={visual} report={visualReport} fileA={fileA} fileB={fileB} page={vPage} setPage={setVPage} view={view} setView={setView} />}

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

/** Zonas que cambiaron, marcadas encima de la imagen de la página. */
function Marked({ src, boxes, label }: { src: string; boxes: Box[]; label: string }) {
  return (
    <figure className="visual-page">
      <figcaption>{label}</figcaption>
      <div className="visual-frame">
        <img src={src} alt={label} />
        {boxes.map((b, i) => (
          <span key={i} className="visual-box" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }} aria-hidden="true" />
        ))}
      </div>
    </figure>
  )
}

function VisualView({ visual, report, fileA, fileB, page, setPage, view, setView }: {
  visual: VisualResult
  report: File | null
  fileA: File
  fileB: File
  page: number | null
  setPage: (n: number) => void
  view: 'side' | 'overlay'
  setView: (v: 'side' | 'overlay') => void
}) {
  const sum = visualSummary(visual.pages)
  const listed = visual.pages.filter((p) => p.status !== 'same')
  const current = listed.find((p) => p.page === page) ?? null
  const img = current ? visual.images.get(current.page) : undefined
  const fmt = (n: number) => n.toLocaleString(document.documentElement.lang || undefined, { maximumFractionDigits: n < 10 ? 1 : 0 })
  const pct = (v: number) => (v < 0.001 ? '<' + fmt(0.1) : fmt(v * 100))
  return (
    <>
      <div className="card stack" aria-live="polite">
        <h3>{sum.same ? tr('compare.visualSame') : sum.changed.length === 1 ? tr('compare.visualChangedOne') : tr('compare.visualChangedN', { n: sum.changed.length })}</h3>
        {sum.same && <Notice kind="success">{tr('compare.visualSameText', { n: visual.pages.length })}</Notice>}
        {!!sum.onlyA.length && <Notice kind="plain">{tr('compare.onlyA', { list: sum.onlyA.join(', ') })}</Notice>}
        {!!sum.onlyB.length && <Notice kind="plain">{tr('compare.onlyB', { list: sum.onlyB.join(', ') })}</Notice>}
        {listed.length > 0 && (
          <div className="row visual-pages" role="group" aria-label={tr('compare.visualPages')}>
            {listed.map((p) => (
              <button key={p.page} type="button" className="btn btn-soft btn-sm" aria-pressed={p.page === page} onClick={() => setPage(p.page)}>
                {tr('compare.pageBtn', { n: p.page })}
              </button>
            ))}
          </div>
        )}
        {current && img && (
          <>
            {current.status === 'changed' && (
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <small className="faint">{current.boxes.length === 1 ? tr('compare.zoneOne', { pct: pct(current.changed) }) : tr('compare.zonesN', { n: current.boxes.length, pct: pct(current.changed) })}</small>
                <Segmented label={tr('compare.view')} value={view} onChange={setView} options={[{ value: 'side', label: tr('compare.viewSide') }, { value: 'overlay', label: tr('compare.viewOverlay') }]} />
              </div>
            )}
            {current.status === 'changed' && view === 'overlay' ? (
              <figure className="visual-page visual-overlay">
                <img src={img.overlay} alt={tr('compare.viewOverlay')} />
                <figcaption className="row compare-legend">
                  <span><span className="visual-swatch is-removed" /> {tr('compare.legendRemoved')}</span>
                  <span><span className="visual-swatch is-added" /> {tr('compare.legendAdded')}</span>
                  <span><span className="visual-swatch is-recolored" /> {tr('compare.legendRecolored')}</span>
                </figcaption>
              </figure>
            ) : (
              <div className="visual-side">
                {img.a ? <Marked src={img.a} boxes={current.boxes} label={tr('compare.original')} /> : <p className="muted">{tr('compare.notInA')}</p>}
                {img.b ? <Marked src={img.b} boxes={current.boxes} label={tr('compare.newVersion')} /> : <p className="muted">{tr('compare.notInB')}</p>}
              </div>
            )}
          </>
        )}
      </div>
      {report && (
        <div className="card">
          <BeforeAfter original={fileA} result={fileB} saveAs={report} labels={[tr('compare.original'), tr('compare.newVersion')]} toolName="compare" title={tr('compare.title')} summary={<Notice kind="info">{tr('compare.visualSummary')}</Notice>} />
        </div>
      )}
    </>
  )
}
