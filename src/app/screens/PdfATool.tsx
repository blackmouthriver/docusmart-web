// PDF a PDF/A-2b: formato de archivo a largo plazo, todo en el navegador.
import { useState } from 'react'
import { useApp } from '../state'
import { BusyButton, DropZone, FileRow, Notice } from '../components/ui'
import { baseName, download } from '../lib/files'
import type { PdfAReport, RasterReason } from '../lib/pdfA'
import { track } from '../../shared/analytics'

const PDF = 'application/pdf'

const list = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`)

const REASONS: Record<RasterReason, [string, string]> = {
  cmyk: ['usaba colores de imprenta (CMYK)', 'usaban colores de imprenta (CMYK)'],
  font: ['usaba fuentes que no venían dentro del archivo', 'usaban fuentes que no venían dentro del archivo'],
  other: ['tenía contenido que PDF/A no admite', 'tenían contenido que PDF/A no admite'],
}

/** Lo que cambió, en palabras simples. */
export function describeReport(r: PdfAReport): string[] {
  const out: string[] = []
  if (r.fonts.length) {
    const families = [...new Set(r.fonts.map((f) => f.split('-')[0]))]
    out.push(`Se incluyeron dentro del archivo las fuentes que faltaban (${list(families)}).`)
  }
  if (r.formAppearances) out.push('Se dibujó la apariencia de campos del formulario que no la tenían.')
  const removed = [
    r.removed.actions && `${r.removed.actions === 1 ? 'una acción o script' : `${r.removed.actions} acciones o scripts`}`,
    r.removed.attachments && `${r.removed.attachments === 1 ? 'un archivo adjunto' : `${r.removed.attachments} archivos adjuntos`}`,
    r.removed.annotations && `${r.removed.annotations === 1 ? 'una anotación' : `${r.removed.annotations} anotaciones`} que PDF/A no admite`,
  ].filter(Boolean) as string[]
  if (removed.length) out.push(`Se quitaron ${list(removed)}.`)
  for (const reason of ['cmyk', 'font', 'other'] as RasterReason[]) {
    const pages = r.rasterPages.filter((p) => p.reason === reason).map((p) => String(p.page))
    if (!pages.length) continue
    out.push(
      pages.length === 1
        ? `La página ${pages[0]} se guardó como imagen porque ${REASONS[reason][0]}: se ve igual, pero su texto ya no se puede seleccionar (puedes recuperarlo con "OCR: reconocer texto").`
        : `Las páginas ${list(pages)} se guardaron como imagen porque ${REASONS[reason][1]}: se ven igual, pero su texto ya no se puede seleccionar (puedes recuperarlo con "OCR: reconocer texto").`,
    )
  }
  return out
}

export function PdfATool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<PdfAReport | null>(null)

  const pick = (f: File | null) => {
    setFile(f)
    setReport(null)
    setError(null)
  }

  const convert = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setReport(null)
    let pdfDoc: Awaited<ReturnType<typeof import('../lib/pdf').openPdf>> | null = null
    try {
      const [{ convertToPdfA, PdfAEncryptedError }, pdf, raster] = await Promise.all([import('../lib/pdfA'), import('../lib/pdf'), import('../lib/pdfRedactSources')])
      const bytes = new Uint8Array(await file.arrayBuffer())
      try {
        const { pdf: out, report: r } = await convertToPdfA(bytes, {
          loadFont: async (name) => {
            const res = await fetch(`/pdfjs/standard_fonts/${name}`)
            if (!res.ok) throw new Error('No se pudo cargar una fuente.')
            return new Uint8Array(await res.arrayBuffer())
          },
          // Solo se abre con pdf.js si alguna página hay que pasarla a imagen.
          rasterize: async (index) => {
            pdfDoc ??= await pdf.openPdf(bytes.slice())
            return raster.makeRasterizer(pdfDoc)(index, [])
          },
        })
        download(out, `${baseName(file.name)}-pdfa.pdf`, PDF)
        setReport(r)
        track('pdf_tool_used', { tool_name: 'pdfa' })
        toast('Listo. El PDF/A se descargó.')
      } catch (e) {
        if (e instanceof PdfAEncryptedError) throw e
        throw new Error('No se pudo convertir el archivo. Revisa que sea un PDF válido.', { cause: e })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo convertir el archivo.')
      track('app_error', { error_context: 'pdf_tool_pdfa', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      if (pdfDoc) await (await import('../lib/pdf')).closePdf(pdfDoc)
      setBusy(false)
    }
  }

  return (
    <div className="card stack">
      {file ? (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => pick(null)}>Cambiar</button>} />
        </ul>
      ) : (
        <DropZone accept={PDF} title="Toca para seleccionar un PDF" hint="O arrástralo aquí" onFiles={([f]) => pick(f)} />
      )}
      {!report && !error && (
        <small className="faint">
          PDF/A es el formato para archivar documentos que piden entidades públicas, juzgados y universidades: lleva las fuentes y los colores dentro del archivo para que se vea igual dentro de muchos años. DocuSmart crea PDF/A-2b.
        </small>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      {report && (
        <Notice kind="success">
          <strong>Listo: el PDF cumple PDF/A-2b y se descargó.</strong>
          {describeReport(report).map((line) => (
            <span key={line} style={{ display: 'block', marginTop: 6 }}>{line}</span>
          ))}
        </Notice>
      )}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file} onClick={convert} icon="archive">
          Convertir a PDF/A
        </BusyButton>
      </div>
    </div>
  )
}
