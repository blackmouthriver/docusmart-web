// Resumir PDF (W-142): resumen extractivo de un PDF, un Word o un texto, en el navegador.
// Elige las oraciones más representativas del propio documento (no inventa texto).
import { useMemo, useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented } from '../../../shared/ui/ui'
import { baseName, download } from '../../../shared/files/files'
import { tr } from '../../../shared/i18n/translate'
import { useT } from '../../../shared/i18n/I18n'
import { SITE_URL, toolShareUrl } from '../../../shared/files/share'
import { track } from '../../../shared/platform/analytics'
import { joinPages, summarize, type SummaryLength } from '../../study/core/summarize'
import { DOCUMENT_ACCEPT, readDocument } from '../infra/readDocument'
import { useDefaultOcrLang } from '../../ocr/ui/OcrLangPicker'
import type { OcrProgress } from '../../ocr/core/ocr'

const WORDS_PER_MINUTE = 200

const wordCount = (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length
type Format = 'paragraphs' | 'bullets'

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
  const [format, setFormat] = useState<Format>('bullets')
  const [ocr, setOcr] = useState<OcrProgress | null>(null)
  const ocrLang = useDefaultOcrLang()

  const summary = useMemo(() => (text ? summarize(text, { length }) : null), [text, length])

  const run = async () => {
    setBusy(true)
    setError(null)
    setScanned(false)
    try {
      // De un PDF se quitan los encabezados, pies y números de página que se repiten.
      const { pages, scanned: s } = file ? await readDocument(file) : { pages: [pasted], scanned: false }
      const t = joinPages(pages)
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

  /** PDF escaneado: reconoce el texto (OCR, en el navegador) y lo resume en el mismo paso. */
  const runOcr = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setOcr({ page: 0, pages: 1, fraction: 0, stage: 'preparando' })
    let source: { close: () => Promise<void> } | null = null
    try {
      const [{ runOcr: ocrRun }, { sourceFromFile, rotateImage }] = await Promise.all([import('../../ocr/core/ocr'), import('../../ocr/infra/ocrSources')])
      const src = await sourceFromFile(file)
      source = src
      const r = await ocrRun(src.pages, { lang: ocrLang, wantPdf: false, onProgress: setOcr, rotate: rotateImage })
      const t = joinPages(r.pageTexts)
      if (wordCount(t) < 20) {
        setError(tr('sum.empty'))
        return
      }
      setScanned(false)
      setText(t)
      track('pdf_tool_used', { tool_name: 'summarize_ocr' })
    } catch {
      setError(tr('sum.cantRead'))
      track('app_error', { error_context: 'summarize_ocr', error_message: 'error' })
    } finally {
      await source?.close()
      setOcr(null)
      setBusy(false)
    }
  }

  const reset = () => {
    setText(null)
    setError(null)
    setScanned(false)
  }

  // En viñetas (como QuillBot) o en párrafos; lo mismo al copiar y al descargar.
  const result = summary ? (format === 'bullets' ? summary.sentences.map((s) => `• ${s}`).join('\n') : summary.sentences.join('\n\n')) : ''
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
            <DropZone accept={DOCUMENT_ACCEPT} title={tr('sum.pick')} hint={tr('sum.pickHint')} onFiles={([f]) => (setFile(f), reset())} />
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
        {scanned && !ocr && (
          <Notice kind="info">
            {tr('sum.scannedOcr')}{' '}
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void runOcr()}>{tr('sum.ocrGo')}</button>{' '}
            <a href={toolShareUrl('ocr', lang).replace(SITE_URL, '')}>{tr('tool.ocr')}</a>
          </Notice>
        )}
        {ocr && (
          <>
            <Progress value={ocr.fraction} />
            <small className="faint">{ocr.stage === 'preparando' ? tr('ocr.preparing') : tr('ocr.pageOf', { n: Math.max(1, ocr.page), total: ocr.pages })}</small>
          </>
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
          <div className="field">
            <span>{tr('sum.format')}</span>
            <Segmented<Format> label={tr('sum.format')} value={format} onChange={setFormat} options={[{ value: 'bullets', label: tr('sum.bullets') }, { value: 'paragraphs', label: tr('sum.paragraphs') }]} />
          </div>
          {format === 'bullets' ? (
            <ul className="sum-list">
              {summary.sentences.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            summary.sentences.map((s, i) => <p key={i} style={{ margin: 0 }}>{s}</p>)
          )}
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
