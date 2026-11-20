// Herramientas de imagen: comprimir, redimensionar, recortar, rotar, quitar fondo y foto tamaño documento, en el navegador.
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Progress, Segmented, errorMessage } from '../../../shared/ui/ui'
import { download, formatBytes, isOwnBlobUrl } from '../../../shared/files/files'
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { bundleFiles, resultFile } from '../../../shared/files/share'
import {
  ASPECTS,
  IDENTITY,
  capSize,
  centeredCrop,
  cropPixels,
  fitSize,
  isIdentity,
  lockAspect,
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
  type ResizeSpec,
  type Transform,
} from '../core/imageTools'
import { MODEL as BG_MODEL, backgroundOutputName, parseBackground } from '../core/background'
import { ID_MAX_MM, ID_MIN_MM, ID_PRESETS, formatMm, idPhotoName, idPixels, parseSizeMm, portraitCrop, sheetLayout, type IdPresetId, type IdSize } from '../core/idPhoto'
import type { Margins } from '../../pdf/core/pdfCrop'
import { track } from '../../../shared/platform/analytics'
import { CropStage } from '../../pdf/ui/CropTool'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'

const TOOLS: Array<{ id: string; name: MessageKey; desc: MessageKey; icon: IconName; cls: string }> = [
  { id: 'comprimir', name: 'imgt.compress', desc: 'imgt.compress.desc', icon: 'compress', cls: 'ico-green' },
  { id: 'redimensionar', name: 'imgt.resize', desc: 'imgt.resize.desc', icon: 'resize', cls: 'ico-blue' },
  { id: 'recortar', name: 'imgt.crop', desc: 'imgt.crop.desc', icon: 'crop', cls: 'ico-amber' },
  { id: 'rotar', name: 'imgt.rotate', desc: 'imgt.rotate.desc', icon: 'rotate', cls: 'ico-violet' },
  { id: 'fondo', name: 'imgt.removeBg', desc: 'imgt.removeBg.desc', icon: 'eraser', cls: 'ico-cyan' },
  { id: 'documento', name: 'imgt.idPhoto', desc: 'imgt.idPhoto.desc', icon: 'user', cls: 'ico-blue' },
]

// Conversiones de formato (W-119): viven en Convertir, pero también se ofrecen aquí.
const CONVERSIONS: Array<{ id: string; name: MessageKey; desc: MessageKey }> = [
  { id: 'img-jpg', name: 'conv.name.img-jpg', desc: 'conv.desc.imgJpg' },
  { id: 'img-png', name: 'conv.name.img-png', desc: 'conv.desc.imgPng' },
  { id: 'img-webp', name: 'conv.name.img-webp', desc: 'conv.desc.imgWebp' },
  { id: 'img-bmp', name: 'conv.name.img-bmp', desc: 'conv.desc.imgBmp' },
]

export const IMAGE_TOOLS: Record<string, ComponentType> = {
  comprimir: CompressImageTool,
  redimensionar: ResizeImageTool,
  recortar: CropImageTool,
  rotar: RotateImageTool,
  fondo: RemoveBackgroundTool,
  documento: IdPhotoTool,
}

export function ImageToolsScreen({ sub }: { sub?: string }) {
  const tool = TOOLS.find((t) => t.id === sub)
  const Tool = tool ? IMAGE_TOOLS[tool.id] : undefined
  return (
    <>
      <HeroCard title={tr('nav.image')} subtitle={tr('imgt.heroSub')} />
      {tool && Tool ? (
        <>
          <BackButton label={tr('imgt.back')} onClick={() => go('imagen')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{tr(tool.name)}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{tr(tool.desc)}</p>
          <Tool />
        </>
      ) : (
        <>
          <h2 className="section-title">{tr('pdf.choose')}</h2>
          <div className="tool-grid">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" className="tool-card" onClick={() => go('imagen', t.id)}>
                <span className={'ico ' + t.cls}><Icon name={t.icon} /></span>
                <span>
                  <b>{tr(t.name)}</b>
                  <small>{tr(t.desc)}</small>
                </span>
              </button>
            ))}
          </div>
          <h2 className="section-title">{tr('imgt.convertTitle')}</h2>
          <div className="tool-grid">
            {CONVERSIONS.map((c) => (
              <button key={c.id} type="button" className="tool-card" onClick={() => go('convertir', c.id)}>
                <span className="ico ico-violet"><Icon name="convert" /></span>
                <span>
                  <b>{tr(c.name)}</b>
                  <small>{tr(c.desc)}</small>
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
        out.push({ name: files[i].name, error: e instanceof Error && e.name === 'ImageOpenError' ? e.message : errorMessage(e) })
      }
      setProgress((i + 1) / files.length)
    }
    setResults(out)
    setBusy(false)
    const ok = out.filter((r) => !r.error).length
    track('image_tool_used', { tool_name: toolName, files: files.length, ok })
    if (ok) toast(ok === 1 ? tr('imgt.readyOne') : tr('imgt.readyMany', { n: ok }))
  }

  const picker = (multiple = true) => (
    <>
      <DropZone accept={ACCEPT} multiple={multiple} title={multiple ? tr('imgt.pickMany') : tr('imgt.pickOne')} hint={tr('imgt.formats')} onFiles={(f) => { setFiles((p) => (multiple ? [...p, ...f] : f)); setResults(null) }} />
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <FileRow key={f.name + i} file={f} actions={<button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} disabled={busy} onClick={() => { setFiles((p) => p.filter((_, j) => j !== i)); setResults(null) }}><Icon name="close" /></button>} />
          ))}
        </ul>
      )}
    </>
  )

  return { files, setFiles, results, setResults, busy, progress, run, picker }
}

/**
 * Antes y después de las imágenes: las elegidas a la izquierda y, al procesarlas,
 * el resultado al lado (en grande si es una, en miniaturas si son varias). Debajo,
 * el detalle de cada imagen y los errores.
 */
function Results({ files, results, zipName, showSavings, toolName, title, busy }: { files: File[]; results: Result[] | null; zipName: string; showSavings?: boolean; toolName: string; title: string; busy: boolean }) {
  const ok = (results ?? []).filter((r): r is Extract<Result, { blob: Blob }> => !r.error)
  const outFiles = useMemo(
    () => (results ?? []).flatMap((r) => (r.error === undefined ? [resultFile(r.blob, r.name, r.blob.type)] : [])),
    [results],
  )
  const [bundle, setBundle] = useState<File | null>(null)
  useEffect(() => {
    let alive = true
    setBundle(null)
    void bundleFiles(outFiles, zipName).then((b) => alive && setBundle(b))
    return () => {
      alive = false
    }
  }, [outFiles, zipName])
  const totalBefore = ok.reduce((s, r) => s + r.before, 0)
  const totalAfter = ok.reduce((s, r) => s + r.blob.size, 0)
  const many = files.length > 1
  return (
    <div className="card stack" aria-live="polite">
      <BeforeAfter
        original={many ? undefined : files[0]}
        originals={many ? files : undefined}
        result={!many && outFiles.length === 1 ? outFiles[0] : null}
        results={many && outFiles.length ? outFiles : undefined}
        saveAs={bundle}
        toolName={toolName}
        title={title}
        previewTitle={many ? tr('imgt.yourImages') : tr('imgt.previewImage')}
        placeholder={busy ? tr('common.processing') : tr('common.chooseApply')}
        summary={
          showSavings && ok.length > 0 ? (
            <Notice kind="success">
              {tr(ok.length > 1 ? 'imgt.savingsZip' : 'imgt.savings', { before: formatBytes(totalBefore), after: formatBytes(totalAfter), pct: savedPercent(totalBefore, totalAfter) })}
            </Notice>
          ) : ok.length > 1 ? (
            <Notice kind="success">{tr('imgt.readyZip', { n: ok.length })}</Notice>
          ) : undefined
        }
      />
      {results && (results.length > 1 || results.some((r) => r.error)) && (
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
                  <button type="button" className="icon-btn" aria-label={tr('img.downloadOne', { name: r.name })} onClick={() => download(r.blob, r.name, r.blob.type)}>
                    <Icon name="download" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
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
    // El archivo lo elige el usuario: se re-empaqueta con un tipo de imagen y solo se
    // usa una URL blob: de este mismo sitio (nunca texto del archivo como HTML).
    const type = /^image\/(jpeg|png|webp|gif|bmp|avif)$/.test(blob.type) ? blob.type : 'image/png'
    const u = URL.createObjectURL(new Blob([blob], { type }))
    if (!isOwnBlobUrl(u)) {
      URL.revokeObjectURL(u)
      return setUrl(null)
    }
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
      const { loadImage, hasAlpha, renderImage } = await import('../infra/imageCanvas')
      const img = await loadImage(file)
      try {
        const plan = planCompression(level, hasAlpha(img.bmp))
        const size = capSize(img.width, img.height, plan.maxSide)
        const blob = await renderImage(img, { ...size, mime: plan.mime, quality: plan.quality })
        // Si no se gana nada, se devuelve la original.
        if (blob.size >= file.size) return { name: outputName(file.name, tr('file.imgOptimized'), outputMime(file.type)), blob: file, width: img.width, height: img.height }
        return { name: outputName(file.name, tr('file.imgCompressed'), plan.mime), blob, ...size }
      } finally {
        img.bmp.close()
      }
    })
  return (
    <div className="stack">
      <Panel>
        {b.picker()}
        <div className="field">
          <span>{tr('imgt.level')}</span>
          <Segmented label={tr('imgt.levelShort')} value={level} onChange={(v) => { setLevel(v); b.setResults(null) }} options={[{ value: 'baja', label: tr('imgt.low') }, { value: 'media', label: tr('imgt.recommended') }, { value: 'alta', label: tr('imgt.max') }]} />
          <small className="faint">
            {level === 'baja' ? tr('imgt.lowHint') : level === 'media' ? tr('imgt.midHint') : tr('imgt.maxHint')}
          </small>
        </div>
        <small className="faint">{tr('imgt.compressNote')} {tr('imgt.privacy')}</small>
        {b.busy && <Progress value={b.progress} />}
        <div className="row row-end">
          <BusyButton busy={b.busy} disabled={!b.files.length} onClick={run} icon="compress">
            {b.files.length > 1 ? tr('imgt.compressN', { n: b.files.length }) : tr('imgt.compressGo')}
          </BusyButton>
        </div>
      </Panel>
      {b.files.length > 0 && <Results files={b.files} results={b.results} busy={b.busy} zipName={`${tr('file.zipCompressedImages')}.zip`} showSavings toolName="compress_image" title={b.files.length > 1 ? tr('imgt.title.compressMany') : tr('imgt.title.compressOne')} />}
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
      const { loadImage, renderImage } = await import('../infra/imageCanvas')
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
        <Segmented label={tr('imgt.howResize')} value={mode} onChange={(v) => { setMode(v); b.setResults(null) }} options={[{ value: 'percent', label: tr('imgt.byPercent') }, { value: 'pixels', label: tr('imgt.byPixels') }]} />
        {mode === 'percent' ? (
          <label className="field">
            <span>{tr('imgt.sizePct', { n: percent })}</span>
            <input type="range" min={5} max={200} step={5} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
          </label>
        ) : (
          <>
            <div className="row">
              <label className="field" style={{ flex: 1, minWidth: 120 }}>
                <span>{tr('imgt.width')}</span>
                <input className="input" type="number" min={1} max={16384} inputMode="numeric" value={width} placeholder={tr('imgt.eg')} onChange={(e) => setWidth(e.target.value)} />
              </label>
              <label className="field" style={{ flex: 1, minWidth: 120 }}>
                <span>{tr('imgt.height')}</span>
                <input className="input" type="number" min={1} max={16384} inputMode="numeric" value={height} placeholder={keepRatio ? tr('imgt.auto') : tr('imgt.eg')} onChange={(e) => setHeight(e.target.value)} />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
              <span>{tr('imgt.keepRatio')}</span>
            </label>
          </>
        )}
        <small className="faint">{tr('imgt.keepFormat')} {tr('imgt.privacy')}</small>
        {b.busy && <Progress value={b.progress} />}
        <div className="row row-end">
          <BusyButton busy={b.busy} disabled={!b.files.length || !valid} onClick={run} icon="resize">
            {b.files.length > 1 ? tr('imgt.resizeN', { n: b.files.length }) : tr('imgt.resize')}
          </BusyButton>
        </div>
      </Panel>
      {b.files.length > 0 && <Results files={b.files} results={b.results} busy={b.busy} zipName={`${tr('file.zipResizedImages')}.zip`} toolName="resize_image" title={b.files.length > 1 ? tr('imgt.title.many') : tr('imgt.title.resizeOne')} />}
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
      const { loadImage, renderImage } = await import('../infra/imageCanvas')
      const img = await loadImage(file)
      try {
        const mime = outputMime(file.type)
        return { name: outputName(file.name, tr('file.imgRotated'), mime), blob: await renderImage(img, { transform: t, mime, quality: 0.92 }), ...rotatedSize(img.width, img.height, t) }
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
            <img src={first} alt={tr('imgt.previewAlt')} style={{ transform: css }} />
          </div>
        )}
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => change((p) => rotateBy(p, -90))}><span className="icon-mirror"><Icon name="rotate" /></span> {tr('imgt.left')}</button>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => change((p) => rotateBy(p, 90))}><Icon name="rotate" /> {tr('imgt.right')}</button>
          <button type="button" className="btn btn-soft btn-sm" aria-pressed={t.flipH} onClick={() => change((p) => ({ ...p, flipH: !p.flipH }))}><Icon name="flip" /> {tr('imgt.mirror')}</button>
          <button type="button" className="btn btn-soft btn-sm" aria-pressed={t.flipV} onClick={() => change((p) => ({ ...p, flipV: !p.flipV }))}><span className="icon-turn"><Icon name="flip" /></span> {tr('imgt.vertical')}</button>
        </div>
        {b.files.length > 1 && <small className="faint" style={{ textAlign: 'center' }}>{tr('imgt.sameTurn', { n: b.files.length })}</small>}
        <small className="faint">{tr('imgt.privacy')}</small>
        {b.busy && <Progress value={b.progress} />}
        <div className="row row-end">
          <BusyButton busy={b.busy} disabled={!b.files.length || isIdentity(t)} onClick={run} icon="rotate">
            {isIdentity(t) ? tr('imgt.pickTurn') : tr('imgt.applyTurn')}
          </BusyButton>
        </div>
      </Panel>
      {b.files.length > 0 && <Results files={b.files} results={b.results} busy={b.busy} zipName={`${tr('file.zipRotatedImages')}.zip`} toolName="rotate_image" title={b.files.length > 1 ? tr('imgt.title.many') : tr('imgt.title.rotateOne')} />}
    </div>
  )
}

/* ───────────── Quitar fondo (W-121) ───────────── */

type BgChoice = 'transparent' | 'white' | 'color'

function RemoveBackgroundTool() {
  const b = useBatch('remove_background')
  const [choice, setChoice] = useState<BgChoice>('transparent')
  const [color, setColor] = useState('#2563eb')
  const [cached, setCached] = useState<boolean | null>(null)
  const [download, setDownload] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void import('../infra/backgroundModel').then((m) => m.isModelCached()).then(setCached, () => setCached(false))
  }, [])
  const pick = (c: BgChoice) => {
    setChoice(c)
    b.setResults(null)
  }
  const run = async () => {
    setError(null)
    const { prepareBackgroundRemover, removeBackground } = await import('../infra/backgroundRemover')
    try {
      setDownload(0)
      await prepareBackgroundRemover((f) => setDownload(f))
      setCached(true)
    } catch (e) {
      setError(tr('bg.failedModel'))
      track('app_error', { error_context: 'remove_background_model', error_message: e instanceof Error ? e.name : 'error' })
      return
    } finally {
      setDownload(null)
    }
    const background = parseBackground(choice === 'white' ? '#ffffff' : choice === 'color' ? color : '')
    await b.run(async (file) => {
      const r = await removeBackground(file, background)
      return { name: backgroundOutputName(file.name, tr('file.noBg')), blob: r.blob, width: r.width, height: r.height }
    })
  }
  return (
    <div className="stack">
      <Panel>
        {b.picker()}
        <div className="field">
          <span>{tr('bg.background')}</span>
          <Segmented
            label={tr('bg.background')}
            value={choice}
            onChange={pick}
            options={[
              { value: 'transparent', label: tr('bg.transparent') },
              { value: 'white', label: tr('bg.white') },
              { value: 'color', label: tr('bg.color') },
            ]}
          />
        </div>
        {choice === 'color' && (
          <label className="field bg-color">
            <span>{tr('bg.pickColor')}</span>
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); b.setResults(null) }} />
          </label>
        )}
        <small className="faint">{tr('bg.tip')}</small>
        {cached === false && <Notice kind="info">{tr('bg.firstTime', { size: formatBytes(BG_MODEL.bytes) })}</Notice>}
        {download !== null && (
          <div className="stack" style={{ gap: 6 }} role="status">
            <small>{download < 1 ? tr('bg.downloading', { pct: Math.round(download * 100) }) : tr('bg.preparing')}</small>
            <Progress value={download} />
          </div>
        )}
        {b.busy && <Progress value={b.progress} />}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={b.busy || download !== null} disabled={!b.files.length} onClick={run} icon="eraser">
            {tr('bg.run')}
          </BusyButton>
        </div>
      </Panel>
      {b.files.length > 0 && <Results files={b.files} results={b.results} busy={b.busy} zipName={`${tr('file.zipNoBg')}.zip`} toolName="remove_background" title={b.files.length > 1 ? tr('imgt.title.many') : tr('imgt.title.removeBg')} />}
    </div>
  )
}

/* ───────────── Recortar ───────────── */

function CropImageTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  useEffect(() => setOutput(null), [file])
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
    void import('../infra/imageCanvas').then(async ({ loadImage }) => {
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
    setMargins(rectToMargins(lockAspect(marginsToRect(m), dims.width, dims.height, ratio)))
  }

  const px = useMemo(() => (dims ? cropPixels(dims.width, dims.height, marginsToRect(margins)) : null), [dims, margins])

  const save = async () => {
    if (!file || !px) return
    setBusy(true)
    setError(null)
    try {
      const { loadImage, renderImage } = await import('../infra/imageCanvas')
      const img = await loadImage(file)
      const mime = outputMime(file.type)
      const blob = await renderImage(img, { crop: px, mime, quality: 0.92 })
      img.bmp.close()
      setOutput(resultFile(blob, outputName(file.name, tr('file.imgCropped'), mime), mime))
      track('image_tool_used', { tool_name: 'crop', files: 1, ok: 1 })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      {!file ? (
        <DropZone accept={ACCEPT} title={tr('imgt.pickOne')} hint={tr('imgt.formats')} onFiles={([f]) => setFile(f)} />
      ) : (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow file={file} extra={dims ? `${dims.width}×${dims.height} px` : tr('common.reading')} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>{tr('common.change')}</button>} />
        </ul>
      )}
      {url && dims && (
        <>
          <div className="aspect-chips" role="radiogroup" aria-label={tr('imgt.aspect')}>
            {(Object.keys(ASPECTS) as AspectName[]).map((a) => (
              <button key={a} type="button" role="radio" aria-checked={aspect === a} className="edit-tool" onClick={() => pickAspect(a)}>
                {a === 'libre' ? tr('imgt.free') : a}
              </button>
            ))}
          </div>
          <CropStage url={url} margins={margins} onChange={onChange} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="faint">{tr('imgt.resultPx', { w: px?.width ?? 0, h: px?.height ?? 0 })}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => pickAspect(aspect)}><Icon name="reset" /> {tr('crop.reset')}</button>
          </div>
          <small className="faint">{tr('imgt.privacy')}</small>
        </>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={!px} onClick={save} icon="check">
          {tr('imgt.crop')}
        </BusyButton>
      </div>
      {file && output && <BeforeAfter original={file} result={output} toolName="crop_image" title={tr('imgt.title.cropOne')} />}
    </Panel>
  )
}

/* ───────────── Foto tamaño documento (W-122) ───────────── */

type IdBg = 'original' | 'white' | 'color'

function IdPhotoTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [output, setOutput] = useState<File | null>(null)
  const url = useObjectUrl(file)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const [preset, setPreset] = useState<IdPresetId | 'custom'>('35x45')
  const [customW, setCustomW] = useState('35')
  const [customH, setCustomH] = useState('45')
  const [bg, setBg] = useState<IdBg>('white')
  const [color, setColor] = useState('#dbeafe')
  const [layout, setLayout] = useState<'single' | 'sheet'>('single')
  const [margins, setMargins] = useState<Margins>({ top: 0, right: 0, bottom: 0, left: 0 })
  const [cached, setCached] = useState<boolean | null>(null)
  const [modelProgress, setModelProgress] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const size: IdSize | null = preset === 'custom' ? parseSizeMm(customW, customH) : (ID_PRESETS.find((p) => p.id === preset) ?? null)
  const aspect = size ? size.w / size.h : null

  useEffect(() => {
    void import('../infra/backgroundModel').then((m) => m.isModelCached()).then(setCached, () => setCached(false))
  }, [])

  useEffect(() => {
    setDims(null)
    setError(null)
    setOutput(null)
    if (!file) return
    let cancelled = false
    void import('../infra/imageCanvas').then(async ({ loadImage }) => {
      try {
        const img = await loadImage(file)
        img.bmp.close()
        if (!cancelled) setDims({ width: img.width, height: img.height })
      } catch (e) {
        if (!cancelled) setError(errorMessage(e))
      }
    })
    return () => {
      cancelled = true
    }
  }, [file])

  // Al cambiar la foto o la medida, el recuadro vuelve a su posición inicial con la nueva proporción.
  useEffect(() => {
    if (dims && aspect) setMargins(rectToMargins(portraitCrop(dims.width, dims.height, aspect)))
    setOutput(null)
  }, [dims, aspect])

  const onChange = (m: Margins) => {
    if (!dims || !aspect) return
    setMargins(rectToMargins(lockAspect(marginsToRect(m), dims.width, dims.height, aspect)))
    setOutput(null)
  }
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setOutput(null)
  }

  const px = useMemo(() => (dims ? cropPixels(dims.width, dims.height, marginsToRect(margins)) : null), [dims, margins])
  const copies = size ? sheetLayout(size).cells.length : 0
  const locale = document.documentElement.lang || 'es'

  const save = async () => {
    if (!file || !px || !size) return
    setError(null)
    const background = bg === 'original' ? null : parseBackground(bg === 'white' ? '#ffffff' : color)
    if (background) {
      try {
        setModelProgress(0)
        const { prepareBackgroundRemover } = await import('../infra/backgroundRemover')
        await prepareBackgroundRemover((f) => setModelProgress(f))
        setCached(true)
      } catch (e) {
        setError(tr('bg.failedModel'))
        track('app_error', { error_context: 'id_photo_model', error_message: e instanceof Error ? e.name : 'error' })
        return
      } finally {
        setModelProgress(null)
      }
    }
    setBusy(true)
    try {
      const { renderIdPhoto } = await import('../infra/idPhotoCanvas')
      const r = await renderIdPhoto(file, { crop: px, size, background, layout })
      setOutput(resultFile(r.blob, idPhotoName(file.name, tr(layout === 'sheet' ? 'file.idSheet' : 'file.idPhoto')), 'image/jpeg'))
      track('image_tool_used', { tool_name: 'id_photo', files: 1, ok: 1 })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      {!file ? (
        <DropZone accept={ACCEPT} title={tr('imgt.pickOne')} hint={tr('imgt.formats')} onFiles={([f]) => setFile(f)} />
      ) : (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow file={file} extra={dims ? `${dims.width}×${dims.height} px` : tr('common.reading')} actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>{tr('common.change')}</button>} />
        </ul>
      )}
      <label className="field">
        <span>{tr('idp.size')}</span>
        <select className="input" value={preset} onChange={(e) => reset(setPreset)(e.target.value as IdPresetId | 'custom')}>
          {ID_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{tr(`idp.p.${p.id}` as MessageKey)}</option>
          ))}
          <option value="custom">{tr('idp.custom')}</option>
        </select>
      </label>
      {preset === 'custom' && (
        <div className="row">
          <label className="field" style={{ flex: 1, minWidth: 120 }}>
            <span>{tr('idp.widthMm')}</span>
            <input className="input" type="text" inputMode="decimal" value={customW} onChange={(e) => reset(setCustomW)(e.target.value)} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 120 }}>
            <span>{tr('idp.heightMm')}</span>
            <input className="input" type="text" inputMode="decimal" value={customH} onChange={(e) => reset(setCustomH)(e.target.value)} />
          </label>
        </div>
      )}
      {!size && <Notice kind="error">{tr('idp.badSize', { min: ID_MIN_MM, max: ID_MAX_MM })}</Notice>}
      {url && dims && size && (
        <>
          <small className="faint">{tr('idp.frame')}</small>
          <CropStage url={url} margins={margins} onChange={onChange} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="faint">{tr('idp.printSize', { size: formatMm(size, locale), w: idPixels(size).width, h: idPixels(size).height })}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDims({ ...dims })}><Icon name="reset" /> {tr('crop.reset')}</button>
          </div>
        </>
      )}
      <div className="field">
        <span>{tr('bg.background')}</span>
        <Segmented label={tr('bg.background')} value={bg} onChange={reset(setBg)} options={[{ value: 'white', label: tr('bg.white') }, { value: 'color', label: tr('bg.color') }, { value: 'original', label: tr('idp.bgOriginal') }]} />
      </div>
      {bg === 'color' && (
        <label className="field bg-color">
          <span>{tr('bg.pickColor')}</span>
          <input type="color" value={color} onChange={(e) => reset(setColor)(e.target.value)} />
        </label>
      )}
      {bg !== 'original' && cached === false && <Notice kind="info">{tr('bg.firstTime', { size: formatBytes(BG_MODEL.bytes) })}</Notice>}
      <div className="field">
        <span>{tr('idp.output')}</span>
        <Segmented label={tr('idp.output')} value={layout} onChange={reset(setLayout)} options={[{ value: 'single', label: tr('idp.single') }, { value: 'sheet', label: tr('idp.sheet') }]} />
        {layout === 'sheet' && size && <small className="faint">{tr('idp.sheetHint', { n: copies })}</small>}
      </div>
      <small className="faint">{tr('idp.check')} {tr('imgt.privacy')}</small>
      {modelProgress !== null && (
        <div className="stack" style={{ gap: 6 }} role="status">
          <small>{modelProgress < 1 ? tr('bg.downloading', { pct: Math.round(modelProgress * 100) }) : tr('bg.preparing')}</small>
          <Progress value={modelProgress} />
        </div>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy || modelProgress !== null} disabled={!px || !size || (layout === 'sheet' && copies === 0)} onClick={save} icon="user">
          {tr('idp.run')}
        </BusyButton>
      </div>
      {file && output && <BeforeAfter original={file} result={output} toolName="id_photo" title={tr('imgt.title.idPhoto')} />}
    </Panel>
  )
}
