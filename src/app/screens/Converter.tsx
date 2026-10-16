import { useState } from 'react'
import { go, useApp } from '../state'
import { Icon } from '../components/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented, errorMessage } from '../components/ui'
import { baseName, download, downloadMany } from '../lib/files'
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
]
const APP_ONLY = [
  c('', 'PDF_TO_WORD', 'PDF', 'WORD', ''),
  c('', 'WORD_TO_PDF', 'WORD', 'PDF', ''),
  c('', 'EXCEL_TO_PDF', 'EXCEL', 'PDF', ''),
  c('', 'PPT_TO_PDF', 'PPT', 'PDF', ''),
]
const ALL = [...IMAGE_CONVS, ...PDF_CONVS]

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
            Word, Excel y PowerPoint se convierten en la app, junto con el resto de las 17 combinaciones.
          </p>
        </div>
      </section>
    </>
  )
}

function ConvertJob({ conv }: { conv: Conv }) {
  const { toast } = useApp()
  const isImageInput = conv.from === 'IMG'
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pdfImgFormat, setPdfImgFormat] = useState<'png' | 'jpg'>('png')
  const [text, setText] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    setProgress(0)
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
      } else if (conv.id === 'pdf-txt') {
        const t = await pdfToText(await files[0].arrayBuffer())
        setText(t)
        if (!t.trim()) {
          setError('No se encontró texto. Si es un PDF escaneado, usa el OCR de la app.')
          track('conversion_error', { conversion_type: conv.type, error_message: 'empty_text' })
          return
        }
        download(new Blob([t], { type: 'text/plain;charset=utf-8' }), `${baseName(files[0].name)}.txt`)
      }
      track('conversion_success', { conversion_type: conv.type, file_size_kb: totalKb })
      toast('Listo. El archivo se descargó.')
    } catch (e) {
      setError(errorMessage(e))
      track('conversion_error', { conversion_type: conv.type, error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  const title = `${conv.from === 'IMG' ? 'Imagen' : conv.from} → ${conv.to === 'IMG' ? 'Imagen' : conv.to}`
  return (
    <>
      <HeroCard title="Convertidor" subtitle="Convierte tus documentos fácilmente, sin salir del navegador." />
      <BackButton label="Volver al convertidor" onClick={() => go('convertir')} />
      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 24 }}>{title}</h3>
          <Pair conv={conv} />
        </div>
        <p className="muted">{conv.desc}</p>
        <DropZone
          accept={isImageInput ? 'image/*' : 'application/pdf'}
          multiple={isImageInput}
          title={isImageInput ? 'Toca para seleccionar imágenes' : 'Toca para seleccionar un PDF'}
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
