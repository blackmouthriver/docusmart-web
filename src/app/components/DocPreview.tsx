// Vista previa de documentos: antes y después lado a lado, y opciones para guardar el resultado.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Notice } from './ui'
import { download, formatBytes } from '../lib/files'
import { canShareFile, docSummary, shareFile } from '../lib/share'
import { PageNav, usePdfPreview } from '../screens/PdfPreview'
import { useApp } from '../state'
import { track } from '../../shared/analytics'

/**
 * Un PDF con su etiqueta, número de páginas, peso y la página `page` dibujada.
 * La página la controla quien lo usa (así dos vistas avanzan juntas).
 */
export function DocPreview({ source, page, label, onPages }: { source: Blob; page: number; label: string; onPages?: (n: number) => void }) {
  const { pages, pageNo, setPageNo, preview, error } = usePdfPreview(source, 640, page)
  useEffect(() => {
    if (pages) onPages?.(pages)
  }, [pages, onPages])
  useEffect(() => {
    if (pages) setPageNo(Math.min(Math.max(1, page), pages))
  }, [page, pages, setPageNo])
  const missing = pages > 0 && page > pages
  return (
    <figure className="doc-preview">
      <figcaption className="doc-preview-meta">
        <b>{label}</b>
        <span className="faint">{docSummary(pages, source.size, formatBytes)}</span>
      </figcaption>
      <div className="doc-preview-stage" aria-busy={!preview && !error}>
        {error ? (
          <Notice kind="error">{error}</Notice>
        ) : missing ? (
          <span className="faint">Este documento tiene {pages === 1 ? '1 página' : `${pages} páginas`}.</span>
        ) : preview ? (
          <img src={preview.url} alt={`${label}: página ${pageNo} de ${pages}`} />
        ) : (
          <span className="spinner" aria-label="Cargando vista previa" />
        )}
      </div>
    </figure>
  )
}

/** Descargar o compartir (WhatsApp, Drive, correo… con la hoja del sistema). */
export function SaveOptions({ file, toolName }: { file: File; toolName: string }) {
  const { toast } = useApp()
  const [shareError, setShareError] = useState<string | null>(null)
  const shareable = canShareFile(file)

  const save = () => {
    download(file, file.name, file.type)
    track('result_saved', { tool_name: toolName, method: 'download' })
    toast('El archivo se descargó.')
  }
  const share = async () => {
    setShareError(null)
    try {
      const r = await shareFile(file)
      if (r === 'shared') track('result_saved', { tool_name: toolName, method: 'share' })
    } catch {
      setShareError('No se pudo compartir el archivo. Descárgalo y envíalo desde tu dispositivo.')
    }
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="save-options">
        <button type="button" className="btn btn-primary" onClick={save}>
          <Icon name="download" />
          Descargar
        </button>
        {shareable && (
          <button type="button" className="btn btn-outline" onClick={() => void share()}>
            <Icon name="share" />
            Compartir
          </button>
        )}
      </div>
      {shareable && <small className="faint">Con "Compartir" puedes enviarlo por WhatsApp o guardarlo en Google Drive, Dropbox o tu correo.</small>}
      {shareError && <Notice kind="error">{shareError}</Notice>}
    </div>
  )
}

/**
 * El archivo del usuario ("Antes") y, cuando la herramienta termina, el resultado
 * ("Después") al lado, en la misma fila. Un solo control de páginas mueve los dos.
 * Debajo, el resumen y las opciones para guardar.
 */
export function BeforeAfter({
  original,
  result,
  summary,
  toolName,
  placeholder = 'Aquí verás el resultado',
}: {
  original: Blob
  result: File | null
  summary?: ReactNode
  toolName: string
  placeholder?: string
}) {
  const [page, setPage] = useState(1)
  const [pagesBefore, setPagesBefore] = useState(0)
  const [pagesAfter, setPagesAfter] = useState(0)
  const ref = useRef<HTMLElement>(null)

  // Otro archivo: vuelve a la primera página.
  useEffect(() => {
    setPage(1)
    setPagesBefore(0)
  }, [original])
  useEffect(() => {
    if (!result) {
      setPagesAfter(0)
      return
    }
    // Al aparecer el resultado, la comparación se lleva a la vista.
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [result])

  return (
    <section ref={ref} className="compare-panel stack" aria-label="Antes y después">
      <div className="row" style={{ justifyContent: 'space-between', minHeight: 36 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>{result ? 'Antes y después' : 'Vista previa'}</h3>
        <PageNav pageNo={page} pages={Math.max(pagesBefore, pagesAfter)} onChange={setPage} />
      </div>
      <div className="before-after">
        <DocPreview source={original} page={page} label="Antes" onPages={setPagesBefore} />
        {result ? (
          <DocPreview source={result} page={page} label="Después" onPages={setPagesAfter} />
        ) : (
          <figure className="doc-preview">
            <figcaption className="doc-preview-meta">
              <b>Después</b>
            </figcaption>
            <div className="doc-preview-stage doc-placeholder">
              <span className="faint">{placeholder}</span>
            </div>
          </figure>
        )}
      </div>
      {result && summary}
      {result && <SaveOptions file={result} toolName={toolName} />}
    </section>
  )
}
