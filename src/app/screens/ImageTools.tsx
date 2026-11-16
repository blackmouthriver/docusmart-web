// Herramientas de imagen: comprimir, redimensionar, recortar y rotar, en el navegador.
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { go, useApp } from '../state'
import { Icon, type IconName } from '../components/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented, errorMessage } from '../components/ui'
import { download, downloadMany, formatBytes } from '../lib/files'
import {
  ASPECTS,
  IDENTITY,
  capSize,
  centeredCrop,
  cropPixels,
  fitSize,
  isIdentity,
  marginsToRect,
  outputMime,
  outputName,
  planCompression,
  rectToMargins,
  rotateBy,
  rotatedSize,
  savedPercent,
  type AspectName,
  type CompressLevel,
  type CropRect,
  type ResizeSpec,
  type Transform,
} from '../lib/imageTools'
import type { Margins } from '../lib/pdfCrop'
import { track } from '../../shared/analytics'
import { CropStage } from './CropTool'

const TOOLS: Array<{ id: string; name: string; desc: string; icon: IconName; cls: string }> = [
  { id: 'comprimir', name: 'Comprimir imagen', desc: 'Reduce el peso de JPG, PNG y WebP', icon: 'compress', cls: 'ico-green' },
  { id: 'redimensionar', name: 'Redimensionar', desc: 'Cambia el tamaño en pixeles o en %', icon: 'resize', cls: 'ico-blue' },
  { id: 'recortar', name: 'Recortar imagen', desc: 'Libre o en 1:1, 4:3, 16:9…', icon: 'crop', cls: 'ico-amber' },
  { id: 'rotar', name: 'Rotar y voltear', desc: 'Gira 90° o refleja como en un espejo', icon: 'rotate', cls: 'ico-violet' },
]

export const IMAGE_TOOLS: Record<string, ComponentType> = {
  comprimir: CompressImageTool,
  redimensionar: ResizeImageTool,
  recortar: CropImageTool,
  rotar: RotateImageTool,
}

export function ImageToolsScreen({ sub }: { sub?: string }) {
  const tool = TOOLS.find((t) => t.id === sub)
  const Tool = tool ? IMAGE_TOOLS[tool.id] : undefined
  return (
    <>
      <HeroCard title="Herramientas de imagen" subtitle="Comprime, redimensiona, recorta y gira fotos sin subirlas a ningún servidor." />
      {tool && Tool ? (
        <>
          <BackButton label="Volver a herramientas de imagen" onClick={() => go('imagen')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{tool.name}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{tool.desc}</p>
          <Tool />
        </>
      ) : (
        <>
          <h2 className="section-title">Elige una herramienta</h2>
          <div className="tool-grid">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" className="tool-card" onClick={() => go('imagen', t.id)}>
                <span className={'ico ' + t.cls}><Icon name={t.icon} /></span>
                <span>
                  <b>{t.name}</b>
                  <small>{t.desc}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

/* ───────────── Base para procesar varias imágenes ───────────── */

type Result = { name: string; blob: Blob; before: number; width: number; height: number; error?: undefined } | { name: string; error: string }
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif'
const PRIVACY = 'Se quitan los datos ocultos de la foto (EXIF), como la ubicación GPS.'

function useBatch(toolName: string) {
  const { toast } = useApp()
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<Result[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const run = async (process: (f: File) => Promise<Omit<Extract<Result, { blob: Blob }>, 'before'>>) => {
    setBusy(true)
    setResults(null)
    setProgress(0)
    const out: Result[] = []
    for (let i = 0; i < files.length; i++) {
      try {
        out.push({ ...(await process(files[i])), before: files[i].size })
      } catch (e) {
        out.push({ name: files[i].name, error: e instanceof Error && e.message.startsWith('No se pudo abrir') ? e.message : errorMessage(e) })
      }
      setProgress((i + 1) / files.length)
    }
    setResults(out)
    setBusy(false)
    const ok = out.filter((r) => !r.error).length
    track('image_tool_used', { tool_name: toolName, files: files.length, ok })
    if (ok) toast(ok === 1 ? 'Imagen lista.' : `${ok} imágenes listas.`)
  }

  const picker = (multiple = true) => (
    <>
      <DropZone accept={ACCEPT} multiple={multiple} title={multiple ? 'Toca para elegir una o varias imágenes' : 'Toca para elegir una imagen'} hint="JPG, PNG, WebP, GIF o BMP" onFiles={(f) => { setFiles((p) => (multiple ? [...p, ...f] : f)); setResults(null) }} />
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <FileRow key={f.name + i} file={f} actions={<button type="button" className="icon-btn" aria-label={`Quitar ${f.name}`} disabled={busy} onClick={() => { setFiles((p) => p.filter((_, j) => j !== i)); setResults(null) }}><Icon name="close" /></button>} />
          ))}
        </ul>
      )}
    </>
  )

  return { files, setFiles, results, setResults, busy, progress, run, picker }
}

function Results({ results, zipName, showSavings }: { results: Result[]; zipName: string; showSavings?: boolean }) {
  const ok = results.filter((r): r is Extract<Result, { blob: Blob }> => !r.error)
  const totalBefore = ok.reduce((s, r) => s + r.before, 0)
  const totalAfter = ok.reduce((s, r) => s + r.blob.size, 0)
  return (
    <div className="card stack" aria-live="polite">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{ok.length === 1 ? '1 imagen lista' : `${ok.length} imágenes listas`}</h3>
        {ok.length > 0 && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadMany(ok.map((r) => ({ name: r.name, data: r.blob })), zipName)}>
            <Icon name="download" /> {ok.length > 1 ? 'Descargar todo (ZIP)' : 'Descargar'}
          </button>
        )}
      </div>
      {showSavings && ok.length > 0 && (
        <p className="muted" style={{ margin: 0 }}>
          De {formatBytes(totalBefore)} a <b>{formatBytes(totalAfter)}</b> ({savedPercent(totalBefore, totalAfter)} % menos).
        </p>
      )}
      <ul className="file-list" style={{ marginTop: 0 }}>
        {results.map((r, i) => (
          <li key={r.name + i} className="file-row img-result">
            {r.error !== undefined ? (
              <>
                <span className="img-result-name">{r.name}</span>
                <small style={{ color: 'var(--danger)' }}>{r.error}</small>
              </>
            ) : (
              <>
                <ResultThumb blob={r.blob} />
                <span className="img-result-info">
                  <b>{r.name}</b>
                  <small className="faint">
                    {r.width}×{r.height} px · {showSavings ? `${formatBytes(r.before)} → ${formatBytes(r.blob.size)} (${savedPercent(r.before, r.blob.size)} %)` : formatBytes(r.blob.size)}
                  </small>
                </span>
                <button type="button" className="icon-btn" aria-label={`Descargar ${r.name}`} onClick={() => download(r.blob, r.name, r.blob.type)}>
                  <Icon name="download" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResultThumb({ blob }: { blob: Blob }) {
  const url = useObjectUrl(blob)
  return url ? <img className="img-result-thumb" src={url} alt="" /> : null
}

function useObjectUrl(blob: Blob | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) return setUrl(null)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="card stack">{children}</div>
}

/* ───────────── Comprimir ───────────── */

function CompressImageTool() {
  const b = useBatch('compress')
  const [level, setLevel] = useState<CompressLevel>('media')
  const run = () =>
    b.run(async (file) => {
      const { loadImage, hasAlpha, renderImage } = await import('../lib/imageCanvas')
      const img = await loadImage(file)
      try {
        const plan = planCompression(level, hasAlpha(img.bmp))
        const size = capSize(img.width, img.height, plan.maxSide)
        const blob = await renderImage(img, { ...size, mime: plan.mime, quality: plan.quality })
        // Si no se gana nada, se devuelve la original.
        if (blob.size >= file.size) return { name: outputName(file.name, 'optimizada', outputMime(file.type)), blob: file, width: img.width, height: img.height }
        return { name: outputName(file.name, 'comprimida', plan.mime), blob, ...size }
      } finally {
        img.bmp.close()
      }
    })
  return (
    <div className="stack">
      <Panel>
        {b.picker()}
        <div className="field">
          <span>Nivel de compresión</span>
          <Segmented label="Nivel" value={level} onChange={(v) => { setLevel(v); b.setResults(null) }} options={[{ value: 'baja', label: 'Baja' }, { value: 'media', label: 'Recomendada' }, { value: 'alta', label: 'Máxima' }]} />
          <small className="faint">
            {level === 'baja' ? 'Casi sin diferencia visible; conserva el tamaño original.' : level === 'media' ? 'Buen equilibrio: hasta 2560 px de lado, ideal para enviar o publicar.' : 'Lo más liviano: hasta 1600 px de lado, para correo o WhatsApp.'}
          </small>
        </div>
        <small className="faint">Las fotos se guardan como JPG; las que tienen transparencia, como WebP. {PRIVACY}</small>
        {b.busy && <Progress value={b.progress} />}
        <div className="row row-end">
          <BusyButton busy={b.busy} disabled={!b.files.length} onClick={run} icon="compress">
            {b.files.length > 1 ? `Comprimir ${b.files.length} imágenes` : 'Comprimir'}
          </BusyButton>
        </div>
      </Panel>
      {b.results && <Results results={b.results} zipName="imagenes-comprimidas.zip" showSavings />}
    </div>
  )
}

/* ───────────── Redimensionar ───────────── */

function ResizeImageTool() {
  const b = useBatch('resize')
  const [mode, setMode] = useState<'percent' | 'pixels'>('percent')
  const [percent, setPercent] = useState(50)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [keepRatio, setKeepRatio] = useState(true)
  const spec: ResizeSpec = mode === 'percent' ? { mode, percent } : { mode, width: Number(width) || null, height: Number(height) || null, keepRatio }
  const valid = mode === 'percent' || !!(Number(width) || Number(height))
  const run = () =>
    b.run(async (file) => {
      const { loadImage, renderImage } = await import('../lib/imageCanvas')
      const img = await loadImage(file)
      try {
        const size = fitSize(img.width, img.height, spec)
        const mime = outputMime(file.type)
        return { name: outputName(file.name, `${size.width}x${size.height}`, mime), blob: await renderImage(img, { ...size, mime, quality: 0.92 }), ...size }
      } finally {
        img.bmp.close()
      }
    })
  return (
    <div className="stack">
      <Panel>
        {b.picker()}
        <Segmented label="Cómo redimensionar" value={mode} onChange={(v) => { setMode(v); b.setResults(null) }} options={[{ value: 'percent', label: 'Por porcentaje' }, { value: 'pixels', label: 'Por pixeles' }]} />
        {mode === 'percent' ? (
          <label className="field">
            <span>Tamaño: {percent} %</span>
            <input type="range" min={5} max={200} step={5} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
          </label>
        ) : (
          <>
            <div className="row">
              <label className="field" style={{ flex: 1, minWidth: 120 }}>
                <span>Ancho (px)</span>
                <input className="input" type="number" min={1} max={16384} inputMode="numeric" value={width} placeholder="Ej. 1080" onChange={(e) => setWidth(e.target.value)} />
              </label>
              <label className="field" style={{ flex: 1, minWidth: 120 }}>
                <span>Alto (px)</span>
                <input className="input" type="number" min={1} max={16384} inputMode="numeric" value={height} placeholder={keepRatio ? 'Automático' : 'Ej. 1080'} onChange={(e) => setHeight(e.target.value)} />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
              <span>Conservar la proporción (si escribes los dos lados, la imagen cabe dentro de ese tamaño)</span>
            </label>
          </>
        )}
        <small className="faint">Se conserva el formato (JPG, PNG o WebP; los demás salen como PNG). {PRIVACY}</small>
        {b.busy && <Progress value={b.progress} />}
        <div className="row row-end">
          <BusyButton busy={b.busy} disabled={!b.files.length || !valid} onClick={run} icon="resize">
            {b.files.length > 1 ? `Redimensionar ${b.files.length} imágenes` : 'Redimensionar'}
          </BusyButton>
        </div>
      </Panel>
      {b.results && <Results results={b.results} zipName="imagenes-redimensionadas.zip" />}
    </div>
  )
}

/* ───────────── Rotar y voltear ───────────── */

function RotateImageTool() {
  const b = useBatch('rotate')
  const [t, setT] = useState<Transform>(IDENTITY)
  const first = useObjectUrl(b.files[0] ?? null)
  // Actualización funcional: dos clics seguidos (girar y voltear) no se pisan.
  const change = (fn: (t: Transform) => Transform) => {
    setT(fn)
    b.setResults(null)
  }
  const run = () =>
    b.run(async (file) => {
      const { loadImage, renderImage } = await import('../lib/imageCanvas')
      const img = await loadImage(file)
      try {
        const mime = outputMime(file.type)
        return { name: outputName(file.name, 'girada', mime), blob: await renderImage(img, { transform: t, mime, quality: 0.92 }), ...rotatedSize(img.width, img.height, t) }
      } finally {
        img.bmp.close()
      }
    })
  const css = `rotate(${t.rotate}deg) scale(${t.flipH ? -1 : 1}, ${t.flipV ? -1 : 1})`
  return (
    <div className="stack">
      <Panel>
        {b.picker()}
        {first && (
          <div className="rotate-preview">
            <img src={first} alt="Vista previa" style={{ transform: css }} />
          </div>
        )}
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => change((p) => rotateBy(p, -90))}><span className="icon-mirror"><Icon name="rotate" /></span> Izquierda</button>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => change((p) => rotateBy(p, 90))}><Icon name="rotate" /> Derecha</button>
          <button type="button" className="btn btn-soft btn-sm" aria-pressed={t.flipH} onClick={() => change((p) => ({ ...p, flipH: !p.flipH }))}><Icon name="flip" /> Espejo</button>
          <button type="button" className="btn btn-soft btn-sm" aria-pressed={t.flipV} onClick={() => change((p) => ({ ...p, flipV: !p.flipV }))}><span className="icon-turn"><Icon name="flip" /></span> Vertical</button>
        </div>
        {b.files.length > 1 && <small className="faint" style={{ textAlign: 'center' }}>El mismo giro se aplica a las {b.files.length} imágenes.</small>}
        <small className="faint">{PRIVACY}</small>
        {b.busy && <Progress value={b.progress} />}
        <div className="row row-end">
          <BusyButton busy={b.busy} disabled={!b.files.length || isIdentity(t)} onClick={run} icon="download">
            {isIdentity(t) ? 'Elige un giro' : 'Aplicar y guardar'}
          </BusyButton>
        </div>
      </Panel>
      {b.results && <Results results={b.results} zipName="imagenes-giradas.zip" />}
    </div>
  )
}

/* ───────────── Recortar ───────────── */

function CropImageTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const url = useObjectUrl(file)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const [aspect, setAspect] = useState<AspectName>('libre')
  const [margins, setMargins] = useState<Margins>({ top: 0, right: 0, bottom: 0, left: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDims(null)
    setError(null)
    if (!file) return
    let cancelled = false
    void import('../lib/imageCanvas').then(async ({ loadImage }) => {
      try {
        const img = await loadImage(file)
        img.bmp.close()
        if (!cancelled) {
          setDims({ width: img.width, height: img.height })
          setMargins(rectToMargins(centeredCrop(img.width, img.height, ASPECTS[aspect])))
        }
      } catch (e) {
        if (!cancelled) setError(errorMessage(e))
      }
    })
    return () => {
      cancelled = true
    }
    // El recuadro inicial depende del archivo; al cambiar la proporción se recalcula en pickAspect.
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  const pickAspect = (a: AspectName) => {
    setAspect(a)
    if (dims) setMargins(rectToMargins(centeredCrop(dims.width, dims.height, ASPECTS[a])))
  }

  /** Con proporción fija, el alto sigue al ancho (y si no cabe, al revés). */
  const onChange = (m: Margins) => {
    const ratio = ASPECTS[aspect]
    if (!ratio || !dims) return setMargins(m)
    const r: CropRect = marginsToRect(m)
    let h = (r.w * dims.width) / ratio / dims.height
    let w = r.w
    if (r.y + h > 1) {
      h = 1 - r.y
      w = (h * dims.height * ratio) / dims.width
    }
    setMargins(rectToMargins({ x: r.x, y: r.y, w, h }))
  }

  const px = useMemo(() => (dims ? cropPixels(dims.width, dims.height, marginsToRect(margins)) : null), [dims, margins])

  const save = async () => {
    if (!file || !px) return
    setBusy(true)
    setError(null)
    try {
      const { loadImage, renderImage } = await import('../lib/imageCanvas')
      const img = await loadImage(file)
      const mime = outputMime(file.type)
      const blob = await renderImage(img, { crop: px, mime, quality: 0.92 })
      img.bmp.close()
      download(blob, outputName(file.name, 'recortada', mime), mime)
      track('image_tool_used', { tool_name: 'crop', files: 1, ok: 1 })
      toast('Listo. La imagen se descargó.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      {!file ? (
        <DropZone accept={ACCEPT} title="Toca para elegir una imagen" hint="JPG, PNG, WebP, GIF o BMP" onFiles={([f]) => setFile(f)} />
      ) : (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow file={file} extra={dims ? `${dims.width}×${dims.height} px` : 'Leyendo…'} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>Cambiar</button>} />
        </ul>
      )}
      {url && dims && (
        <>
          <div className="aspect-chips" role="radiogroup" aria-label="Proporción">
            {(Object.keys(ASPECTS) as AspectName[]).map((a) => (
              <button key={a} type="button" role="radio" aria-checked={aspect === a} className="edit-tool" onClick={() => pickAspect(a)}>
                {a === 'libre' ? 'Libre' : a}
              </button>
            ))}
          </div>
          <CropStage url={url} margins={margins} onChange={onChange} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="faint">Resultado: {px?.width} × {px?.height} px</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => pickAspect(aspect)}><Icon name="reset" /> Restablecer</button>
          </div>
          <small className="faint">{PRIVACY}</small>
        </>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!px} onClick={save} icon="download">
          Recortar y descargar
        </BusyButton>
      </div>
    </Panel>
  )
}
