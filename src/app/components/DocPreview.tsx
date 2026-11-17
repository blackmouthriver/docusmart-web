// Vista previa de un documento (páginas y peso), panel del resultado y opciones para guardarlo.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Notice, Segmented } from './ui'
import { download, formatBytes } from '../lib/files'
import { canShareFile, docSummary, shareFile, sizeChange } from '../lib/share'
import { PageNav, usePdfPreview } from '../screens/PdfPreview'
import { useApp } from '../state'
import { track } from '../../shared/analytics'

/** Un PDF con su número de páginas, su peso y la página actual dibujada. */
export function DocPreview({ source, initialPage = 1, onPage, label }: { source: Blob; initialPage?: number; onPage?: (n: number) => void; label?: string }) {
  const { pages, pageNo, setPageNo, preview, error } = usePdfPreview(source, 760, initialPage)
  const go = (n: number) => {
    setPageNo(n)
    onPage?.(n)
  }
  return (
    <div className="doc-preview">
      <div className="doc-preview-meta">
        <span className="faint">
          {label ? <b>{label} · </b> : null}
          {docSummary(pages, source.size, formatBytes)}
        </span>
        <PageNav pageNo={pageNo} pages={pages} onChange={go} />
      </div>
      <div className="doc-preview-stage" aria-busy={!preview && !error}>
        {error ? (
          <Notice kind="error">{error}</Notice>
        ) : preview ? (
          <img src={preview.url} alt={`Página ${pageNo} de ${pages}`} />
        ) : (
          <span className="spinner" aria-label="Cargando vista previa" />
        )}
      </div>
    </div>
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
 * Lo que produjo la herramienta: resumen, vista previa (con el original para
 * comparar en la misma página) y las opciones para guardarlo.
 */
export function ResultPanel({ result, original, summary, toolName }: { result: File; original?: Blob; summary?: ReactNode; toolName: string }) {
  const [view, setView] = useState<'result' | 'original'>('result')
  const [page, setPage] = useState(1)
  const change = original ? sizeChange(original.size, result.size) : null
  const ref = useRef<HTMLElement>(null)
  // Al aparecer, el resultado se lleva a la vista (en el celular queda debajo del botón).
  useEffect(() => {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [result])
  return (
    <section ref={ref} className="result-panel stack" aria-label="Resultado">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Resultado</h3>
        {original && (
          <Segmented
            label="Ver"
            value={view}
            onChange={setView}
            options={[
              { value: 'result', label: 'Resultado' },
              { value: 'original', label: 'Original' },
            ]}
          />
        )}
      </div>
      {summary ?? (original && change && <Notice kind="success">{formatBytes(original.size)} → <b>{formatBytes(result.size)}</b> ({change}).</Notice>)}
      <DocPreview key={view} source={view === 'result' ? result : original!} initialPage={page} onPage={setPage} label={view === 'result' ? 'Resultado' : 'Original'} />
      <SaveOptions file={result} toolName={toolName} />
    </section>
  )
}
