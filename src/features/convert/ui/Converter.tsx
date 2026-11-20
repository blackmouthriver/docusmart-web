import { useEffect, useState } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented, errorMessage } from '../../../shared/ui/ui'
import { baseName } from '../../../shared/files/files'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { bundleFiles, resultFile } from '../../../shared/files/share'
import { OfficeFormatError, docxToPdf, xlsxToPdf } from '../infra/officeRender'
import { convertImage, imagesToPdf, pdfToImages, pdfToText, type ImageTarget } from '../core/convert'
import { heicOutputName, jpegQuality, type HeicTarget } from '../core/heic'
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'


type Conv = {
  id: string
  type: string // mismo nombre que ConversionType en la app
  from: string
  to: string
  fromColor: string
  toColor: string
  desc: MessageKey
}

const FMT_COLORS: Record<string, string> = {
  // Tonos con contraste ≥4,5:1 para el texto blanco (W-17).
  IMG: '#7C3AED', HEIC: '#7C3AED', PDF: '#DC2626', JPG: '#7C3AED', PNG: '#7C3AED', WEBP: '#7C3AED', BMP: '#7C3AED',
  TXT: '#64748B', WORD: '#2563EB', EXCEL: '#15803D', PPT: '#C2410C', HTML: '#0E7490', CSV: '#15803D',
}
const c = (id: string, type: string, from: string, to: string, desc: MessageKey): Conv => ({
  id, type, from, to, desc, fromColor: FMT_COLORS[from], toColor: FMT_COLORS[to],
})

const IMAGE_CONVS = [
  c('img-pdf', 'IMAGE_TO_PDF', 'IMG', 'PDF', 'conv.desc.imgPdf'),
  c('img-jpg', 'IMAGE_TO_JPG', 'IMG', 'JPG', 'conv.desc.imgJpg'),
  c('img-png', 'IMAGE_TO_PNG', 'IMG', 'PNG', 'conv.desc.imgPng'),
  c('img-webp', 'IMAGE_TO_WEBP', 'IMG', 'WEBP', 'conv.desc.imgWebp'),
  c('img-bmp', 'IMAGE_TO_BMP', 'IMG', 'BMP', 'conv.desc.imgBmp'),
  c('heic-jpg', 'HEIC_TO_JPG', 'HEIC', 'JPG', 'conv.desc.heicJpg'),
]
const PDF_CONVS = [
  c('pdf-img', 'PDF_TO_IMAGE', 'PDF', 'IMG', 'conv.desc.pdfImg'),
  c('pdf-txt', 'PDF_TO_TXT', 'PDF', 'TXT', 'conv.desc.pdfTxt'),
  c('pdf-word', 'PDF_TO_WORD', 'PDF', 'WORD', 'conv.desc.pdfWord'),
  c('pdf-excel', 'PDF_TO_EXCEL', 'PDF', 'EXCEL', 'conv.desc.pdfExcel'),
]
const OFFICE_CONVS = [
  c('word-pdf', 'WORD_TO_PDF', 'WORD', 'PDF', 'conv.desc.wordPdf'),
  c('excel-pdf', 'EXCEL_TO_PDF', 'EXCEL', 'PDF', 'conv.desc.excelPdf'),
]
const APP_ONLY = [
  c('', 'PPT_TO_PDF', 'PPT', 'PDF', 'conv.desc.pptPdf'),
]
const ALL = [...IMAGE_CONVS, ...PDF_CONVS, ...OFFICE_CONVS]

/** Conversión por id (img-pdf, pdf-img…), para las páginas propias de cada herramienta. */
export const findConversion = (id: string) => ALL.find((x) => x.id === id)

function Pair({ conv }: { conv: Conv }) {
  return (
    <span className="fmt-pair">
      <span className="fmt" style={{ background: conv.fromColor }}>{conv.from}</span>
      <span className="faint">→</span>
      <span className="fmt" style={{ background: conv.toColor }}>{conv.to}</span>
    </span>
  )
}

export function Converter({ sub }: { sub?: string }) {
  const conv = ALL.find((x) => x.id === sub)
  if (conv) return <ConvertJob conv={conv} />

  return (
    <>
      <HeroCard title={tr('conv.title')} subtitle={tr('conv.subtitle')} />
      <h2 className="section-title">{tr('conv.question')}</h2>
      {[
        { title: tr('conv.image'), cls: 'ico-violet', icon: 'image' as const, list: IMAGE_CONVS },
        { title: 'PDF', cls: 'ico-red', icon: 'pdf' as const, list: PDF_CONVS },
        { title: tr('conv.wordExcel'), cls: 'ico-blue', icon: 'file' as const, list: OFFICE_CONVS },
      ].map((g) => (
        <section className="conv-group" key={g.title}>
          <h3>
            <span className={'ico ' + g.cls}><Icon name={g.icon} /></span>
            {g.title}
          </h3>
          <div className="tool-grid">
            {g.list.map((x) => (
              <button key={x.id} type="button" className="tool-card" onClick={() => go('convertir', x.id)} style={{ flexDirection: 'column', gap: 12 }}>
                <Pair conv={x} />
                <span>
                  <b>{x.from === 'IMG' ? tr('conv.image') : x.from} → {x.to === 'IMG' ? tr('conv.image') : x.to}</b>
                  <small>{tr(x.desc)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <section className="conv-group">
        <h3>
          <span className="ico ico-blue"><Icon name="phone" /></span>
          {tr('conv.inApp')}
        </h3>
        <div className="card">
          <div className="row" style={{ gap: 14 }}>
            {APP_ONLY.map((x) => <Pair key={x.type} conv={x} />)}
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            {tr('conv.inAppText')}
          </p>
        </div>
      </section>
    </>
  )
}

/** `embedded`: dentro de una página de herramienta, sin encabezado ni "Volver". */
export function ConvertJob({ conv, embedded = false }: { conv: Conv; embedded?: boolean }) {
  const { toast } = useApp()
  const isImageInput = conv.from === 'IMG'
  const isHeic = conv.id === 'heic-jpg'
  /** Varias a la vez: imágenes y fotos HEIC. */
  const multiple = isImageInput || isHeic
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pdfImgFormat, setPdfImgFormat] = useState<'png' | 'jpg'>('png')
  const [heicFormat, setHeicFormat] = useState<HeicTarget>('jpg')
  const [heicQuality, setHeicQuality] = useState(90)
  const [text, setText] = useState<string | null>(null)
  const [wordInfo, setWordInfo] = useState<{ paragraphs: number; tables: number; images: number; headings: number } | null>(null)
  const [excelInfo, setExcelInfo] = useState<{ sheets: number; rows: number; numbers: number } | null>(null)
  const [officeInfo, setOfficeInfo] = useState<{ skippedImages: number } | null>(null)
  const isOffice = conv.id === 'word-pdf' || conv.id === 'excel-pdf'
  const [sheetMode, setSheetMode] = useState<'pages' | 'single'>('pages')
  /** El resultado, para verlo y guardarlo (ya no se descarga solo). */
  const [out, setOut] = useState<{ result: File | null; results?: File[]; saveAs?: File | null } | null>(null)
  useEffect(() => setOut(null), [files, pdfImgFormat, sheetMode, heicFormat, heicQuality])

  const run = async () => {
    setBusy(true)
    setError(null)
    setProgress(0)
    setWordInfo(null)
    setExcelInfo(null)
    setOfficeInfo(null)
    setOut(null)
    track('conversion_started', { conversion_type: conv.type })
    const totalKb = Math.round(files.reduce((s, f) => s + f.size, 0) / 1024)
    try {
      if (conv.id === 'img-pdf') {
        setOut({ result: resultFile(await imagesToPdf(files), `${baseName(files[0].name)}.pdf`, PDF) })
      } else if (isHeic) {
        const { heicToCanvas } = await import('../infra/heicDecoder')
        const mime = heicFormat === 'jpg' ? 'image/jpeg' : 'image/png'
        const converted: File[] = []
        for (let i = 0; i < files.length; i++) {
          const canvas = await heicToCanvas(files[i])
          try {
            converted.push(resultFile(await canvasToBlob(canvas, mime, jpegQuality(heicQuality)), heicOutputName(files[i].name, heicFormat), mime))
          } finally {
            canvas.width = canvas.height = 0
          }
          setProgress((i + 1) / files.length)
        }
        setOut(converted.length === 1 ? { result: converted[0] } : { result: null, results: converted, saveAs: await bundleFiles(converted, `docusmart-${heicFormat}.zip`) })
      } else if (isImageInput) {
        const target = conv.to.toLowerCase() as ImageTarget
        const converted: File[] = []
        for (let i = 0; i < files.length; i++) {
          const data = await convertImage(files[i], target)
          converted.push(resultFile(data, `${baseName(files[i].name)}.${target}`, data.type))
          setProgress((i + 1) / files.length)
        }
        // Una sola imagen se ve en grande; varias, como miniaturas y en un ZIP.
        setOut(converted.length === 1 ? { result: converted[0] } : { result: null, results: converted, saveAs: await bundleFiles(converted, `docusmart-${target}.zip`) })
      } else if (conv.id === 'pdf-img') {
        const blobs = await pdfToImages(await files[0].arrayBuffer(), pdfImgFormat, 1600, (d, t) => setProgress(d / t))
        const name = baseName(files[0].name)
        const images = blobs.map((b, i) => resultFile(b, `${name}-${tr('file.page')}-${i + 1}.${pdfImgFormat}`, pdfImgFormat === 'jpg' ? 'image/jpeg' : 'image/png'))
        setOut({ result: null, results: images, saveAs: await bundleFiles(images, `${name}-${tr('file.images')}.zip`) })
      } else if (conv.id === 'pdf-word') {
        const [{ extractForWord }, { buildDocument, writeDocx, summarize }] = await Promise.all([import('../infra/pdfWordSources'), import('../core/pdfWord')])
        const ex = await extractForWord(files[0], (d, t) => setProgress(d / t))
        if (!ex.texts.length) {
          setError(tr('conv.noText'))
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        const doc = buildDocument(ex.pages, ex.texts, ex.images)
        setOut({ result: resultFile(writeDocx(doc), `${baseName(files[0].name)}.docx`, DOCX) })
        setWordInfo(summarize(doc))
      } else if (conv.id === 'pdf-excel') {
        const [{ extractForWord }, { buildSheets, writeXlsx, summarizeSheets }] = await Promise.all([import('../infra/pdfWordSources'), import('../core/pdfExcel')])
        const ex = await extractForWord(files[0], (d, t) => setProgress(d / t), { images: false })
        if (!ex.texts.length) {
          setError(tr('conv.noText'))
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        const sheets = buildSheets(ex.pages, ex.texts, sheetMode)
        setOut({ result: resultFile(writeXlsx(sheets), `${baseName(files[0].name)}.xlsx`, XLSX) })
        setExcelInfo(summarizeSheets(sheets))
      } else if (conv.id === 'word-pdf') {
        const name = files[0].name.toLowerCase()
        if (!name.endsWith('.docx')) throw new OfficeFormatError('Word')
        const { pdf, skippedImages } = await docxToPdf(files[0], baseName(files[0].name))
        setOut({ result: resultFile(pdf, `${baseName(files[0].name)}.pdf`, PDF) })
        setOfficeInfo({ skippedImages })
      } else if (conv.id === 'excel-pdf') {
        if (!files[0].name.toLowerCase().endsWith('.xlsx')) throw new OfficeFormatError('Excel')
        setOut({ result: resultFile(await xlsxToPdf(files[0], baseName(files[0].name)), `${baseName(files[0].name)}.pdf`, PDF) })
        setOfficeInfo({ skippedImages: 0 })
      } else if (conv.id === 'pdf-txt') {
        const t = await pdfToText(await files[0].arrayBuffer())
        setText(t)
        if (!t.trim()) {
          setError(tr('conv.noTextTxt'))
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        setOut({ result: resultFile(new Blob([t], { type: 'text/plain;charset=utf-8' }), `${baseName(files[0].name)}.txt`, 'text/plain;charset=utf-8') })
      }
      track('conversion_success', { conversion_type: conv.type, file_size_kb: totalKb })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(e instanceof OfficeFormatError || (e instanceof Error && (e.name === 'OfficeEmptyError' || e.name === 'HeicError')) ? e.message : errorMessage(e))
      track('conversion_error', { conversion_type: conv.type, error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  const title = `${conv.from === 'IMG' ? tr('conv.image') : conv.from} → ${conv.to === 'IMG' ? tr('conv.image') : conv.to}`
  return (
    <>
      {!embedded && (
        <>
          <HeroCard title={tr('conv.title')} subtitle={tr('conv.subtitle')} />
          <BackButton label={tr('conv.back')} onClick={() => go('convertir')} />
        </>
      )}
      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 24 }}>{title}</h3>
          <Pair conv={conv} />
        </div>
        <p className="muted">{tr(conv.desc)}</p>
        <DropZone
          accept={isImageInput ? IMAGE_ACCEPT : isHeic ? HEIC_ACCEPT : conv.id === 'word-pdf' ? '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : conv.id === 'excel-pdf' ? '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'}
          multiple={multiple}
          title={isImageInput ? tr('conv.pickImages') : isHeic ? tr('conv.pickHeic') : conv.id === 'word-pdf' ? tr('conv.pickWord') : conv.id === 'excel-pdf' ? tr('conv.pickExcel') : tr('common.pickPdf')}
          hint={tr('conv.dragFiles')}
          onFiles={(f) => {
            setFiles((prev) => (multiple ? [...prev, ...f] : f))
            setText(null)
            setError(null)
          }}
        />
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f, i) => (
              <FileRow
                key={f.name + i}
                file={f}
                actions={
                  <>
                    {conv.id === 'img-pdf' && files.length > 1 && (
                      <>
                        <button type="button" className="icon-btn" aria-label={tr('conv.moveUp')} disabled={i === 0} onClick={() => setFiles((p) => swap(p, i, i - 1))}>
                          <Icon name="up" />
                        </button>
                        <button type="button" className="icon-btn" aria-label={tr('conv.moveDown')} disabled={i === files.length - 1} onClick={() => setFiles((p) => swap(p, i, i + 1))}>
                          <Icon name="downArrow" />
                        </button>
                      </>
                    )}
                    <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                      <Icon name="close" />
                    </button>
                  </>
                }
              />
            ))}
          </ul>
        )}
        {conv.id === 'pdf-img' && (
          <div className="row">
            <span className="faint">{tr('single.format')}</span>
            <Segmented label={tr('conv.imageFormat')} value={pdfImgFormat} onChange={setPdfImgFormat} options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }]} />
          </div>
        )}
        {isHeic && (
          <>
            <div className="row">
              <span className="faint">{tr('single.format')}</span>
              <Segmented label={tr('conv.imageFormat')} value={heicFormat} onChange={setHeicFormat} options={[{ value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }]} />
            </div>
            {heicFormat === 'jpg' && (
              <label className="field">
                <span>{tr('conv.heicQuality', { n: heicQuality })}</span>
                <input type="range" min={50} max={100} step={5} value={heicQuality} onChange={(e) => setHeicQuality(Number(e.target.value))} />
              </label>
            )}
            <small className="faint">{tr('conv.heicNote')}</small>
          </>
        )}
        {busy && progress > 0 && <Progress value={progress} />}
        {error && <Notice kind="error">{error}</Notice>}
        {conv.id === 'pdf-word' && !wordInfo && !error && (
          <small className="faint">{tr('conv.wordNote')}</small>
        )}
        {conv.id === 'pdf-excel' && (
          <div className="field">
            <span>{tr('conv.sheets')}</span>
            <Segmented label={tr('conv.sheets')} value={sheetMode} onChange={setSheetMode} options={[{ value: 'pages', label: tr('conv.onePerPage') }, { value: 'single', label: tr('conv.allInOne') }]} />
            {!excelInfo && !error && <small className="faint">{tr('conv.excelNote')}</small>}
          </div>
        )}
        {isOffice && !officeInfo && !error && (
          <small className="faint">{tr('conv.officeNote')}</small>
        )}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!files.length} onClick={run} icon="convert">
            {tr('conv.go')}
          </BusyButton>
        </div>
        {files.length > 0 && (
          <BeforeAfter
            original={multiple && files.length > 1 ? undefined : files[0]}
            originals={multiple && files.length > 1 ? files : undefined}
            result={out?.result ?? null}
            results={out?.results}
            saveAs={out?.saveAs}
            toolName={conv.id || conv.type}
            title={resultTitle(conv.to)}
            previewTitle={files.length > 1 ? tr('conv.yourFiles') : tr('conv.previewFile')}
            placeholder={busy ? tr('conv.converting') : tr('conv.resultIn', { fmt: conv.to === 'IMG' ? tr('conv.imageLower') : conv.to })}
            summary={
              officeInfo ? (
                officeInfo.skippedImages ? (
                  <Notice kind="info">{officeInfo.skippedImages === 1 ? tr('conv.skippedOne') : tr('conv.skippedMany', { n: officeInfo.skippedImages })}</Notice>
                ) : undefined
              ) : excelInfo ? (
                <Notice kind="success">
                  {tr('conv.excelSummary', {
                    rows: excelInfo.rows,
                    sheets: excelInfo.sheets === 1 ? tr('conv.sheetOne') : tr('conv.sheetMany', { n: excelInfo.sheets }),
                    numbers: excelInfo.numbers === 1 ? tr('conv.numberOne') : tr('conv.numberMany', { n: excelInfo.numbers }),
                  })}
                </Notice>
              ) : wordInfo ? (
                <Notice kind="success">
                  {tr('conv.wordSummary', { parts: wordParts(wordInfo) })}
                </Notice>
              ) : out?.saveAs && out.results && out.results.length > 1 ? (
                <Notice kind="success">{tr('conv.filesZip', { n: out.results.length })}</Notice>
              ) : undefined
            }
          />
        )}
      </div>
      {text && text.trim() && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <h3>{tr('conv.extracted')}</h3>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => navigator.clipboard.writeText(text).then(() => toast(tr('conv.textCopied')))}>
              <Icon name="copy" /> {tr('ocr.copy')}
            </button>
          </div>
          <pre className="text-view">{text}</pre>
        </div>
      )}
    </>
  )
}

const PDF = 'application/pdf'
// Algunos sistemas no le ponen tipo a las fotos HEIC: también se aceptan por extensión.
const HEIC_ACCEPT = '.heic,.heif,image/heic,image/heif'
const IMAGE_ACCEPT = `image/*,${HEIC_ACCEPT}`
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Título del resultado según el formato de destino. */
function resultTitle(to: string): string {
  if (to === 'PDF') return tr('conv.result.pdf')
  if (to === 'WORD') return tr('conv.result.word')
  if (to === 'EXCEL') return tr('conv.result.excel')
  if (to === 'TXT') return tr('conv.result.txt')
  return tr('conv.result.images')
}

/** "12 párrafos, 2 títulos, 1 tabla": lo que se reconstruyó en el Word. */
function wordParts(w: { paragraphs: number; tables: number; images: number; headings: number }): string {
  const parts = [tr('conv.paragraphs', { n: w.paragraphs })]
  if (w.headings) parts.push(w.headings === 1 ? tr('conv.headingOne') : tr('conv.headingMany', { n: w.headings }))
  if (w.tables) parts.push(w.tables === 1 ? tr('conv.tableOne') : tr('conv.tableMany', { n: w.tables }))
  if (w.images) parts.push(w.images === 1 ? tr('img.countOne') : tr('img.countMany', { n: w.images }))
  return parts.join(', ')
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const copy = arr.slice()
  ;[copy[a], copy[b]] = [copy[b], copy[a]]
  return copy
}
