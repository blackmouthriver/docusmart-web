import { useState } from 'react'
import { go, useApp } from '../state'
import { Icon } from '../components/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented, errorMessage } from '../components/ui'
import { baseName, download, downloadMany } from '../lib/files'
import { convertImage, imagesToPdf, pdfToImages, pdfToText, type ImageTarget } from '../lib/convert'
import { track } from '../../shared/analytics'
import type { MNode, SheetData } from '../lib/officeModels'

/** Archivo de Office en un formato antiguo (.doc, .xls) que no se puede leer. */
class OfficeFormatError extends Error {
  constructor(app: 'Word' | 'Excel') {
    super(app === 'Word' ? 'Solo se pueden convertir documentos .docx. Si tienes un .doc antiguo, ábrelo en Word y guárdalo como .docx.' : 'Solo se pueden convertir libros .xlsx. Si tienes un .xls antiguo, ábrelo en Excel y guárdalo como .xlsx.')
    this.name = 'OfficeFormatError'
  }
}

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

  const run = async () => {
    setBusy(true)
    setError(null)
    setProgress(0)
    setWordInfo(null)
    setExcelInfo(null)
    setOfficeInfo(null)
    track('conversion_started', { conversion_type: conv.type })
    const totalKb = Math.round(files.reduce((s, f) => s + f.size, 0) / 1024)
    try {
      if (conv.id === 'img-pdf') {
        download(await imagesToPdf(files), `${baseName(files[0].name)}.pdf`, 'application/pdf')
      } else if (isImageInput) {
        const target = conv.to.toLowerCase() as ImageTarget
        const out = []
        for (let i = 0; i < files.length; i++) {
          out.push({ name: `${baseName(files[i].name)}.${target}`, data: await convertImage(files[i], target) })
          setProgress((i + 1) / files.length)
        }
        await downloadMany(out, `docusmart-${target}.zip`)
      } else if (conv.id === 'pdf-img') {
        const blobs = await pdfToImages(await files[0].arrayBuffer(), pdfImgFormat, 1600, (d, t) => setProgress(d / t))
        const name = baseName(files[0].name)
        await downloadMany(
          blobs.map((b, i) => ({ name: `${name}-pagina-${i + 1}.${pdfImgFormat}`, data: b })),
          `${name}-imagenes.zip`,
        )
      } else if (conv.id === 'pdf-word') {
        const [{ extractForWord }, { buildDocument, writeDocx, summarize }] = await Promise.all([import('../lib/pdfWordSources'), import('../lib/pdfWord')])
        const ex = await extractForWord(files[0], (d, t) => setProgress(d / t))
        if (!ex.texts.length) {
          setError('No se encontró texto: parece un PDF escaneado. Pásalo primero por "OCR: reconocer texto" (con "PDF buscable") y convierte ese PDF.')
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        const doc = buildDocument(ex.pages, ex.texts, ex.images)
        download(writeDocx(doc), `${baseName(files[0].name)}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
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
        download(writeXlsx(sheets), `${baseName(files[0].name)}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        setExcelInfo(summarizeSheets(sheets))
      } else if (conv.id === 'word-pdf') {
        const name = files[0].name.toLowerCase()
        if (!name.endsWith('.docx')) throw new OfficeFormatError('Word')
        const [{ default: mammoth }, { fromMammoth }, { layoutPdf }] = await Promise.all([import('mammoth'), import('../lib/officeModels'), import('../lib/officePdf')])
        // Se usa el árbol del documento que arma mammoth, no su HTML.
        let tree: MNode = { type: 'document' }
        await mammoth.convertToHtml({ arrayBuffer: await files[0].arrayBuffer() }, { transformDocument: (d: MNode) => (tree = d) } as never)
        const { blocks, skippedImages } = await fromMammoth(tree)
        if (!blocks.length) throw new Error('El documento no tiene contenido que convertir.')
        download(await layoutPdf(blocks, { title: baseName(files[0].name) }), `${baseName(files[0].name)}.pdf`, 'application/pdf')
        setOfficeInfo({ skippedImages })
      } else if (conv.id === 'excel-pdf') {
        if (!files[0].name.toLowerCase().endsWith('.xlsx')) throw new OfficeFormatError('Excel')
        const [{ default: readXlsxFile }, { fromSheets }, { layoutPdf }] = await Promise.all([import('read-excel-file/browser'), import('../lib/officeModels'), import('../lib/officePdf')])
        const sheets = (await readXlsxFile(files[0])) as unknown as SheetData[]
        const { blocks, maxColumns } = fromSheets(sheets)
        if (!blocks.length) throw new Error('El libro no tiene datos que convertir.')
        // Muchas columnas: página horizontal y letra más chica.
        const wide = maxColumns > 6
        download(await layoutPdf(blocks, { title: baseName(files[0].name), pageSize: wide ? [841.89, 595.28] : undefined, baseSize: maxColumns > 10 ? 7.5 : wide ? 9 : 10, margin: 40 }), `${baseName(files[0].name)}.pdf`, 'application/pdf')
        setOfficeInfo({ skippedImages: 0 })
      } else if (conv.id === 'pdf-txt') {
        const t = await pdfToText(await files[0].arrayBuffer())
        setText(t)
        if (!t.trim()) {
          setError('No se encontró texto: parece un PDF escaneado. Usa la herramienta "OCR: reconocer texto" en Herramientas PDF.')
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        download(new Blob([t], { type: 'text/plain;charset=utf-8' }), `${baseName(files[0].name)}.txt`)
      }
      track('conversion_success', { conversion_type: conv.type, file_size_kb: totalKb })
      toast('Listo. El archivo se descargó.')
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
        {officeInfo && (
          <Notice kind="success">
            Listo, el PDF se descargó.{officeInfo.skippedImages ? ` ${officeInfo.skippedImages === 1 ? 'Una imagen usa' : `${officeInfo.skippedImages} imágenes usan`} un formato que no se pudo incluir (por ejemplo EMF o GIF).` : ''}
          </Notice>
        )}
        {excelInfo && (
          <Notice kind="success">
            Listo: {excelInfo.rows} filas en {excelInfo.sheets} {excelInfo.sheets === 1 ? 'hoja' : 'hojas'}, con {excelInfo.numbers} {excelInfo.numbers === 1 ? 'número' : 'números'}. Revisa las columnas: dependen de cómo esté alineado el PDF.
          </Notice>
        )}
        {wordInfo && (
          <Notice kind="success">
            Listo: {wordInfo.paragraphs} párrafos{wordInfo.headings ? `, ${wordInfo.headings} ${wordInfo.headings === 1 ? 'título' : 'títulos'}` : ''}{wordInfo.tables ? `, ${wordInfo.tables} ${wordInfo.tables === 1 ? 'tabla' : 'tablas'}` : ''}{wordInfo.images ? `, ${wordInfo.images} ${wordInfo.images === 1 ? 'imagen' : 'imágenes'}` : ''}. Revisa el documento: el diseño puede variar un poco respecto del PDF.
          </Notice>
        )}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!files.length} onClick={run} icon="download">
            Convertir y descargar
          </BusyButton>
        </div>
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

function swap<T>(arr: T[], a: number, b: number): T[] {
  const copy = arr.slice()
  ;[copy[a], copy[b]] = [copy[b], copy[a]]
  return copy
}
