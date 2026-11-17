// Vista previa de documentos: antes y después lado a lado, opciones para guardar el
// resultado e invitación a recomendar DocuSmart.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Notice } from './ui'
import { download, formatBytes, isOwnBlobUrl, safeMimeType } from '../lib/files'
import { PLAY_URL, SITE_URL, appShareLinks, toolShareUrl, canShareFile, docSummary, feedbackMailto, shareFile } from '../lib/share'
import { PageNav, usePdfPreview } from '../screens/PdfPreview'
import { useApp } from '../state'
import { track } from '../../shared/analytics'

type PreviewProps = { source: Blob; page: number; label: string; onPages?: (n: number) => void; password?: string }

/**
 * Un documento (PDF o imagen) con su etiqueta, número de páginas, peso y la página
 * `page` dibujada. La página la controla quien lo usa (así dos vistas avanzan juntas).
 */
export function DocPreview(props: PreviewProps) {
  return props.source.type.startsWith('image/') ? <ImagePreview {...props} /> : <PdfPreview {...props} />
}

/** Una imagen: una sola "página". */
function ImagePreview({ source, page, label, onPages }: PreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    // Se re-empaqueta con un tipo de imagen y se comprueba que la URL sea del propio sitio.
    const u = URL.createObjectURL(new Blob([source], { type: safeMimeType(source.type).startsWith('image/') ? source.type : 'image/png' }))
    setUrl(isOwnBlobUrl(u) ? u : null)
    onPages?.(1)
    return () => URL.revokeObjectURL(u)
  }, [source, onPages])
  return (
    <figure className="doc-preview">
      <figcaption className="doc-preview-meta">
        <b>{label}</b>
        <span className="faint">{docSummary(1, source.size, formatBytes)}</span>
      </figcaption>
      <div className="doc-preview-stage">
        {page > 1 ? <span className="faint">Este documento tiene 1 página.</span> : url ? <img src={url} alt={label} /> : <span className="spinner" aria-label="Cargando vista previa" />}
      </div>
    </figure>
  )
}

function PdfPreview({ source, page, label, onPages, password }: PreviewProps) {
  const { pages, pageNo, setPageNo, preview, error } = usePdfPreview(source, 640, page, password)
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

type CloudState = { kind: 'drive' | 'dropbox'; status: 'busy' | 'done'; text?: string; link?: string } | null

/** Descargar, compartir con la hoja del sistema y guardar en Google Drive o Dropbox. */
export function SaveOptions({ file, toolName }: { file: File; toolName: string }) {
  const { toast } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [cloud, setCloud] = useState<CloudState>(null)
  const [enabled, setEnabled] = useState({ drive: false, dropbox: false })
  const abort = useRef<AbortController | null>(null)
  const cloudMod = useRef<typeof import('../lib/cloudPopup') | null>(null)
  const shareable = canShareFile(file)

  useEffect(() => {
    let alive = true
    void import('../lib/cloudPopup').then((m) => {
      cloudMod.current = m
      if (alive) setEnabled({ drive: m.driveEnabled(), dropbox: m.dropboxEnabled() })
    })
    return () => {
      alive = false
      abort.current?.abort()
    }
  }, [])
  // Otro resultado: se olvida lo guardado antes.
  useEffect(() => setCloud(null), [file])

  const save = () => {
    download(file, file.name, file.type)
    track('result_saved', { tool_name: toolName, method: 'download' })
    toast('El archivo se descargó.')
  }
  const share = async () => {
    setError(null)
    try {
      const r = await shareFile(file)
      if (r === 'shared') track('result_saved', { tool_name: toolName, method: 'share' })
    } catch {
      setError('No se pudo compartir el archivo. Descárgalo y envíalo desde tu dispositivo.')
    }
  }
  const toCloud = async (kind: 'drive' | 'dropbox') => {
    const m = cloudMod.current
    if (!m) return
    setError(null)
    abort.current?.abort()
    abort.current = new AbortController()
    setCloud({ kind, status: 'busy' })
    // El módulo ya está cargado: la ventana de autorización se abre dentro del clic
    // (si hubiera una espera antes, el navegador la bloquearía).
    try {
      if (kind === 'drive') {
        const r = await m.saveToDrive(file, abort.current.signal)
        setCloud({ kind, status: 'done', text: `Guardado en tu Google Drive como "${r.name}".`, link: r.link })
      } else {
        const r = await m.saveToDropbox(file, abort.current.signal)
        setCloud({ kind, status: 'done', text: `Guardado en tu Dropbox, en Aplicaciones › DocuSmart${r.path}.`, link: 'https://www.dropbox.com/home' })
      }
      track('result_saved', { tool_name: toolName, method: kind })
    } catch (e) {
      setCloud(null)
      if (e instanceof m.CloudCancelled) return
      setError(e instanceof Error && /^(No se|El navegador|La autorización)/.test(e.message) ? e.message : `No se pudo guardar en ${kind === 'drive' ? 'Google Drive' : 'Dropbox'}.`)
    }
  }
  const busy = cloud?.status === 'busy'

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="save-options">
        <button type="button" className="btn btn-primary save-main" onClick={save}>
          <Icon name="download" />
          Descargar
        </button>
        {shareable && (
          <button type="button" className="btn btn-outline" onClick={() => void share()}>
            <Icon name="share" />
            Compartir
          </button>
        )}
        {enabled.drive && (
          <button type="button" className="btn btn-outline" disabled={busy} aria-busy={busy && cloud?.kind === 'drive'} onClick={() => void toCloud('drive')}>
            {busy && cloud?.kind === 'drive' ? <span className="spinner" aria-hidden="true" /> : <Icon name="cloud" />}
            Google Drive
          </button>
        )}
        {enabled.dropbox && (
          <button type="button" className="btn btn-outline" disabled={busy} aria-busy={busy && cloud?.kind === 'dropbox'} onClick={() => void toCloud('dropbox')}>
            {busy && cloud?.kind === 'dropbox' ? <span className="spinner" aria-hidden="true" /> : <Icon name="cloud" />}
            Dropbox
          </button>
        )}
      </div>
      {busy && (
        <small className="faint">
          Autoriza a DocuSmart en la ventana que se abrió. Solo podrá ver los archivos que guarde ahí.{' '}
          <button type="button" className="link-btn" onClick={() => abort.current?.abort()}>Cancelar</button>
        </small>
      )}
      {cloud?.status === 'done' && (
        <Notice kind="success">
          {cloud.text}{' '}
          {cloud.link && (
            <a href={cloud.link} target="_blank" rel="noopener noreferrer">
              Abrir
            </a>
          )}
        </Notice>
      )}
      {shareable && !busy && <small className="faint">Con "Compartir" puedes enviarlo por WhatsApp, correo u otras apps de tu dispositivo.</small>}
      {error && <Notice kind="error">{error}</Notice>}
    </div>
  )
}

/** Al final de cada herramienta: invitar a recomendar y calificar DocuSmart. */
export function ShareApp({ url = SITE_URL, toolName }: { url?: string; toolName: string }) {
  const { toast } = useApp()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Enlace copiado.')
      track('app_shared', { tool_name: toolName, channel: 'copy' })
    } catch {
      toast('No se pudo copiar el enlace.')
    }
  }
  return (
    <aside className="share-app" aria-label="Recomienda DocuSmart">
      <p className="share-app-title">¿Te sirvió? ¡Ayúdanos a que más personas conozcan DocuSmart!</p>
      <p className="faint" style={{ margin: 0 }}>Compártelo con quien trabaje con documentos: es gratis y los archivos nunca salen de su dispositivo.</p>
      <div className="share-app-links">
        {appShareLinks(url).map((l) => (
          <a key={l.id} className="btn btn-outline btn-sm" href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => track('app_shared', { tool_name: toolName, channel: l.id })}>
            {l.label}
          </a>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => void copy()}>
          <Icon name="link" />
          Copiar enlace
        </button>
      </div>
      <div className="share-app-links">
        <a className="btn btn-soft btn-sm" href={PLAY_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('app_shared', { tool_name: toolName, channel: 'play_rating' })}>
          <Icon name="star" />
          Califica la app en Google Play
        </a>
        <a className="btn btn-soft btn-sm" href={feedbackMailto(toolName)} onClick={() => track('app_shared', { tool_name: toolName, channel: 'feedback' })}>
          <Icon name="mail" />
          Envíanos tu opinión
        </a>
      </div>
    </aside>
  )
}

/** Miniaturas de varios archivos (los PDF de Unir, las páginas separadas, las imágenes extraídas). */
function FileTiles({ files, label, max = 12 }: { files: File[]; label: string; max?: number }) {
  const total = files.reduce((n, f) => n + f.size, 0)
  return (
    <figure className="doc-preview">
      <figcaption className="doc-preview-meta">
        <b>{label}</b>
        <span className="faint">
          {files.length === 1 ? '1 archivo' : `${files.length} archivos`} · {formatBytes(total)}
        </span>
      </figcaption>
      <div className="doc-preview-stage file-tiles-stage">
        <ul className="file-tiles">
          {files.slice(0, max).map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <FileThumb file={f} />
              <span title={f.name}>{f.name}</span>
            </li>
          ))}
        </ul>
        {files.length > max && <small className="faint">y {files.length - max} más</small>}
      </div>
    </figure>
  )
}

function FileThumb({ file }: { file: File }) {
  return file.type.startsWith('image/') ? <ImageThumb file={file} /> : <PdfThumb file={file} />
}

function ImageThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const u = URL.createObjectURL(new Blob([file], { type: safeMimeType(file.type).startsWith('image/') ? file.type : 'image/png' }))
    setUrl(isOwnBlobUrl(u) ? u : null)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url ? <img src={url} alt="" loading="lazy" /> : <span className="spinner" aria-hidden="true" />
}

function PdfThumb({ file }: { file: File }) {
  const { preview, error } = usePdfPreview(file, 220)
  if (error) return <span className="faint">PDF</span>
  return preview ? <img src={preview.url} alt="" /> : <span className="spinner" aria-hidden="true" />
}

/**
 * El archivo del usuario ("Antes") y, cuando la herramienta termina, el resultado
 * ("Después") al lado, en la misma fila. Un solo control de páginas mueve los dos.
 * Debajo, el resumen, las opciones para guardar y la invitación a recomendar la app.
 *
 * Con varios archivos: `originals` (entradas, p. ej. Unir) o `results` (salidas,
 * p. ej. páginas separadas) se muestran como miniaturas, y `saveAs` es lo que se
 * guarda (un ZIP, un informe…). Si no se indica, se guarda `result`.
 */
export function BeforeAfter({
  original,
  originals,
  result,
  results,
  saveAs,
  labels = ['Antes', 'Después'],
  summary,
  toolName,
  title,
  previewTitle = 'Vista previa de tu documento',
  placeholder = 'Aquí verás el resultado',
  shareUrl,
  resultPassword,
  originalPassword,
}: {
  original?: Blob
  originals?: File[]
  result: File | null
  results?: File[]
  saveAs?: File | null
  labels?: [string, string]
  summary?: ReactNode
  toolName: string
  /** Título con el resultado, propio de la herramienta ("Así quedó tu PDF comprimido"). */
  title: string
  previewTitle?: string
  placeholder?: string
  /** Página de la herramienta, para recomendarla. */
  shareUrl?: string
  /** Contraseña del resultado (Proteger PDF), para poder mostrarlo. */
  resultPassword?: string
  /** Contraseña del original (Desbloquear PDF). */
  originalPassword?: string
}) {
  const [page, setPage] = useState(1)
  const [pagesBefore, setPagesBefore] = useState(0)
  const [pagesAfter, setPagesAfter] = useState(0)
  const ref = useRef<HTMLElement>(null)
  const done = !!(result || results?.length)
  const toSave = saveAs === undefined ? result : saveAs

  // Otro archivo: vuelve a la primera página.
  useEffect(() => {
    setPage(1)
    setPagesBefore(0)
  }, [original, originals])
  useEffect(() => {
    if (!done) {
      setPagesAfter(0)
      return
    }
    // Al aparecer el resultado, la comparación se lleva a la vista.
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [done, result, results])

  // El control de páginas solo cuenta las vistas de un solo documento.
  const navPages = Math.max(originals ? 0 : pagesBefore, results ? 0 : pagesAfter)

  return (
    <section ref={ref} className="compare-panel stack" aria-label={done ? title : previewTitle}>
      <div className="compare-head">
        <h3>{done ? title : previewTitle}</h3>
        <PageNav pageNo={page} pages={navPages} onChange={setPage} />
      </div>
      <div className="before-after">
        {originals ? (
          <FileTiles files={originals} label={labels[0]} />
        ) : original ? (
          <DocPreview source={original} page={page} label={labels[0]} onPages={setPagesBefore} password={originalPassword} />
        ) : null}
        {results?.length ? (
          <FileTiles files={results} label={labels[1]} />
        ) : result ? (
          <DocPreview source={result} page={page} label={labels[1]} onPages={setPagesAfter} password={resultPassword} />
        ) : (
          <figure className="doc-preview">
            <figcaption className="doc-preview-meta">
              <b>{labels[1]}</b>
            </figcaption>
            <div className="doc-preview-stage doc-placeholder">
              <span className="faint">{placeholder}</span>
            </div>
          </figure>
        )}
      </div>
      {done && summary}
      {done && toSave && <SaveOptions file={toSave} toolName={toolName} />}
      {done && <ShareApp url={shareUrl ?? toolShareUrl(toolName)} toolName={toolName} />}
    </section>
  )
}
