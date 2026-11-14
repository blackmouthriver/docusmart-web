// Comparar PDF: qué cambió entre dos versiones de un documento.
import { useState } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, errorMessage } from '../components/ui'
import { baseName, download } from '../lib/files'
import { compareTexts, reportText, type Comparison } from '../lib/pdfCompare'
import { track } from '../../shared/analytics'

type Result = Comparison & { nameA: string; nameB: string; pagesA: number; pagesB: number }

/** Cuántos cambios se muestran de entrada; el resto, con "Ver más". */
const PAGE_SIZE = 30

export function CompareTool() {
  const { toast } = useApp()
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [shown, setShown] = useState(PAGE_SIZE)

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
      const { pdfLines } = await import('../lib/pdfCompareSources')
      const [a, b] = await Promise.all([pdfLines(fileA), pdfLines(fileB)])
      if (!a.lines.length || !b.lines.length) {
        const which = !a.lines.length && !b.lines.length ? 'Ninguno de los dos PDF tiene' : `"${(!a.lines.length ? fileA : fileB).name}" no tiene`
        setError(`${which} texto: parece escaneado. Pásalo primero por "OCR: reconocer texto" y compara los PDF buscables.`)
        return
      }
      const c = compareTexts(a.lines, b.lines)
      setResult({ ...c, nameA: fileA.name, nameB: fileB.name, pagesA: a.pages, pagesB: b.pages })
      setShown(PAGE_SIZE)
      track('pdf_tool_used', { tool_name: 'compare' })
    } catch (e) {
      setError(/password/i.test(String(e)) ? 'Uno de los PDF tiene contraseña. Quítala primero con "Desbloquear PDF".' : errorMessage(e))
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
          <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => set(null)}>Cambiar</button>} />
        </ul>
      ) : (
        <DropZone accept="application/pdf" title={`Elige el PDF ${label.toLowerCase()}`} hint="O arrástralo aquí" onFiles={([f]) => set(f)} />
      )}
    </div>
  )

  return (
    <div className="stack">
      <div className="card stack">
        <div className="compare-slots">
          {slot('Original', fileA, pick(setFileA))}
          {slot('Nueva versión', fileB, pick(setFileB))}
        </div>
        <small className="faint">Compara el texto de los dos documentos. Los cambios en imágenes o en el diseño no se detectan.</small>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          {fileA && fileB && (
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setFileA(fileB); setFileB(fileA); setResult(null) }}>
              <Icon name="convert" /> Intercambiar
            </button>
          )}
          <BusyButton busy={busy} disabled={!fileA || !fileB} onClick={run} icon="split">
            Comparar
          </BusyButton>
        </div>
      </div>

      {result && (
        <div className="card stack" aria-live="polite">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{result.tooDifferent ? 'Son documentos muy distintos' : result.identical ? 'El texto es igual' : `${result.hunks.length} ${result.hunks.length === 1 ? 'cambio' : 'cambios'}`}</h3>
            {!result.identical && (
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => {
                  download(new Blob([reportText(result, result.nameA, result.nameB)], { type: 'text/plain;charset=utf-8' }), `comparacion-${baseName(result.nameA)}.txt`)
                  toast('Informe descargado.')
                }}
              >
                <Icon name="download" /> Informe .txt
              </button>
            )}
          </div>
          {result.tooDifferent ? (
            <p className="muted">Casi todo el texto cambió, así que no tiene sentido marcarlo palabra por palabra. Revisa que hayas elegido dos versiones del mismo documento.</p>
          ) : result.identical ? (
            <Notice kind="success">
              Las dos versiones dicen lo mismo{result.pagesA !== result.pagesB ? ` (aunque una tiene ${result.pagesA} páginas y la otra ${result.pagesB})` : ''}. Puede haber cambios de diseño o en las imágenes.
            </Notice>
          ) : (
            <>
              <div className="row compare-legend">
                <span><ins className="diff-ins">+{result.added}</ins> palabras agregadas</span>
                <span><del className="diff-del">−{result.removed}</del> palabras quitadas</span>
              </div>
              <ol className="compare-hunks">
                {result.hunks.slice(0, shown).map((h, i) => (
                  <li key={i} className="compare-hunk">
                    <div className="compare-hunk-head">
                      Cambio {i + 1} · {h.pageA === h.pageB ? `página ${h.pageA}` : `página ${h.pageA} del original, ${h.pageB} de la nueva`}
                    </div>
                    {h.before.map((t, j) => <p key={'b' + j} className="compare-ctx">{t}</p>)}
                    <p className="compare-change">
                      {h.segments.map((s, j) => {
                        const sep = j ? ' ' : ''
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
                    Ver más cambios ({result.hunks.length - shown} restantes)
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
