import { useEffect, useState } from 'react'
import { go, useApp } from '../state'
import { Icon } from '../components/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented, errorMessage } from '../components/ui'
import { baseName } from '../lib/files'
import { BeforeAfter } from '../components/DocPreview'
import { bundleFiles, resultFile } from '../lib/share'
import { OfficeFormatError, docxToPdf, xlsxToPdf } from '../lib/officeRender'
import { convertImage, imagesToPdf, pdfToImages, pdfToText, type ImageTarget } from '../lib/convert'
import { track } from '../../shared/analytics'


type Conv = {
  id: string
  type: string // mismo nombre que ConversionType en la app
  from: string
  to: string
  fromColor: string
  toColor: string
  desc: string
}

const FMT_COLORS: Record<string, string> = {
  IMG: '#8B5CF6', PDF: '#EF4444', JPG: '#8B5CF6', PNG: '#8B5CF6', WEBP: '#8B5CF6', BMP: '#8B5CF6',
  TXT: '#64748B', WORD: '#2563EB', EXCEL: '#16A34A', PPT: '#F97316', HTML: '#06B6D4', CSV: '#16A34A',
}
const c = (id: string, type: string, from: string, to: string, desc: string): Conv => ({
  id, type, from, to, desc, fromColor: FMT_COLORS[from], toColor: FMT_COLORS[to],
})

const IMAGE_CONVS = [
  c('img-pdf', 'IMAGE_TO_PDF', 'IMG', 'PDF', 'Una o varias imágenes en un solo PDF'),
  c('img-jpg', 'IMAGE_TO_JPG', 'IMG', 'JPG', 'Liviano, ideal para fotos'),
  c('img-png', 'IMAGE_TO_PNG', 'IMG', 'PNG', 'Sin pérdida, conserva transparencia'),
  c('img-webp', 'IMAGE_TO_WEBP', 'IMG', 'WEBP', 'Formato moderno para la web'),
  c('img-bmp', 'IMAGE_TO_BMP', 'IMG', 'BMP', 'Mapa de bits sin compresión'),
]
const PDF_CONVS = [
  c('pdf-img', 'PDF_TO_IMAGE', 'PDF', 'IMG', 'Cada página como imagen'),
  c('pdf-txt', 'PDF_TO_TXT', 'PDF', 'TXT', 'Extrae el texto del documento'),
  c('pdf-word', 'PDF_TO_WORD', 'PDF', 'WORD', 'Documento editable, con su formato'),
  c('pdf-excel', 'PDF_TO_EXCEL', 'PDF', 'EXCEL', 'Tablas a una hoja de cálculo'),
]
const OFFICE_CONVS = [
  c('word-pdf', 'WORD_TO_PDF', 'WORD', 'PDF', 'Documento .docx a PDF'),
  c('excel-pdf', 'EXCEL_TO_PDF', 'EXCEL', 'PDF', 'Hojas de cálculo .xlsx a PDF'),
]
const APP_ONLY = [
  c('', 'PPT_TO_PDF', 'PPT', 'PDF', ''),
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
      <HeroCard title="Convertidor" subtitle="Convierte tus documentos fácilmente, sin salir del navegador." />
      <h2 className="section-title">¿Qué quieres convertir?</h2>
      {[
        { title: 'Imagen', cls: 'ico-violet', icon: 'image' as const, list: IMAGE_CONVS },
        { title: 'PDF', cls: 'ico-red', icon: 'pdf' as const, list: PDF_CONVS },
        { title: 'Word y Excel', cls: 'ico-blue', icon: 'file' as const, list: OFFICE_CONVS },
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
                  <b>{x.from === 'IMG' ? 'Imagen' : x.from} → {x.to === 'IMG' ? 'Imagen' : x.to}</b>
                  <small>{x.desc}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <section className="conv-group">
        <h3>
          <span className="ico ico-blue"><Icon name="phone" /></span>
          En la app Android
        </h3>
        <div className="card">
          <div className="row" style={{ gap: 14 }}>
            {APP_ONLY.map((x) => <Pair key={x.type} conv={x} />)}
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            PowerPoint a PDF se convierte en la app, junto con el resto de las 17 combinaciones.
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
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pdfImgFormat, setPdfImgFormat] = useState<'png' | 'jpg'>('png')
  const [text, setText] = useState<string | null>(null)
  const [wordInfo, setWordInfo] = useState<{ paragraphs: number; tables: number; images: number; headings: number } | null>(null)
  const [excelInfo, setExcelInfo] = useState<{ sheets: number; rows: number; numbers: number } | null>(null)
  const [officeInfo, setOfficeInfo] = useState<{ skippedImages: number } | null>(null)
  const isOffice = conv.id === 'word-pdf' || conv.id === 'excel-pdf'
  const [sheetMode, setSheetMode] = useState<'pages' | 'single'>('pages')
  /** El resultado, para verlo y guardarlo (ya no se descarga solo). */
  const [out, setOut] = useState<{ result: File | null; results?: File[]; saveAs?: File | null } | null>(null)
  useEffect(() => setOut(null), [files, pdfImgFormat, sheetMode])

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
        const images = blobs.map((b, i) => resultFile(b, `${name}-pagina-${i + 1}.${pdfImgFormat}`, pdfImgFormat === 'jpg' ? 'image/jpeg' : 'image/png'))
        setOut({ result: null, results: images, saveAs: await bundleFiles(images, `${name}-imagenes.zip`) })
      } else if (conv.id === 'pdf-word') {
        const [{ extractForWord }, { buildDocument, writeDocx, summarize }] = await Promise.all([import('../lib/pdfWordSources'), import('../lib/pdfWord')])
        const ex = await extractForWord(files[0], (d, t) => setProgress(d / t))
        if (!ex.texts.length) {
          setError('No se encontró texto: parece un PDF escaneado. Pásalo primero por "OCR: reconocer texto" (con "PDF buscable") y convierte ese PDF.')
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        const doc = buildDocument(ex.pages, ex.texts, ex.images)
        setOut({ result: resultFile(writeDocx(doc), `${baseName(files[0].name)}.docx`, DOCX) })
        setWordInfo(summarize(doc))
      } else if (conv.id === 'pdf-excel') {
        const [{ extractForWord }, { buildSheets, writeXlsx, summarizeSheets }] = await Promise.all([import('../lib/pdfWordSources'), import('../lib/pdfExcel')])
        const ex = await extractForWord(files[0], (d, t) => setProgress(d / t), { images: false })
        if (!ex.texts.length) {
          setError('No se encontró texto: parece un PDF escaneado. Pásalo primero por "OCR: reconocer texto" (con "PDF buscable") y convierte ese PDF.')
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
          setError('No se encontró texto: parece un PDF escaneado. Usa la herramienta "OCR: reconocer texto" en Herramientas PDF.')
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        setOut({ result: resultFile(new Blob([t], { type: 'text/plain;charset=utf-8' }), `${baseName(files[0].name)}.txt`, 'text/plain;charset=utf-8') })
      }
      track('conversion_success', { conversion_type: conv.type, file_size_kb: totalKb })
      toast('Listo. Revisa el resultado y guárdalo.')
    } catch (e) {
      setError(e instanceof OfficeFormatError || (e instanceof Error && /^El (documento|libro) no tiene/.test(e.message)) ? e.message : errorMessage(e))
      track('conversion_error', { conversion_type: conv.type, error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  const title = `${conv.from === 'IMG' ? 'Imagen' : conv.from} → ${conv.to === 'IMG' ? 'Imagen' : conv.to}`
  return (
    <>
      {!embedded && (
        <>
          <HeroCard title="Convertidor" subtitle="Convierte tus documentos fácilmente, sin salir del navegador." />
          <BackButton label="Volver al convertidor" onClick={() => go('convertir')} />
        </>
      )}
      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 24 }}>{title}</h3>
          <Pair conv={conv} />
        </div>
        <p className="muted">{conv.desc}</p>
        <DropZone
          accept={isImageInput ? 'image/*' : conv.id === 'word-pdf' ? '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : conv.id === 'excel-pdf' ? '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'}
          multiple={isImageInput}
          title={isImageInput ? 'Toca para seleccionar imágenes' : conv.id === 'word-pdf' ? 'Toca para seleccionar un documento de Word (.docx)' : conv.id === 'excel-pdf' ? 'Toca para seleccionar un libro de Excel (.xlsx)' : 'Toca para seleccionar un PDF'}
          hint="O arrastra los archivos aquí"
          onFiles={(f) => {
            setFiles((prev) => (isImageInput ? [...prev, ...f] : f))
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
                        <button type="button" className="icon-btn" aria-label="Subir" disabled={i === 0} onClick={() => setFiles((p) => swap(p, i, i - 1))}>
                          <Icon name="up" />
                        </button>
                        <button type="button" className="icon-btn" aria-label="Bajar" disabled={i === files.length - 1} onClick={() => setFiles((p) => swap(p, i, i + 1))}>
                          <Icon name="downArrow" />
                        </button>
                      </>
                    )}
                    <button type="button" className="icon-btn" aria-label={`Quitar ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
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
            <span className="faint">Formato</span>
            <Segmented label="Formato de imagen" value={pdfImgFormat} onChange={setPdfImgFormat} options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }]} />
          </div>
        )}
        {busy && progress > 0 && <Progress value={progress} />}
        {error && <Notice kind="error">{error}</Notice>}
        {conv.id === 'pdf-word' && !wordInfo && !error && (
          <small className="faint">Un PDF no guarda párrafos ni tablas: DocuSmart los reconstruye. Funciona mejor con PDF creados desde Word o un programa similar; los escaneados necesitan OCR primero.</small>
        )}
        {conv.id === 'pdf-excel' && (
          <div className="field">
            <span>Hojas</span>
            <Segmented label="Hojas" value={sheetMode} onChange={setSheetMode} options={[{ value: 'pages', label: 'Una por página' }, { value: 'single', label: 'Todo en una hoja' }]} />
            {!excelInfo && !error && <small className="faint">Funciona mejor con tablas de PDF digitales (extractos, facturas, reportes). Los números quedan como números para poder sumarlos.</small>}
          </div>
        )}
        {isOffice && !officeInfo && !error && (
          <small className="faint">El PDF conserva el contenido y la estructura (títulos, negritas, listas, tablas e imágenes); las fuentes y el diseño exacto pueden variar un poco.</small>
        )}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!files.length} onClick={run} icon="convert">
            Convertir
          </BusyButton>
        </div>
        {files.length > 0 && (
          <BeforeAfter
            original={isImageInput && files.length > 1 ? undefined : files[0]}
            originals={isImageInput && files.length > 1 ? files : undefined}
            result={out?.result ?? null}
            results={out?.results}
            saveAs={out?.saveAs}
            toolName={conv.id || conv.type}
            title={resultTitle(conv.to)}
            previewTitle={files.length > 1 ? 'Tus archivos' : 'Vista previa de tu archivo'}
            placeholder={busy ? 'Convirtiendo…' : `Aquí verás el resultado en ${conv.to === 'IMG' ? 'imagen' : conv.to}`}
            summary={
              officeInfo ? (
                officeInfo.skippedImages ? (
                  <Notice kind="info">{officeInfo.skippedImages === 1 ? 'Una imagen usa' : `${officeInfo.skippedImages} imágenes usan`} un formato que no se pudo incluir (por ejemplo EMF o GIF).</Notice>
                ) : undefined
              ) : excelInfo ? (
                <Notice kind="success">
                  {excelInfo.rows} filas en {excelInfo.sheets} {excelInfo.sheets === 1 ? 'hoja' : 'hojas'}, con {excelInfo.numbers} {excelInfo.numbers === 1 ? 'número' : 'números'}. La vista es aproximada; revisa las columnas al abrirlo en Excel.
                </Notice>
              ) : wordInfo ? (
                <Notice kind="success">
                  {wordInfo.paragraphs} párrafos{wordInfo.headings ? `, ${wordInfo.headings} ${wordInfo.headings === 1 ? 'título' : 'títulos'}` : ''}{wordInfo.tables ? `, ${wordInfo.tables} ${wordInfo.tables === 1 ? 'tabla' : 'tablas'}` : ''}{wordInfo.images ? `, ${wordInfo.images} ${wordInfo.images === 1 ? 'imagen' : 'imágenes'}` : ''}. La vista es aproximada; el diseño puede variar un poco en Word.
                </Notice>
              ) : out?.saveAs && out.results && out.results.length > 1 ? (
                <Notice kind="success">{out.results.length} archivos. Se guardan juntos en un ZIP.</Notice>
              ) : undefined
            }
          />
        )}
      </div>
      {text && text.trim() && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <h3>Texto extraído</h3>
            <button type="button" className="btn btn-soft btn-sm" onClick={() => navigator.clipboard.writeText(text).then(() => toast('Texto copiado'))}>
              <Icon name="copy" /> Copiar
            </button>
          </div>
          <pre className="text-view">{text}</pre>
        </div>
      )}
    </>
  )
}

const PDF = 'application/pdf'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** Título del resultado según el formato de destino. */
function resultTitle(to: string): string {
  if (to === 'PDF') return 'Así quedó tu PDF'
  if (to === 'WORD') return 'Así quedó tu documento de Word'
  if (to === 'EXCEL') return 'Así quedó tu hoja de Excel'
  if (to === 'TXT') return 'Este es el texto de tu PDF'
  return 'Así quedaron tus imágenes'
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const copy = arr.slice()
  ;[copy[a], copy[b]] = [copy[b], copy[a]]
  return copy
}
