// Escáner: fotos de documentos → páginas derechas y limpias → PDF (opcionalmente buscable) o JPG.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, Notice, Progress, Segmented, errorMessage } from '../components/ui'
import { BeforeAfter } from '../components/DocPreview'
import { bundleFiles, resultFile } from '../lib/share'
import { tr } from '../i18n/translate'
import type { MessageKey } from '../i18n/messages/es'
import type { Quad, ScanFilter } from '../lib/scan'
import type { Photo } from '../lib/scanCanvas'
import { track } from '../../shared/analytics'

type Page = {
  id: number
  photo: Photo
  quad: Quad
  filter: ScanFilter
  turns: number
  result: { blob: Blob; url: string; width: number; height: number } | null
}

const FILTERS: Array<{ value: ScanFilter; label: string }> = [
  { value: 'documento', label: 'scan.document' },
  { value: 'bn', label: 'scan.bw' },
  { value: 'gris', label: 'scan.gray' },
  { value: 'original', label: 'scan.color' },
]

let nextId = 1
const today = () => new Date().toISOString().slice(0, 10)

export function ScanTool() {
  const { toast } = useApp()
  const [pages, setPages] = useState<Page[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [loading, setLoading] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchable, setSearchable] = useState(false)
  const [ocrProgress, setOcrProgress] = useState<number | null>(null)
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)

  // Liberar las imágenes al salir.
  const pagesRef = useRef(pages)
  pagesRef.current = pages
  useEffect(
    () => () =>
      pagesRef.current.forEach((p) => {
        URL.revokeObjectURL(p.photo.previewUrl)
        if (p.result) URL.revokeObjectURL(p.result.url)
      }),
    [],
  )

  const addFiles = async (files: File[]) => {
    if (!files.length) return
    setError(null)
    const { loadPhoto, defaultQuad } = await import('../lib/scanCanvas')
    let first: number | null = null
    for (const file of files) {
      setLoading((n) => n + 1)
      try {
        const photo = await loadPhoto(file)
        const page: Page = { id: nextId++, photo, quad: defaultQuad(photo), filter: 'documento', turns: 0, result: null }
        first ??= page.id
        setPages((p) => [...p, page])
        if (!photo.detected) toast(tr('scan.noEdges'))
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading((n) => n - 1)
      }
    }
    if (first !== null) setEditing(first)
  }

  const update = (id: number, patch: Partial<Page>) => setPages((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const finish = async (page: Page) => {
    setBusy(true)
    try {
      const { processPage } = await import('../lib/scanCanvas')
      const r = await processPage(page.photo, page.quad, page.turns, page.filter)
      if (page.result) URL.revokeObjectURL(page.result.url)
      update(page.id, { result: { ...r, url: URL.createObjectURL(r.blob) } })
      // Seguir con la próxima página sin procesar, si hay.
      const next = pages.find((p) => p.id !== page.id && !p.result)
      setEditing(next ? next.id : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = (id: number) => {
    const p = pages.find((x) => x.id === id)
    if (p) {
      URL.revokeObjectURL(p.photo.previewUrl)
      if (p.result) URL.revokeObjectURL(p.result.url)
    }
    setPages((list) => list.filter((x) => x.id !== id))
    if (editing === id) setEditing(null)
  }

  const move = (i: number, j: number) =>
    setPages((list) => {
      const c = list.slice()
      ;[c[i], c[j]] = [c[j], c[i]]
      return c
    })

  const ready = pages.filter((p) => p.result)
  /** Las páginas escaneadas como imágenes (el "antes" del PDF). */
  const scans = useMemo(() => ready.map((p, i) => resultFile(p.result!.blob, `escaneo-${today()}-${i + 1}.jpg`, 'image/jpeg')), [pages])
  const [output, setOutput] = useState<{ result: File | null; results?: File[]; saveAs?: File | null } | null>(null)
  useEffect(() => setOutput(null), [pages])
  const pending = pages.length - ready.length

  const savePdf = async () => {
    setBusy(true)
    setError(null)
    try {
      const items = await Promise.all(ready.map(async (p) => ({ jpg: new Uint8Array(await p.result!.blob.arrayBuffer()), width: p.result!.width, height: p.result!.height })))
      let pdf: Uint8Array
      if (searchable) {
        const { runOcr } = await import('../lib/ocr')
        setOcrProgress(0)
        const r = await runOcr(
          ready.map((p) => async () => p.result!.blob),
          { lang: 'spa', wantPdf: true, onProgress: (pr) => setOcrProgress((pr.page - 1 + pr.fraction) / pr.pages) },
        )
        pdf = r.pdf!
      } else {
        const { scansToPdf } = await import('../lib/scan')
        pdf = await scansToPdf(items)
      }
      setOutput({ result: resultFile(pdf, `escaneo-${today()}.pdf`, 'application/pdf') })
      track('scan_saved', { pages: ready.length, format: 'pdf', searchable })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'scan', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
      setOcrProgress(null)
    }
  }

  const saveJpgs = async () => {
    const images = scans
    setOutput(images.length === 1 ? { result: images[0] } : { result: null, results: images, saveAs: await bundleFiles(images, `escaneo-${today()}.zip`) })
    toast(tr('common.doneReview'))
    track('scan_saved', { pages: ready.length, format: 'jpg', searchable: false })
  }

  const current = pages.find((p) => p.id === editing) ?? null

  const inputs = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ''; void addFiles(files) }} />
      <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ''; void addFiles(files) }} />
    </>
  )
  const addButtons = (
    <div className="row scan-add">
      <button type="button" className="btn btn-primary" onClick={() => camera.current?.click()}><Icon name="camera" /> {tr('scan.takePhoto')}</button>
      <button type="button" className="btn btn-soft" onClick={() => gallery.current?.click()}><Icon name="image" /> {tr('scan.pickImages')}</button>
    </div>
  )

  return (
    <div className="stack">
      {inputs}
      {!pages.length && (
        <div className="card stack scan-empty">
          <span className="ico ico-blue scan-empty-ico"><Icon name="camera" /></span>
          <p className="muted" style={{ margin: 0, textAlign: 'center' }}>
            {tr('scan.intro')}
          </p>
          {addButtons}
          {loading > 0 && <p className="faint" style={{ textAlign: 'center' }}>{tr('scan.finding')}</p>}
        </div>
      )}

      {current && (
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{tr('scan.pageN', { n: pages.indexOf(current) + 1 })}</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(current.id)}><Icon name="trash" /> {tr('scan.remove')}</button>
          </div>
          <p className="faint" style={{ margin: 0 }}>{tr('scan.cornersHelp')}</p>
          <QuadEditor url={current.photo.previewUrl} quad={current.quad} onChange={(quad) => update(current.id, { quad })} />
          <div className="row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void import('../lib/scanCanvas').then((m) => update(current.id, { quad: m.defaultQuad(current.photo) }))}>
              <Icon name="reset" /> {current.photo.detected ? tr('scan.detected') : tr('scan.reset')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void import('../lib/scan').then((m) => update(current.id, { quad: m.insetQuad(0) }))}>
              <Icon name="image" /> {tr('scan.wholePhoto')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => update(current.id, { turns: (current.turns + 1) % 4 })}>
              <Icon name="rotate" /> {tr('scan.rotate')}{current.turns ? ` (${current.turns * 90}°)` : ''}
            </button>
          </div>
          <div className="field">
            <span>{tr('scan.filter')}</span>
            <Segmented label={tr('scan.filter')} value={current.filter} onChange={(filter) => update(current.id, { filter })} options={FILTERS.map((f) => ({ ...f, label: tr(f.label as MessageKey) }))} />
            <small className="faint">
              {tr(`scan.hint.${current.filter}` as MessageKey)}
            </small>
          </div>
          <div className="row row-end">
            {current.result && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setEditing(null)}>{tr('scan.cancel')}</button>}
            <BusyButton busy={busy} onClick={() => finish(current)} icon="check">
              {current.result ? tr('scan.apply') : tr('scan.done')}
            </BusyButton>
          </div>
        </div>
      )}

      {pages.length > 0 && (
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>{pages.length === 1 ? tr('common.onePage') : tr('common.pagesCount', { n: pages.length })}</h3>
            {addButtons}
          </div>
          <div className="scan-pages">
            {pages.map((p, i) => (
              <div key={p.id} className={'scan-page' + (editing === p.id ? ' is-editing' : '')}>
                <button type="button" className="scan-thumb" aria-label={tr('scan.editPage', { n: i + 1 })} onClick={() => setEditing(p.id)}>
                  <img src={p.result?.url ?? p.photo.previewUrl} alt="" />
                  {!p.result && <span className="scan-badge">{tr('scan.unfinished')}</span>}
                </button>
                <div className="scan-page-bar">
                  <button type="button" className="icon-btn" aria-label={tr('single.moveBefore')} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="back" /></button>
                  <span>{i + 1}</span>
                  <button type="button" className="icon-btn" aria-label={tr('single.moveAfter')} disabled={i === pages.length - 1} onClick={() => move(i, i + 1)} style={{ transform: 'scaleX(-1)' }}><Icon name="back" /></button>
                </div>
              </div>
            ))}
          </div>
          {loading > 0 && <p className="faint">{loading === 1 ? tr('scan.processingOne') : tr('scan.processingMany', { n: loading })}</p>}
          {pending > 0 && <Notice kind="plain">{pending === 1 ? tr('scan.pendingOne') : tr('scan.pendingMany', { n: pending })}</Notice>}
          <label className="check">
            <input type="checkbox" checked={searchable} onChange={(e) => setSearchable(e.target.checked)} />
            <span>{tr('scan.searchable')}</span>
          </label>
          {ocrProgress !== null && (
            <>
              <Progress value={ocrProgress} />
              <small className="faint">{tr('scan.ocrHint')}</small>
            </>
          )}
          {error && <Notice kind="error">{error}</Notice>}
          <div className="row row-end">
            <button type="button" className="btn btn-soft" disabled={!ready.length || busy} onClick={() => void saveJpgs()}>
              <Icon name="image" /> {ready.length > 1 ? tr('scan.imagesZip') : tr('scan.imageJpg')}
            </button>
            <BusyButton busy={busy && !current} disabled={!ready.length || busy} onClick={savePdf} icon="pdf">
              {ready.length > 1 ? tr('scan.makePdfN', { n: ready.length }) : tr('scan.makePdf')}
            </BusyButton>
          </div>
          {output && scans.length > 0 && (
            <BeforeAfter
              original={scans.length === 1 ? scans[0] : undefined}
              originals={scans.length > 1 ? scans : undefined}
              result={output.result}
              results={output.results}
              saveAs={output.saveAs}
              labels={[tr('scan.labelScans'), output.result?.type === 'application/pdf' ? 'PDF' : tr('scan.labelImages')]}
              toolName="scan"
              title={output.result?.type === 'application/pdf' ? tr('scan.titlePdf') : tr('scan.titleImages')}
            />
          )}
        </div>
      )}
      {!pages.length && error && <Notice kind="error">{error}</Notice>}
    </div>
  )
}

/* ───────────── Editor de esquinas ───────────── */

const CORNER_LABELS: MessageKey[] = ['scan.corner.tl', 'scan.corner.tr', 'scan.corner.br', 'scan.corner.bl']

function QuadEditor({ url, quad, onChange }: { url: string; quad: Quad; onChange: (q: Quad) => void }) {
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<number | null>(null)
  const quadRef = useRef(quad)
  quadRef.current = quad

  const setCorner = (i: number, x: number, y: number) => {
    const q = quadRef.current.slice() as Quad
    q[i] = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
    onChange(q)
  }
  const down = (i: number) => (e: PointerEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* puntero sintético */
    }
    drag.current = i
  }
  const move = (e: PointerEvent<HTMLElement>) => {
    const i = drag.current
    const r = stage.current?.getBoundingClientRect()
    if (i === null || !r || !r.width) return
    setCorner(i, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
  }
  const up = () => {
    drag.current = null
  }
  const keys = (i: number) => (e: KeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 0.02 : 0.004
    const d: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }
    if (!d[e.key]) return
    e.preventDefault()
    setCorner(i, quad[i].x + d[e.key][0], quad[i].y + d[e.key][1])
  }

  const pts = quad.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')
  return (
    <div className="crop-frame">
      <div className="crop-stage scan-stage" ref={stage} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <img src={url} alt={tr('scan.photoAlt')} draggable={false} />
        <svg className="scan-quad" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <mask id="scan-mask">
              <rect width="100" height="100" fill="white" />
              <polygon points={pts} fill="black" />
            </mask>
          </defs>
          <rect width="100" height="100" fill="rgba(11,16,32,0.55)" mask="url(#scan-mask)" />
          <polygon points={pts} fill="none" stroke="#60A5FA" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        </svg>
        {quad.map((p, i) => (
          <span
            key={i}
            className="scan-corner"
            role="slider"
            tabIndex={0}
            aria-label={tr(CORNER_LABELS[i])}
            aria-valuetext={`${Math.round(p.x * 100)} %, ${Math.round(p.y * 100)} %`}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            onPointerDown={down(i)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={keys(i)}
          />
        ))}
      </div>
    </div>
  )
}
