import { useEffect, useState } from 'react'
import { go, useApp } from '../state'
import { Icon, type IconName } from '../components/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Segmented, errorMessage } from '../components/ui'
import { baseName, download, downloadMany, parsePageRanges } from '../lib/files'
import { closePdf, openPdf, renderPage } from '../lib/pdf'
import { extractPages, merge, numberPages, rotate, splitEach, watermark } from '../lib/pdfTools'
import { track } from '../../shared/analytics'

const TOOLS: Array<{ id: string; name: string; desc: string; icon: IconName; cls: string }> = [
  { id: 'unir', name: 'Unir PDFs', desc: 'Combina 2 o más PDFs en uno solo', icon: 'merge', cls: 'ico-red' },
  { id: 'dividir', name: 'Dividir PDF', desc: 'Extrae páginas o separa cada una', icon: 'split', cls: 'ico-violet' },
  { id: 'rotar', name: 'Rotar páginas', desc: 'Endereza páginas escaneadas de lado', icon: 'rotate', cls: 'ico-blue' },
  { id: 'reordenar', name: 'Reordenar páginas', desc: 'Cambia el orden o elimina páginas', icon: 'reorder', cls: 'ico-cyan' },
  { id: 'numerar', name: 'Numerar páginas', desc: 'Agrega el número al pie de cada página', icon: 'hash', cls: 'ico-green' },
  { id: 'marca', name: 'Marca de agua', desc: 'Un texto en diagonal sobre cada página', icon: 'stamp', cls: 'ico-amber' },
]

export function PdfTools({ sub }: { sub?: string }) {
  const tool = TOOLS.find((t) => t.id === sub)
  return (
    <>
      <HeroCard title="Herramientas PDF" subtitle="Gestiona tus PDFs de forma rápida, directo en el navegador." />
      {tool ? (
        <>
          <BackButton label="Volver a herramientas" onClick={() => go('pdf')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{tool.name}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{tool.desc}</p>
          {tool.id === 'unir' ? <MergeTool /> : <SingleFileTool toolId={tool.id} />}
        </>
      ) : (
        <>
          <h2 className="section-title">Elige una herramienta</h2>
          <div className="tool-grid">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" className="tool-card" onClick={() => go('pdf', t.id)}>
                <span className={'ico ' + t.cls}><Icon name={t.icon} /></span>
                <span>
                  <b>{t.name}</b>
                  <small>{t.desc}</small>
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Notice kind="plain">Comprimir, proteger con contraseña y OCR están en la app Android.</Notice>
          </div>
        </>
      )}
    </>
  )
}

function useRun(toolName: string) {
  const { toast } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      track('pdf_tool_used', { tool_name: toolName })
      toast('Listo. El archivo se descargó.')
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_' + toolName, error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

function MergeTool() {
  const [files, setFiles] = useState<File[]>([])
  const { busy, error, run } = useRun('merge')
  const move = (i: number, j: number) =>
    setFiles((p) => {
      const c = p.slice()
      ;[c[i], c[j]] = [c[j], c[i]]
      return c
    })
  return (
    <div className="card stack">
      <DropZone accept="application/pdf" multiple title="Toca para seleccionar PDFs" hint="Puedes agregar varios a la vez y luego ordenarlos" onFiles={(f) => setFiles((p) => [...p, ...f])} />
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f, i) => (
            <FileRow
              key={f.name + i}
              file={f}
              extra={`#${i + 1}`}
              actions={
                <>
                  <button type="button" className="icon-btn" aria-label="Subir" disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
                  <button type="button" className="icon-btn" aria-label="Bajar" disabled={i === files.length - 1} onClick={() => move(i, i + 1)}><Icon name="downArrow" /></button>
                  <button type="button" className="icon-btn" aria-label={`Quitar ${f.name}`} onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}><Icon name="close" /></button>
                </>
              }
            />
          ))}
        </ul>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton
          busy={busy}
          disabled={files.length < 2}
          icon="merge"
          onClick={() =>
            run(async () => {
              const out = await merge(await Promise.all(files.map((f) => f.arrayBuffer())))
              download(out, `${baseName(files[0].name)}-unido.pdf`, 'application/pdf')
            })
          }
        >
          {files.length < 2 ? 'Selecciona al menos 2 PDFs' : `Unir ${files.length} PDFs`}
        </BusyButton>
      </div>
    </div>
  )
}

/** Miniaturas de todas las páginas, renderizadas una vez por archivo. */
function useThumbs(file: File | null) {
  const [thumbs, setThumbs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    setThumbs([])
    setError(null)
    if (!file) return
    let cancelled = false
    ;(async () => {
      try {
        const doc = await openPdf(await file.arrayBuffer())
        const urls: string[] = []
        for (let i = 1; i <= doc.numPages && !cancelled; i++) {
          const canvas = await renderPage(doc, i, 220, 'print')
          urls.push(canvas.toDataURL('image/jpeg', 0.75))
          if (!cancelled) setThumbs(urls.slice())
        }
        await closePdf(doc)
      } catch (e) {
        if (!cancelled) setError(errorMessage(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file])
  return { thumbs, error }
}

function SingleFileTool({ toolId }: { toolId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const { thumbs, error: loadError } = useThumbs(file)
  const { busy, error, run } = useRun(
    { dividir: 'split', rotar: 'rotate', reordenar: 'reorder_pages', numerar: 'number_pages', marca: 'watermark' }[toolId] ?? toolId,
  )

  // Estado por herramienta
  const [splitMode, setSplitMode] = useState<'range' | 'each'>('range')
  const [range, setRange] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rotations, setRotations] = useState<number[]>([])
  const [order, setOrder] = useState<number[]>([])
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right'>('bottom-center')
  const [format, setFormat] = useState<'n' | 'n-of-total'>('n')
  const [mark, setMark] = useState('CONFIDENCIAL')

  const count = thumbs.length
  useEffect(() => {
    setSelected(new Set())
    setRange('')
  }, [file])
  useEffect(() => {
    setRotations(Array(count).fill(0))
    setOrder([...Array(count).keys()])
  }, [count])

  const name = file ? baseName(file.name) : ''
  const bytes = () => file!.arrayBuffer()

  const ranges = range.trim() ? parsePageRanges(range, count) : null
  const pagesFromSelection = [...selected].sort((a, b) => a - b)

  let action: { label: string; disabled: boolean; go: () => Promise<void> } = { label: '', disabled: true, go: async () => {} }
  if (toolId === 'dividir') {
    action =
      splitMode === 'each'
        ? {
            label: `Separar ${count} páginas`,
            disabled: count < 2,
            go: async () => {
              const parts = await splitEach(await bytes())
              await downloadMany(parts.map((d, i) => ({ name: `${name}-pagina-${i + 1}.pdf`, data: d })), `${name}-paginas.zip`)
            },
          }
        : {
            label: 'Extraer páginas',
            disabled: !(ranges ?? pagesFromSelection).length,
            go: async () => download(await extractPages(await bytes(), ranges ?? pagesFromSelection), `${name}-extracto.pdf`, 'application/pdf'),
          }
  } else if (toolId === 'rotar') {
    const changed = rotations.some((r) => r % 360 !== 0)
    action = {
      label: 'Guardar PDF rotado',
      disabled: !changed,
      go: async () => {
        let data: ArrayBuffer | Uint8Array = await bytes()
        for (const angle of [90, 180, 270] as const) {
          const idx = rotations.map((r, i) => ((r % 360) === angle ? i : -1)).filter((i) => i >= 0)
          if (idx.length) data = await rotate(toArrayBuffer(data), idx, angle)
        }
        download(data as Uint8Array, `${name}-rotado.pdf`, 'application/pdf')
      },
    }
  } else if (toolId === 'reordenar') {
    const same = order.length === count && order.every((p, i) => p === i)
    action = {
      label: 'Guardar nuevo orden',
      disabled: same || order.length === 0,
      go: async () => download(await extractPages(await bytes(), order), `${name}-reordenado.pdf`, 'application/pdf'),
    }
  } else if (toolId === 'numerar') {
    action = {
      label: 'Numerar y descargar',
      disabled: !count,
      go: async () => download(await numberPages(await bytes(), { position, format }), `${name}-numerado.pdf`, 'application/pdf'),
    }
  } else if (toolId === 'marca') {
    action = {
      label: 'Aplicar marca de agua',
      disabled: !count || !mark.trim(),
      go: async () => download(await watermark(await bytes(), mark), `${name}-marca.pdf`, 'application/pdf'),
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title="Toca para seleccionar un PDF" hint="O arrástralo aquí" onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const toggle = (i: number) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })

  return (
    <div className="card stack">
      <ul className="file-list" style={{ marginTop: 0 }}>
        <FileRow
          file={file}
          extra={count ? `${count} páginas` : 'Leyendo…'}
          actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>Cambiar</button>}
        />
      </ul>

      {toolId === 'dividir' && (
        <>
          <Segmented label="Modo de división" value={splitMode} onChange={setSplitMode} options={[{ value: 'range', label: 'Elegir páginas' }, { value: 'each', label: 'Cada página por separado' }]} />
          {splitMode === 'range' && (
            <label className="field">
              <span>Páginas (ej. 1-3, 5) o tócalas abajo</span>
              <input className="input" value={range} placeholder="1-3, 5, 8-" onChange={(e) => setRange(e.target.value)} />
              {range.trim() && !ranges && <small style={{ color: 'var(--danger)' }}>Rango no válido para un PDF de {count} páginas.</small>}
            </label>
          )}
        </>
      )}

      {toolId === 'numerar' && (
        <div className="row">
          <Segmented label="Posición" value={position} onChange={setPosition} options={[{ value: 'bottom-center', label: 'Centro' }, { value: 'bottom-right', label: 'Derecha' }]} />
          <Segmented label="Formato" value={format} onChange={setFormat} options={[{ value: 'n', label: '1, 2, 3' }, { value: 'n-of-total', label: '1 / 10' }]} />
        </div>
      )}

      {toolId === 'marca' && (
        <label className="field">
          <span>Texto de la marca de agua</span>
          <input className="input" value={mark} maxLength={40} onChange={(e) => setMark(e.target.value)} />
        </label>
      )}

      {loadError && <Notice kind="error">{loadError}</Notice>}

      {(toolId === 'dividir' && splitMode === 'range') || toolId === 'rotar' || toolId === 'reordenar' ? (
        <div className="thumbs">
          {(toolId === 'reordenar' ? order : thumbs.map((_, i) => i)).map((pageIdx, pos) => {
            const src = thumbs[pageIdx]
            if (!src) return null
            if (toolId === 'dividir')
              return (
                <button key={pageIdx} type="button" className="thumb" aria-pressed={selected.has(pageIdx)} onClick={() => { setRange(''); toggle(pageIdx) }}>
                  <img src={src} alt={`Página ${pageIdx + 1}`} />
                  <span>{pageIdx + 1}</span>
                </button>
              )
            if (toolId === 'rotar')
              return (
                <button key={pageIdx} type="button" className="thumb" onClick={() => setRotations((r) => r.map((v, i) => (i === pageIdx ? v + 90 : v)))} aria-label={`Rotar página ${pageIdx + 1}`}>
                  <img src={src} alt="" style={{ transform: `rotate(${rotations[pageIdx] ?? 0}deg) scale(${(rotations[pageIdx] ?? 0) % 180 ? 0.72 : 1})` }} />
                  <span>{pageIdx + 1} · {(rotations[pageIdx] ?? 0) % 360}°</span>
                </button>
              )
            return (
              <div key={pageIdx} className="thumb">
                <img src={src} alt={`Página ${pageIdx + 1}`} />
                <span>Pág. {pageIdx + 1}</span>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn" aria-label="Mover antes" disabled={pos === 0} onClick={() => setOrder((o) => swap(o, pos, pos - 1))}><Icon name="back" /></button>
                  <button type="button" className="icon-btn" aria-label="Quitar página" disabled={order.length === 1} onClick={() => setOrder((o) => o.filter((_, j) => j !== pos))}><Icon name="trash" /></button>
                  <button type="button" className="icon-btn" aria-label="Mover después" disabled={pos === order.length - 1} onClick={() => setOrder((o) => swap(o, pos, pos + 1))} style={{ transform: 'scaleX(-1)' }}><Icon name="back" /></button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {toolId === 'rotar' && count > 0 && (
        <div className="row">
          <span className="faint">Toca una página para girarla 90°.</span>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setRotations((r) => r.map((v) => v + 90))}>
            <Icon name="rotate" /> Rotar todas
          </button>
        </div>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={action.disabled} onClick={() => run(action.go)} icon="download">
          {action.label}
        </BusyButton>
      </div>
    </div>
  )
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const c = arr.slice()
  ;[c[a], c[b]] = [c[b], c[a]]
  return c
}

function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}
