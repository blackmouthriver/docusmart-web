// OCR: reconocer el texto de imágenes y PDF escaneados (Tesseract en el navegador).
import { useMemo, useState } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented } from '../components/ui'
import { baseName, download } from '../lib/files'
import { BeforeAfter } from '../components/DocPreview'
import { resultFile } from '../lib/share'
import { tr } from '../i18n/translate'
import type { OcrLang, OcrProgress, OcrResult } from '../lib/ocr'
import { track } from '../../shared/analytics'

export function OcrTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState<OcrLang>('spa')
  const [wantPdf, setWantPdf] = useState(true)
  const [progress, setProgress] = useState<OcrProgress | null>(null)
  const [result, setResult] = useState<OcrResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const output = useMemo(() => (result?.pdf && file ? resultFile(result.pdf, `${baseName(file.name)}-buscable.pdf`, 'application/pdf') : null), [result, file])

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress({ page: 1, pages: 1, fraction: 0, stage: 'preparando' })
    const [{ runOcr }, { sourceFromFile }] = await Promise.all([import('../lib/ocr'), import('../lib/ocrSources')])
    let source: Awaited<ReturnType<typeof sourceFromFile>> | null = null
    try {
      source = await sourceFromFile(file)
      const r = await runOcr(source.pages, { lang, wantPdf, onProgress: setProgress })
      setResult(r)
      track('ocr_done', { lang, pages: r.pages, pdf: wantPdf, confidence: r.confidence })
      if (!r.text.trim()) setError(tr('ocr.noText'))
      else toast(tr('ocr.recognized'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(/password|encrypt/i.test(msg) ? tr('err.lockedPdf') : tr('ocr.cantRead'))
      track('app_error', { error_context: 'ocr', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      await source?.close()
      setBusy(false)
      setProgress(null)
    }
  }

  const status = progress
    ? progress.stage === 'preparando'
      ? tr('ocr.preparing')
      : progress.pages > 1
        ? tr('ocr.pageOf', { n: progress.page, total: progress.pages })
        : tr('ocr.recognizing')
    : ''

  return (
    <div className="stack">
      <div className="card stack">
        {!file ? (
          <DropZone accept="application/pdf,image/*" title={tr('ocr.pick')} hint={tr('ocr.pickHint')} onFiles={([f]) => { setFile(f); setResult(null); setError(null) }} />
        ) : (
          <ul className="file-list" style={{ marginTop: 0 }}>
            <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setFile(null); setResult(null); setError(null) }}>{tr('common.change')}</button>} />
          </ul>
        )}
        <div className="field">
          <span>{tr('ocr.docLang')}</span>
          <Segmented
            label={tr('ocr.lang')}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'spa', label: tr('ocr.spanish') },
              { value: 'eng', label: tr('ocr.english') },
              { value: 'spa+eng', label: tr('ocr.both') },
            ]}
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={wantPdf} onChange={(e) => setWantPdf(e.target.checked)} />
          <span>{tr('ocr.wantPdf')}</span>
        </label>
        <small className="faint">{tr('ocr.local')}</small>
        {progress && (
          <>
            <Progress value={progress.fraction} />
            <small className="faint">{status}</small>
          </>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!file} onClick={run} icon="text">
            {tr('ocr.go')}
          </BusyButton>
        </div>
      </div>

      {file && wantPdf && (
        <div className="card">
          <BeforeAfter
            original={file}
            result={output}
            toolName="ocr"
            title={tr('ocr.title')}
            previewTitle={tr('dp.previewTitle')}
            placeholder={busy ? tr('ocr.recognizing') : tr('ocr.placeholder')}
          />
        </div>
      )}

      {result && result.text.trim() && (
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{tr('ocr.textTitle')}</h3>
            <div className="row" style={{ gap: 6 }}>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => navigator.clipboard.writeText(result.text).then(() => toast(tr('ocr.copied')))}>
                <Icon name="copy" /> {tr('ocr.copy')}
              </button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([result.text], { type: 'text/plain;charset=utf-8' }), `${baseName(file!.name)}-ocr.txt`)}>
                <Icon name="download" /> .txt
              </button>
            </div>
          </div>
          {result.confidence < 60 && (
            <Notice kind="info">{tr('ocr.lowQuality', { n: result.confidence })}</Notice>
          )}
          <pre className="text-view">{result.text}</pre>
        </div>
      )}
    </div>
  )
}
