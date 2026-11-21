// Resumir PDF (W-142): resumen extractivo de un PDF, un Word o un texto, en el navegador.
// Elige las oraciones más representativas del propio documento (no inventa texto).
import { useMemo, useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Segmented } from '../../../shared/ui/ui'
import { baseName, download } from '../../../shared/files/files'
import { tr } from '../../../shared/i18n/translate'
import { useT } from '../../../shared/i18n/I18n'
import { SITE_URL, toolShareUrl } from '../../../shared/files/share'
import { track } from '../../../shared/platform/analytics'
import { summarize, type SummaryLength } from '../../study/core/summarize'
import { needsOcr } from '../../study/core/reading'

const ACCEPT = 'application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.md,text/plain,text/markdown'
const WORDS_PER_MINUTE = 200

const wordCount = (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length

/** Texto del archivo: PDF (con pdf.js), Word o texto plano. `scanned`: PDF sin texto (necesita OCR). */
async function readText(file: File): Promise<{ text: string; scanned: boolean }> {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    const { openPdf, extractPagesText, closePdf } = await import('../../../shared/pdf/pdf')
    const doc = await openPdf(await file.arrayBuffer())
    try {
      const pages = await extractPagesText(doc)
      return { text: pages.join('\n\n'), scanned: needsOcr(pages) }
    } finally {
      await closePdf(doc)
    }
  }
  if (name.endsWith('.docx')) {
    const { docxToText } = await import('../../convert/infra/officeRender')
    return { text: await docxToText(file), scanned: false }
  }
  return { text: await file.text(), scanned: false }
}

export function SummaryTool() {
  const { toast } = useApp()
  const { lang } = useT()
  const [file, setFile] = useState<File | null>(null)
  const [pasted, setPasted] = useState('')
  const [text, setText] = useState<string | null>(null)
  const [length, setLength] = useState<SummaryLength>('medium')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)

  const summary = useMemo(() => (text ? summarize(text, { length }) : null), [text, length])

  const run = async () => {
    setBusy(true)
    setError(null)
    setScanned(false)
    try {
      const { text: t, scanned: s } = file ? await readText(file) : { text: pasted, scanned: false }
      if (s) {
        setScanned(true)
        setText(null)
        return
      }
      if (wordCount(t) < 20) {
        setError(tr('sum.empty'))
        setText(null)
        return
      }
      setText(t)
      track('pdf_tool_used', { tool_name: 'summarize' })
    } catch {
      setError(tr('sum.cantRead'))
      track('app_error', { error_context: 'summarize', error_message: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setText(null)
    setError(null)
    setScanned(false)
  }

  const result = summary ? summary.sentences.join('\n\n') : ''
  const from = text ? wordCount(text) : 0
  const to = wordCount(result)
  const base = file ? `${baseName(file.name)}-${tr('file.summary')}` : tr('file.summary')
  const copy = async () => {
    await navigator.clipboard.writeText(result)
    toast(tr('sum.copied'))
  }
  const saveWord = async () => {
    const [{ textWordDoc }, { writeDocx }] = await Promise.all([import('../../ocr/core/imageText'), import('../../convert/core/pdfWord')])
    download(new Blob([writeDocx(textWordDoc(result)) as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `${base}.docx`)
  }

  return (
    <div className="stack">
      <div className="card stack">
        {file ? (
          <ul className="file-list" style={{ marginTop: 0 }}>
            <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => (setFile(null), reset())}>{tr('common.change')}</button>} />
          </ul>
        ) : (
          <>
            <DropZone accept={ACCEPT} title={tr('sum.pick')} hint={tr('sum.pickHint')} onFiles={([f]) => (setFile(f), reset())} />
            <label className="field">
              <span>{tr('sum.paste')}</span>
              <textarea className="input" rows={4} value={pasted} placeholder={tr('sum.pastePh')} onChange={(e) => (setPasted(e.target.value), reset())} />
            </label>
          </>
        )}
        <div className="field">
          <span>{tr('sum.length')}</span>
          <Segmented label={tr('sum.length')} value={length} onChange={setLength} options={[{ value: 'short', label: tr('sum.short') }, { value: 'medium', label: tr('sum.medium') }, { value: 'long', label: tr('sum.long') }]} />
        </div>
        <small className="faint">{tr('sum.local')}</small>
        {error && <Notice kind="error">{error}</Notice>}
        {scanned && (
          <Notice kind="info">
            {tr('sum.scanned')} <a href={toolShareUrl('ocr', lang).replace(SITE_URL, '')}>{tr('tool.ocr')}</a>
          </Notice>
        )}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!file && wordCount(pasted) < 1} onClick={run} icon="note">
            {tr('sum.go')}
          </BusyButton>
        </div>
      </div>

      {summary && text && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>{tr('sum.result')}</h2>
          <p className="faint" style={{ margin: 0 }}>
            {tr('sum.stats', { from: from.toLocaleString(), to: to.toLocaleString(), pct: Math.max(1, Math.round((to / Math.max(1, from)) * 100)), min: Math.max(1, Math.round(to / WORDS_PER_MINUTE)) })}
          </p>
          {summary.keywords.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              <strong>{tr('sum.keywords')}</strong>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }} aria-label={tr('sum.keywords')}>
                {summary.keywords.map((k) => (
                  <span key={k} className="chip">{k}</span>
                ))}
              </div>
            </div>
          )}
          <ul className="sum-list">
            {summary.sentences.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <small className="faint">{tr('sum.how')}</small>
          <div className="row">
            <button type="button" className="btn btn-soft btn-sm" onClick={copy}><Icon name="copy" /> {tr('txt.copy')}</button>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([result], { type: 'text/plain;charset=utf-8' }), `${base}.txt`)}><Icon name="download" /> .txt</button>
            <button type="button" className="btn btn-soft btn-sm" onClick={saveWord}><Icon name="download" /> Word (.docx)</button>
          </div>
        </div>
      )}
    </div>
  )
}
