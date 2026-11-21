// Imagen a texto (W-108): reconoce el texto de fotos y capturas con el mismo motor del OCR
// de PDF (Tesseract en el navegador). Varias imágenes, pegar con Ctrl+V, texto editable y
// salida para copiar, en .txt o en Word.
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, DropZone, FileRow, Notice, Progress, Segmented } from '../../../shared/ui/ui'
import { download } from '../../../shared/files/files'
import { looksSpecial } from '../../convert/core/formats'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { OcrImage, OcrLang, OcrProgress } from '../core/ocr'
import { IMAGE_OCR_ACCEPT, combineTexts, pastedName, textFileBase, type ImageText } from '../core/imageText'

const isImage = (f: File) => f.type.startsWith('image/') || looksSpecial(f.name, f.type)

export function ImageToTextTool() {
  const { toast } = useApp()
  const [files, setFiles] = useState<File[]>([])
  const [lang, setLang] = useState<OcrLang>('spa')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<OcrProgress | null>(null)
  const [items, setItems] = useState<ImageText[] | null>(null)
  const [confidence, setConfidence] = useState(100)
  const [withNames, setWithNames] = useState(true)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const pasted = useRef(0)

  const add = (list: File[]) => {
    const images = list.filter(isImage)
    if (images.length < list.length) setError(tr('itt.notImage'))
    else setError(null)
    if (!images.length) return
    setFiles((prev) => [...prev, ...images])
    setItems(null)
  }

  // Pegar una captura de pantalla (Ctrl+V / Cmd+V) en cualquier parte de la página.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const imgs = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (!imgs.length) return
      e.preventDefault()
      add(imgs.map((f) => new File([f], pastedName(tr('file.capture'), ++pasted.current, f.type), { type: f.type })))
      toast(tr('itt.pasted'))
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  // El texto editable sigue a la opción de separar por imagen hasta que la persona lo cambia.
  useEffect(() => {
    if (items) setText(combineTexts(items, withNames))
  }, [items, withNames])

  const run = async () => {
    if (!files.length) return
    setBusy(true)
    setError(null)
    setItems(null)
    setProgress({ page: 1, pages: files.length, fraction: 0, stage: 'preparando' })
    try {
      const { runOcr } = await import('../core/ocr')
      // HEIC, TIFF, AVIF y SVG: Tesseract no los lee, se pasan a JPG antes.
      const pages = files.map((f) => async (): Promise<OcrImage> => (looksSpecial(f.name, f.type) ? (await import('../../image/infra/imageCanvas')).previewBlob(f) : f))
      const r = await runOcr(pages, { lang, wantPdf: false, onProgress: setProgress })
      const list = files.map((f, i) => ({ name: f.name, text: r.pageTexts[i] ?? '' }))
      setItems(list)
      setConfidence(r.confidence)
      track('image_ocr_done', { lang, images: files.length, confidence: r.confidence })
      if (!r.text.trim()) setError(tr('ocr.noText'))
    } catch {
      setError(tr('ocr.cantRead'))
      track('app_error', { error_context: 'image_ocr', error_message: 'error' })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const base = textFileBase(files.map((f) => f.name), tr('file.ocrText'))
  const saveWord = async () => {
    const [{ textWordDoc }, { writeDocx }] = await Promise.all([import('../core/imageText'), import('../../convert/core/pdfWord')])
    download(new Blob([writeDocx(textWordDoc(text)) as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `${base}.docx`)
  }

  const status = progress ? (progress.stage === 'preparando' ? tr('ocr.preparing') : progress.pages > 1 ? tr('itt.imageOf', { n: progress.page, total: progress.pages }) : tr('ocr.recognizing')) : ''

  return (
    <div className="stack">
      <div className="card stack">
        <DropZone accept={IMAGE_OCR_ACCEPT} multiple onFiles={add} title={tr('itt.pick')} hint={tr('itt.pickHint')} />
        {files.length > 0 && (
          <ul className="file-list" style={{ marginTop: 0 }}>
            {files.map((f, i) => (
              <FileRow
                key={i}
                file={f}
                actions={
                  <button type="button" className="icon-btn" aria-label={`${tr('itt.removeFile')} ${f.name}`} disabled={busy} onClick={() => { setFiles((p) => p.filter((_, j) => j !== i)); setItems(null) }}>
                    <Icon name="close" />
                  </button>
                }
              />
            ))}
          </ul>
        )}
        <div className="field">
          <span>{tr('ocr.docLang')}</span>
          <Segmented label={tr('ocr.lang')} value={lang} onChange={(v: OcrLang) => { setLang(v); setItems(null) }} options={[{ value: 'spa', label: tr('ocr.spanish') }, { value: 'eng', label: tr('ocr.english') }, { value: 'spa+eng', label: tr('ocr.both') }]} />
        </div>
        <small className="faint">{tr('ocr.local')}</small>
        {progress && (
          <>
            <Progress value={progress.fraction} />
            <small className="faint">{status}</small>
          </>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!files.length} onClick={() => void run()} icon="text">
            {files.length > 1 ? tr('itt.goN', { n: files.length }) : tr('itt.go')}
          </BusyButton>
        </div>
      </div>

      {items && text.trim() !== '' && (
        <div className="card stack" aria-live="polite">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h3>{tr('ocr.textTitle')}</h3>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => void navigator.clipboard.writeText(text).then(() => toast(tr('ocr.copied')))}>
                <Icon name="copy" /> {tr('ocr.copy')}
              </button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => download(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${base}.txt`)}>
                <Icon name="download" /> .txt
              </button>
              <button type="button" className="btn btn-soft btn-sm" onClick={() => void saveWord()}>
                <Icon name="file" /> {tr('itt.word')}
              </button>
            </div>
          </div>
          {confidence < 60 && <Notice kind="info">{tr('ocr.lowQuality', { n: confidence })}</Notice>}
          {items.filter((i) => i.text.trim()).length > 1 && (
            <label className="check">
              <input type="checkbox" checked={withNames} onChange={(e) => setWithNames(e.target.checked)} />
              <span>{tr('itt.withNames')}</span>
            </label>
          )}
          <label className="field">
            <span>{tr('itt.editHint')}</span>
            <textarea className="textarea itt-text" value={text} onChange={(e) => setText(e.target.value)} spellCheck />
          </label>
        </div>
      )}
    </div>
  )
}
