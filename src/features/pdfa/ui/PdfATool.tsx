// PDF a PDF/A-2b, 1b o 3b (W-147.7): formato de archivo a largo plazo, todo en el navegador.
import { useState } from 'react'
import { useApp } from '../../../app/state'
import { BusyButton, DropZone, FileRow, Notice, Segmented } from '../../../shared/ui/ui'
import { baseName } from '../../../shared/files/files'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { resultFile } from '../../../shared/files/share'
import type { PdfAPart, PdfAReport, RasterReason } from '../core/pdfA'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'

const PDF = 'application/pdf'

const list = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')}${tr('pdfa.and')}${items.at(-1)}`)

const reason = (r: RasterReason, many: boolean) => tr(`pdfa.reason.${r}.${many ? 'many' : 'one'}` as MessageKey)

/** Lo que cambió, en palabras simples. */
export function describeReport(r: PdfAReport): string[] {
  const out: string[] = []
  if (r.fonts.length) out.push(tr('pdfa.fonts', { list: list([...new Set(r.fonts.map((f) => f.split('-')[0]))]) }))
  if (r.formAppearances) out.push(tr('pdfa.formAp'))
  const removed = [
    r.removed.actions && (r.removed.actions === 1 ? tr('pdfa.actionOne') : tr('pdfa.actionsN', { n: r.removed.actions })),
    r.removed.attachments && (r.removed.attachments === 1 ? tr('pdfa.attachOne') : tr('pdfa.attachN', { n: r.removed.attachments })),
    r.removed.annotations && (r.removed.annotations === 1 ? tr('pdfa.annotOne') : tr('pdfa.annotN', { n: r.removed.annotations })),
  ].filter(Boolean) as string[]
  if (removed.length) out.push(tr('pdfa.removed', { list: list(removed) }))
  if (r.attachments) out.push(r.attachments === 1 ? tr('pdfa.attachKeptOne') : tr('pdfa.attachKeptN', { n: r.attachments }))
  if (r.layers) out.push(tr('pdfa.layers'))
  for (const why of ['cmyk', 'font', 'transparency', 'other'] as RasterReason[]) {
    const pages = r.rasterPages.filter((p) => p.reason === why).map((p) => String(p.page))
    if (!pages.length) continue
    out.push(pages.length === 1 ? tr('pdfa.pageRaster', { page: pages[0], reason: reason(why, false) }) : tr('pdfa.pagesRaster', { pages: list(pages), reason: reason(why, true) }))
  }
  return out
}

export function PdfATool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<PdfAReport | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  /** Versión de la norma (W-147.7): 2b por defecto. */
  const [part, setPart] = useState<PdfAPart>(2)
  /** La versión con la que se hizo el resultado que se muestra. */
  const [donePart, setDonePart] = useState<PdfAPart>(2)

  const pick = (f: File | null) => {
    setFile(f)
    setReport(null)
    setOutput(null)
    setError(null)
  }

  const convert = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setReport(null)
    setOutput(null)
    let pdfDoc: Awaited<ReturnType<typeof import('../../../shared/pdf/pdf').openPdf>> | null = null
    try {
      const [{ convertToPdfA, PdfAEncryptedError }, pdf, raster] = await Promise.all([import('../core/pdfA'), import('../../../shared/pdf/pdf'), import('../../pdf/infra/pdfRedactSources')])
      const bytes = new Uint8Array(await file.arrayBuffer())
      try {
        const { pdf: out, report: r } = await convertToPdfA(bytes, {
          part,
          loadFont: async (name) => {
            const res = await fetch(`/pdfjs/standard_fonts/${name}`)
            if (!res.ok) throw new Error(tr('pdfa.fontError'))
            return new Uint8Array(await res.arrayBuffer())
          },
          // Solo se abre con pdf.js si alguna página hay que pasarla a imagen.
          rasterize: async (index) => {
            pdfDoc ??= await pdf.openPdf(bytes.slice())
            return raster.makeRasterizer(pdfDoc)(index, [])
          },
        })
        setOutput(resultFile(out, `${baseName(file.name)}-${part === 2 ? 'pdfa' : `pdfa-${part}b`}.pdf`, PDF))
        setDonePart(part)
        setReport(r)
        track('pdf_tool_used', { tool_name: 'pdfa', format: `${part}b` })
        toast(tr('common.doneReview'))
      } catch (e) {
        if (e instanceof PdfAEncryptedError) throw e
        throw new Error(tr('pdfa.convertError'), { cause: e })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('pdfa.convertError'))
      track('app_error', { error_context: 'pdf_tool_pdfa', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      if (pdfDoc) await (await import('../../../shared/pdf/pdf')).closePdf(pdfDoc)
      setBusy(false)
    }
  }

  return (
    <div className="card stack">
      {file ? (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow file={file} actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => pick(null)}>{tr('common.change')}</button>} />
        </ul>
      ) : (
        <DropZone accept={PDF} title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => pick(f)} />
      )}
      {file && (
        <div className="field">
          <span aria-hidden="true">{tr('pdfa.version')}</span>
          <Segmented
            label={tr('pdfa.version')}
            value={String(part) as '1' | '2' | '3'}
            onChange={(v) => {
              setPart(Number(v) as PdfAPart)
              setReport(null)
              setOutput(null)
            }}
            options={[
              { value: '2', label: 'PDF/A-2b' },
              { value: '1', label: 'PDF/A-1b' },
              { value: '3', label: 'PDF/A-3b' },
            ]}
          />
          <small className="faint">{tr(`pdfa.hint.${part}` as MessageKey)}</small>
        </div>
      )}
      {file && (
        <BeforeAfter
          original={file}
          result={report ? output : null}
          toolName="pdfa"
          title={tr('pdfa.title')}
          previewTitle={tr('common.previewPdf')}
          placeholder={busy ? tr('pdfa.busy') : tr('pdfa.placeholder')}
          summary={
            report && <Notice kind="success">
              <strong>{tr('pdfa.done', { version: `PDF/A-${donePart}b` })}</strong>
              {describeReport(report).map((line) => (
                <span key={line} style={{ display: 'block', marginTop: 6 }}>{line}</span>
              ))}
            </Notice>
          }
        />
      )}
      {!report && !error && (
        <small className="faint">
          {tr('pdfa.intro')}
        </small>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!file} onClick={convert} icon="archive">
          {tr('pdfa.go')}
        </BusyButton>
      </div>
    </div>
  )
}
