// Vista previa de documentos: antes y después lado a lado, opciones para guardar el
// resultado e invitación a recomendar DocuSmart.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Notice } from './ui'
import { baseName, download, extensionOf, formatBytes, isOwnBlobUrl, renamed, safeMimeType } from '../files/files'
import { PLAY_URL, appShareLinks, toolShareUrl, canShareFile, docSummary, feedbackMailto, shareFile } from '../files/share'
import { tr } from '../i18n/translate'
import { useT } from '../i18n/I18n'
import { PageNav, usePdfPreview } from '../../features/pdf/ui/PdfPreview'
import { isDocx, isXlsx } from '../../features/convert/infra/officeRender'
import { useApp } from '../../app/state'
import { track } from '../platform/analytics'

type PreviewProps = { source: Blob; page: number; label: string; onPages?: (n: number) => void; password?: string }
type PdfProps = PreviewProps & { /** Peso a mostrar (el del archivo de Office, no el del PDF de muestra). */ displaySize?: number; note?: string }

/**
 * Un documento (PDF o imagen) con su etiqueta, número de páginas, peso y la página
 * `page` dibujada. La página la controla quien lo usa (así dos vistas avanzan juntas).
 */
export function DocPreview(props: PreviewProps) {
  const s = props.source as Blob & { name?: string }
  if (isViewableImage(s.type)) return <ImagePreview {...props} />
  if (s.type.startsWith('text/plain')) return <TextPreview {...props} />
  if (isDocx(s) || isXlsx(s)) return <OfficePreview {...props} />
  if (isPdfLike(s)) return <PdfPreview {...props} />
  return <GenericPreview {...props} />
}

/** Imágenes que el navegador puede mostrar (HEIC, TIFF y SVG se muestran como archivo). */
const isViewableImage = (type: string) => type.startsWith('image/') && !/^image\/(hei[cf]|tiff|svg)/i.test(type)

/** PDF por tipo o extensión (un Blob sin tipo ni nombre se trata como PDF). */
const isPdfLike = (f: Blob & { name?: string }) => f.type === 'application/pdf' || !!f.name?.toLowerCase().endsWith('.pdf') || (!f.type && !f.name)
const extOf = (f: Blob & { name?: string }) => (f.name?.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? 'archivo').toUpperCase()

/** Cualquier otro archivo (ZIP, 7Z…): su tipo, nombre y peso. */
function GenericPreview({ source, label, onPages }: PreviewProps) {
  const s = source as Blob & { name?: string }
  useEffect(() => onPages?.(1), [onPages])
  return (
    <figure className="doc-preview">
      <figcaption className="doc-preview-meta">
        <b>{label}</b>
        <span className="faint">{extOf(s)} · {formatBytes(source.size)}</span>
      </figcaption>
      <div className="doc-preview-stage">
        <div className="generic-file">
          <span className="generic-ext">{extOf(s)}</span>
          {s.name && <span className="faint" title={s.name}>{s.name}</span>}
        </div>
      </div>
    </figure>
  )
}

/** Un texto: las primeras líneas. */
function TextPreview({ source, label, onPages }: PreviewProps) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void source.slice(0, 20_000).text().then((t) => alive && setText(t))
    onPages?.(1)
    return () => {
      alive = false
    }
  }, [source, onPages])
  const lines = text ? text.split('\n').length : 0
  return (
    <figure className="doc-preview">
      <figcaption className="doc-preview-meta">
        <b>{label}</b>
        <span className="faint">
          {source.size > 20_000 ? tr('dp.text') : lines === 1 ? tr('dp.line') : tr('dp.lines', { n: lines })} · {formatBytes(source.size)}
        </span>
      </figcaption>
      <div className="doc-preview-stage text-preview-stage">
        {text === null ? <span className="spinner" aria-label={tr('dp.loading')} /> : <pre className="text-view">{text}{source.size > 20_000 ? '\n…' : ''}</pre>}
      </div>
    </figure>
  )
}

/** Word o Excel: se diagrama a PDF para mostrar sus páginas (vista aproximada). */
function OfficePreview(props: PreviewProps) {
  const { source, label } = props
  const [pdf, setPdf] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    setPdf(null)
    setError(null)
    void import('../../features/convert/infra/officeRender')
      .then(async (m) => (isDocx(source) ? (await m.docxToPdf(source, label)).pdf : await m.xlsxToPdf(source, label)))
      .then((bytes) => alive && setPdf(new Blob([bytes as BlobPart], { type: 'application/pdf' })))
      .catch(() => alive && setError(tr('dp.noPreview')))
    return () => {
      alive = false
    }
  }, [source, label])
  if (pdf) return <PdfPreview {...props} source={pdf} displaySize={source.size} note={tr('dp.approx')} />
  return (
    <figure className="doc-preview">
      <figcaption className="doc-preview-meta">
        <b>{label}</b>
        <span className="faint">{formatBytes(source.size)}</span>
      </figcaption>
      <div className="doc-preview-stage">{error ? <span className="faint">{error}</span> : <span className="spinner" aria-label={tr('dp.preparing')} />}</div>
    </figure>
  )
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
        <span className="faint">{tr('dp.image')} · {formatBytes(source.size)}</span>
      </figcaption>
      <div className="doc-preview-stage">
        {page > 1 ? <span className="faint">{tr('dp.docHas', { pages: tr('dp.page') })}</span> : url ? <img src={url} alt={label} /> : <span className="spinner" aria-label={tr('dp.loading')} />}
      </div>
    </figure>
  )
}

function PdfPreview({ source, page, label, onPages, password, displaySize, note }: PdfProps) {
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
        <span className="faint">
          {docSummary(pages, displaySize ?? source.size, formatBytes)}
          {note ? ` · ${note}` : ''}
        </span>
      </figcaption>
      <div className="doc-preview-stage" aria-busy={!preview && !error}>
        {error ? (
          <Notice kind="error">{error}</Notice>
        ) : missing ? (
          <span className="faint">{tr('dp.docHas', { pages: pages === 1 ? tr('dp.page') : tr('dp.pages', { n: pages }) })}</span>
        ) : preview ? (
          <img src={preview.url} alt={tr('dp.pageAlt', { label, n: pageNo, total: pages })} />
        ) : (
          <span className="spinner" aria-label={tr('dp.loading')} />
        )}
      </div>
    </figure>
  )
}

type CloudState = { kind: 'drive' | 'dropbox'; status: 'busy' | 'done'; text?: string; link?: string } | null

/** Descargar, compartir con la hoja del sistema y guardar en Google Drive o Dropbox. */
export function SaveOptions({ file: original, toolName }: { file: File; toolName: string }) {
  const { toast } = useApp()
  // El usuario puede cambiar el nombre antes de descargar, compartir o guardar en la nube.
  const [base, setBase] = useState(() => baseName(original.name))
  useEffect(() => setBase(baseName(original.name)), [original])
  const file = useMemo(() => renamed(original, base), [original, base])
  const ext = extensionOf(original.name)
  const [error, setError] = useState<string | null>(null)
  const [cloud, setCloud] = useState<CloudState>(null)
  const [enabled, setEnabled] = useState({ drive: false, dropbox: false })
  const abort = useRef<AbortController | null>(null)
  const cloudMod = useRef<typeof import('../cloud/cloudPopup') | null>(null)
  const shareable = canShareFile(file)

  useEffect(() => {
    let alive = true
    void import('../cloud/cloudPopup').then((m) => {
      cloudMod.current = m
      if (alive) setEnabled({ drive: m.driveEnabled(), dropbox: m.dropboxEnabled() })
    })
    return () => {
      alive = false
      abort.current?.abort()
    }
  }, [])
  // Otro resultado u otro nombre: se olvida lo guardado antes.
  useEffect(() => setCloud(null), [file])

  const save = () => {
    download(file, file.name, file.type)
    track('result_saved', { tool_name: toolName, method: 'download' })
    toast(tr('save.downloaded'))
  }
  const share = async () => {
    setError(null)
    try {
      const r = await shareFile(file)
      if (r === 'shared') track('result_saved', { tool_name: toolName, method: 'share' })
    } catch {
      setError(tr('save.shareError'))
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
        setCloud({ kind, status: 'done', text: tr('save.driveDone', { name: r.name }), link: r.link })
      } else {
        const r = await m.saveToDropbox(file, abort.current.signal)
        setCloud({ kind, status: 'done', text: tr('save.dropboxDone', { name: r.path.split('/').pop() || file.name }), link: 'https://www.dropbox.com/home' })
      }
      track('result_saved', { tool_name: toolName, method: kind })
    } catch (e) {
      setCloud(null)
      if (e instanceof m.CloudCancelled) return
      const name = e instanceof Error ? e.name : ''
      setError(name === 'PopupBlockedError' ? tr('save.popupBlocked') : name === 'CloudAuthError' ? tr('save.authExpired') : tr('save.cloudError', { service: kind === 'drive' ? 'Google Drive' : 'Dropbox' }))
    }
  }
  const busy = cloud?.status === 'busy'

  return (
    <div className="stack" style={{ gap: 10 }}>
      <label className="field save-name">
        <span>{tr('save.nameLabel')}</span>
        <span className="save-name-row">
          <input
            className="input"
            value={base}
            maxLength={120}
            spellCheck={false}
            autoComplete="off"
            enterKeyHint="done"
            aria-describedby={ext ? 'save-name-ext' : undefined}
            onChange={(e) => setBase(e.target.value)}
            onBlur={() => setBase(baseName(file.name))}
          />
          {ext && (
            <span className="save-name-ext" id="save-name-ext">
              {ext}
            </span>
          )}
        </span>
      </label>
      <div className="save-options">
        <button type="button" className="btn btn-primary save-main" onClick={save}>
          <Icon name="download" />
          {tr('save.download')}
        </button>
        {shareable && (
          <button type="button" className="btn btn-outline" onClick={() => void share()}>
            <Icon name="share" />
            {tr('save.share')}
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
          {tr('save.authorize')}{' '}
          <button type="button" className="link-btn" onClick={() => abort.current?.abort()}>{tr('save.cancel')}</button>
        </small>
      )}
      {cloud?.status === 'done' && (
        <Notice kind="success">
          {cloud.text}{' '}
          {cloud.link && (
            <a href={cloud.link} target="_blank" rel="noopener noreferrer">
              {tr('save.open')}
            </a>
          )}
        </Notice>
      )}
      {shareable && !busy && <small className="faint">{tr('save.shareHint')}</small>}
      {error && <Notice kind="error">{error}</Notice>}
    </div>
  )
}

/** Al final de cada herramienta: invitar a recomendar y calificar DocuSmart. */
/** Invita a recomendar DocuSmart con el enlace a la página de la herramienta en el idioma del usuario. */
export function ShareApp({ toolName }: { toolName: string }) {
  const { toast } = useApp()
  const { lang } = useT()
  const url = toolShareUrl(toolName, lang)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast(tr('shareApp.copied'))
      track('app_shared', { tool_name: toolName, channel: 'copy' })
    } catch {
      toast(tr('shareApp.copyError'))
    }
  }
  return (
    <aside className="share-app" aria-label={tr('shareApp.aria')}>
      <p className="share-app-title">{tr('shareApp.title')}</p>
      <p className="faint" style={{ margin: 0 }}>{tr('shareApp.text')}</p>
      <div className="share-app-links">
        {appShareLinks(url, tr('shareApp.message')).map((l) => (
          <a key={l.id} className="btn btn-outline btn-sm" href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => track('app_shared', { tool_name: toolName, channel: l.id })}>
            {l.label}
          </a>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => void copy()}>
          <Icon name="link" />
          {tr('shareApp.copy')}
        </button>
      </div>
      <div className="share-app-links">
        <a className="btn btn-soft btn-sm" href={PLAY_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('app_shared', { tool_name: toolName, channel: 'play_rating' })}>
          <Icon name="star" />
          {tr('shareApp.rate')}
        </a>
        <a className="btn btn-soft btn-sm" href={feedbackMailto(toolName)} onClick={() => track('app_shared', { tool_name: toolName, channel: 'feedback' })}>
          <Icon name="mail" />
          {tr('shareApp.feedback')}
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
          {files.length === 1 ? tr('dp.file') : tr('dp.files', { n: files.length })} · {formatBytes(total)}
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
        {files.length > max && <small className="faint">{tr('dp.more', { n: files.length - max })}</small>}
      </div>
    </figure>
  )
}

function FileThumb({ file }: { file: File }) {
  if (isViewableImage(file.type)) return <ImageThumb file={file} />
  if (isPdfLike(file)) return <PdfThumb file={file} />
  return <span className="generic-ext generic-ext-sm">{extOf(file)}</span>
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
  labels = [tr('dp.before'), tr('dp.after')],
  summary,
  toolName,
  title,
  previewTitle = tr('dp.previewTitle'),
  placeholder = tr('dp.placeholder'),
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
      {done && <ShareApp toolName={toolName} />}
    </section>
  )
}
