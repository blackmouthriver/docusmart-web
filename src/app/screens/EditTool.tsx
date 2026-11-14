// Editar PDF: agregar texto, imágenes, formas, resaltado y tapado sobre las páginas.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { useApp } from '../state'
import { Icon, type IconName } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, Segmented, errorMessage } from '../components/ui'
import { baseName, download } from '../lib/files'
import { canvasToBlob } from '../lib/pdf'
import { applyEdits, type BoxKind, type EditItem, type FontName } from '../lib/pdfEdit'
import { areaFromCorners } from '../lib/pdfRedact'
import { track } from '../../shared/analytics'
import { PageNav, usePdfPreview } from './PdfPreview'

type Item = EditItem & { id: number }
type Tool = 'select' | 'text' | BoxKind

const TOOLS: Array<{ id: Tool; label: string; icon: IconName }> = [
  { id: 'select', label: 'Seleccionar', icon: 'cursor' },
  { id: 'text', label: 'Texto', icon: 'type' },
  { id: 'rect', label: 'Rectángulo', icon: 'square' },
  { id: 'ellipse', label: 'Círculo', icon: 'circle' },
  { id: 'highlight', label: 'Resaltar', icon: 'marker' },
  { id: 'whiteout', label: 'Tapar', icon: 'eraser' },
]
const COLORS = ['#1C1B1A', '#DC2626', '#2563EB', '#16A34A', '#F59E0B', '#FFFFFF']
const HIGHLIGHTS = ['#FDE047', '#86EFAC', '#F9A8D4', '#93C5FD']
const CSS_FONT: Record<FontName, string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  times: '"Times New Roman", Times, serif',
  courier: '"Courier New", Courier, monospace',
}
const HINT: Record<Tool, string> = {
  select: 'Toca un elemento para moverlo o editarlo. La esquina inferior derecha cambia el tamaño.',
  text: 'Toca la página donde quieres escribir.',
  rect: 'Arrastra sobre la página para dibujar un rectángulo.',
  ellipse: 'Arrastra sobre la página para dibujar un círculo o un óvalo.',
  highlight: 'Arrastra sobre el texto que quieres resaltar.',
  whiteout: 'Arrastra para tapar con blanco; luego puedes escribir encima con "Texto".',
}

let nextId = 1

export function EditTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const { pages, ready, pageNo, setPageNo, preview, error, setError } = usePdfPreview(file)
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [tool, setTool] = useState<Tool>('text')
  const [busy, setBusy] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const textArea = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setItems([])
    setSelected(null)
  }, [file])

  const current = items.find((i) => i.id === selected) ?? null
  const update = (id: number, patch: Partial<EditItem>) => setItems((list) => list.map((i) => (i.id === id ? ({ ...i, ...patch } as Item) : i)))
  const add = (item: EditItem) => {
    const it = { ...item, id: nextId++ } as Item
    setItems((list) => [...list, it])
    setSelected(it.id)
    return it
  }
  const remove = (id: number) => {
    setItems((list) => list.filter((i) => i.id !== id))
    setSelected(null)
  }

  const addImage = async (f: File) => {
    try {
      const bmp = await createImageBitmap(f)
      const { width: bw, height: bh } = bmp
      let data: Uint8Array
      let format: 'png' | 'jpg'
      if (f.type === 'image/jpeg' || f.type === 'image/png') {
        data = new Uint8Array(await f.arrayBuffer())
        format = f.type === 'image/png' ? 'png' : 'jpg'
      } else {
        // WebP, GIF, BMP…: se pasan a PNG para poder incrustarlos.
        const c = document.createElement('canvas')
        c.width = bmp.width
        c.height = bmp.height
        c.getContext('2d')!.drawImage(bmp, 0, 0)
        data = new Uint8Array(await (await canvasToBlob(c, 'image/png')).arrayBuffer())
        format = 'png'
      }
      bmp.close()
      // 40 % del ancho de la página, sin pasar del 80 % del alto; con la proporción de la imagen.
      const pageAspect = preview ? preview.widthPt / preview.heightPt : 0.75
      let w = 0.4
      let h = (w * pageAspect * bh) / bw
      if (h > 0.8) {
        h = 0.8
        w = (h * bw) / bh / pageAspect
      }
      add({ kind: 'image', page: pageNo - 1, x: (1 - w) / 2, y: (1 - h) / 2, w, h, data, format })
      setTool('select')
    } catch {
      setError('No se pudo leer la imagen. Usa un archivo JPG, PNG o WebP.')
    }
  }

  const save = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      download(await applyEdits(await file.arrayBuffer(), items.map(({ id: _id, ...rest }) => rest as EditItem)), `${baseName(file.name)}-editado.pdf`, 'application/pdf')
      track('pdf_tool_used', { tool_name: 'edit' })
      toast('Listo. El archivo se descargó.')
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_edit', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title="Toca para seleccionar el PDF a editar" hint="O arrástralo aquí" onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const onPage = items.filter((i) => i.page === pageNo - 1)
  const hasItems = items.length > 0

  return (
    <div className="stack">
      <div className="card stack">
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow
            file={file}
            extra={pages ? `${pages} ${pages === 1 ? 'página' : 'páginas'}` : 'Leyendo…'}
            actions={<button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setFile(null)}>Cambiar</button>}
          />
        </ul>
        <div className="edit-toolbar" role="toolbar" aria-label="Herramientas de edición">
          {TOOLS.map((t) => (
            <button key={t.id} type="button" className="edit-tool" aria-pressed={tool === t.id} onClick={() => setTool(t.id)}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          ))}
          <button type="button" className="edit-tool" onClick={() => imageInput.current?.click()}>
            <Icon name="image" />
            <span>Imagen</span>
          </button>
          <input
            ref={imageInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void addImage(f)
              e.target.value = ''
            }}
          />
        </div>
        <p className="faint" style={{ margin: 0 }}>{HINT[tool]}</p>
      </div>

      <div className="card stack">
        {preview ? (
          <>
            <div className="sign-frame">
              <EditStage
                url={preview.url}
                page={pageNo - 1}
                viewWidthPt={preview.widthPt}
                tool={tool}
                items={onPage}
                selected={selected}
                onSelect={setSelected}
                onAdd={(item) => {
                  const it = add(item)
                  if (it.kind === 'text') setTimeout(() => textArea.current?.select(), 0)
                  setTool('select')
                }}
                onChange={update}
                onRemove={remove}
              />
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <PageNav pageNo={pageNo} pages={pages} onChange={(n) => { setPageNo(n); setSelected(null) }} />
              <span className="faint">{hasItems ? `${items.length} ${items.length === 1 ? 'elemento' : 'elementos'}` : 'Sin cambios todavía'}</span>
            </div>
          </>
        ) : (
          !error && <p className="faint">Preparando la vista previa…</p>
        )}

        {current && <Properties item={current} textArea={textArea} onChange={(p) => update(current.id, p)} onRemove={() => remove(current.id)} />}

        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!ready || !hasItems} onClick={save} icon="download">
            Guardar y descargar
          </BusyButton>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Lienzo ───────────── */

function EditStage({
  url,
  page,
  viewWidthPt,
  tool,
  items,
  selected,
  onSelect,
  onAdd,
  onChange,
  onRemove,
}: {
  url: string
  page: number
  viewWidthPt: number
  tool: Tool
  items: Item[]
  selected: number | null
  onSelect: (id: number | null) => void
  onAdd: (item: EditItem) => void
  onChange: (id: number, patch: Partial<EditItem>) => void
  onRemove: (id: number) => void
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1) // pixeles de pantalla por punto PDF
  const [draft, setDraftState] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // Copia en una ref: al soltar puede que React todavía no haya vuelto a dibujar con el último borrador.
  const draftRef = useRef(draft)
  const setDraft = (d: typeof draft) => {
    draftRef.current = d
    setDraftState(d)
  }
  const drag = useRef<{ mode: 'new' | 'move' | 'resize'; id?: number; x: number; y: number; start?: Item } | null>(null)

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / viewWidthPt))
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewWidthPt])

  const frac = (e: PointerEvent) => {
    const r = stage.current!.getBoundingClientRect()
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as const
  }

  const down = (e: PointerEvent<HTMLDivElement>) => {
    const [x, y] = frac(e)
    if (tool === 'text') {
      onAdd({ kind: 'text', page, x, y, text: 'Escribe aquí', size: 14, color: '#1C1B1A', font: 'helvetica', bold: false })
      return
    }
    if (tool === 'select') {
      onSelect(null)
      return
    }
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect(null)
    drag.current = { mode: 'new', x, y }
    setDraft({ x, y, w: 0, h: 0 })
  }

  const startItem = (it: Item, mode: 'move' | 'resize') => (e: PointerEvent<HTMLElement>) => {
    // Con Texto o una forma activa, el toque va a la página (p. ej. escribir encima de un "Tapar").
    if (tool !== 'select' && mode === 'move') return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect(it.id)
    const [x, y] = frac(e)
    drag.current = { mode, id: it.id, x, y, start: it }
  }

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const [x, y] = frac(e)
    if (d.mode === 'new') {
      const a = areaFromCorners(page, d.x, d.y, x, y)
      setDraft({ x: a.x, y: a.y, w: a.w, h: a.h })
      return
    }
    const s = d.start!
    const dx = x - d.x
    const dy = y - d.y
    if (d.mode === 'move') onChange(s.id, { x: clamp(s.x + dx, 0, 0.98), y: clamp(s.y + dy, 0, 0.98) })
    else if (s.kind !== 'text') {
      const w = clamp(s.w + dx, 0.02, 1 - s.x)
      // Las imágenes conservan su proporción; las formas se estiran libremente.
      const h = s.kind === 'image' ? (w * s.h) / s.w : clamp(s.h + dy, 0.01, 1 - s.y)
      onChange(s.id, { w, h: Math.min(h, 1 - s.y) })
    }
  }

  const up = () => {
    const d = drag.current
    const draft = draftRef.current
    if (d?.mode === 'new' && draft && draft.w > 0.01 && draft.h > 0.005 && tool !== 'select' && tool !== 'text') {
      onAdd({
        kind: tool,
        page,
        ...draft,
        stroke: tool === 'rect' || tool === 'ellipse' ? '#DC2626' : null,
        fill: tool === 'highlight' ? '#FDE047' : null,
        strokeWidth: 2,
      })
    }
    drag.current = null
    setDraft(null)
  }

  const keys = (it: Item) => (e: KeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 0.02 : 0.005
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }
    if (moves[e.key]) onChange(it.id, { x: clamp(it.x + moves[e.key][0], 0, 0.98), y: clamp(it.y + moves[e.key][1], 0, 0.98) })
    else if (e.key === 'Delete' || e.key === 'Backspace') onRemove(it.id)
    else return
    e.preventDefault()
  }

  return (
    <div className={'sign-stage edit-stage tool-' + tool} ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <img src={url} alt={`Página ${page + 1}`} draggable={false} />
      {items.map((it) => (
        <div
          key={it.id}
          className={'edit-item edit-' + it.kind + (selected === it.id ? ' is-selected' : '')}
          style={itemStyle(it, scale)}
          role="group"
          tabIndex={0}
          aria-label={labelOf(it) + '. Flechas para mover, Suprimir para quitarlo.'}
          onFocus={() => onSelect(it.id)}
          onKeyDown={keys(it)}
          onPointerDown={startItem(it, 'move')}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          {it.kind === 'text' && (it.text || ' ')}
          {it.kind === 'image' && <ImagePreview item={it} />}
          {selected === it.id && (
            <>
              <button type="button" className="sign-del" style={{ display: 'grid' }} aria-label="Quitar" onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemove(it.id)}>
                <Icon name="close" />
              </button>
              {it.kind !== 'text' && <span className="sign-resize" style={{ display: 'block' }} aria-hidden="true" onPointerDown={startItem(it, 'resize')} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />}
            </>
          )}
        </div>
      ))}
      {draft && <div className={'edit-item edit-draft edit-' + tool} style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }} />}
    </div>
  )
}

function ImagePreview({ item }: { item: Extract<Item, { kind: 'image' }> }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    const u = URL.createObjectURL(new Blob([item.data as BlobPart], { type: item.format === 'png' ? 'image/png' : 'image/jpeg' }))
    setSrc(u)
    return () => URL.revokeObjectURL(u)
  }, [item.data, item.format])
  return src ? <img src={src} alt="" draggable={false} /> : null
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const labelOf = (it: Item) => ({ text: 'Texto', image: 'Imagen', rect: 'Rectángulo', ellipse: 'Círculo', highlight: 'Resaltado', whiteout: 'Tapado' })[it.kind]

function itemStyle(it: Item, scale: number): CSSProperties {
  const pos: CSSProperties = { left: `${it.x * 100}%`, top: `${it.y * 100}%` }
  if (it.kind === 'text') {
    return { ...pos, fontSize: it.size * scale, fontFamily: CSS_FONT[it.font], fontWeight: it.bold ? 700 : 400, color: it.color }
  }
  const size: CSSProperties = { ...pos, width: `${it.w * 100}%`, height: `${it.h * 100}%` }
  if (it.kind === 'image') return size
  if (it.kind === 'highlight') return { ...size, background: it.fill ?? '#FDE047' }
  if (it.kind === 'whiteout') return { ...size, background: '#fff' }
  return {
    ...size,
    background: it.fill ?? 'transparent',
    border: it.stroke ? `${Math.max(1, it.strokeWidth * scale)}px solid ${it.stroke}` : 'none',
    borderRadius: it.kind === 'ellipse' ? '50%' : 0,
  }
}

/* ───────────── Propiedades ───────────── */

function Swatches({ label, colors, value, onChange, allowNone }: { label: string; colors: string[]; value: string | null; onChange: (c: string | null) => void; allowNone?: boolean }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="row" style={{ gap: 6 }} role="radiogroup" aria-label={label}>
        {allowNone && (
          <button type="button" className="swatch swatch-none" role="radio" aria-checked={value === null} aria-label="Sin color" onClick={() => onChange(null)} />
        )}
        {colors.map((c) => (
          <button key={c} type="button" className="swatch" role="radio" aria-checked={value?.toLowerCase() === c.toLowerCase()} aria-label={c} style={{ background: c }} onClick={() => onChange(c)} />
        ))}
      </div>
    </div>
  )
}

function Properties({ item, textArea, onChange, onRemove }: { item: Item; textArea: RefObject<HTMLTextAreaElement | null>; onChange: (p: Partial<EditItem>) => void; onRemove: () => void }) {
  return (
    <div className="edit-props">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{labelOf(item)}</b>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}><Icon name="trash" /> Quitar</button>
      </div>
      {item.kind === 'text' && (
        <>
          <label className="field">
            <span>Texto</span>
            <textarea ref={textArea} className="input" rows={2} value={item.text} onChange={(e) => onChange({ text: e.target.value })} />
          </label>
          <div className="row">
            <Segmented label="Letra" value={item.font} onChange={(font) => onChange({ font })} options={[{ value: 'helvetica', label: 'Sans' }, { value: 'times', label: 'Serif' }, { value: 'courier', label: 'Mono' }]} />
            <label className="row" style={{ gap: 6 }}>
              <span className="faint">Tamaño</span>
              <input className="input edit-size" type="number" min={6} max={96} value={item.size} onChange={(e) => onChange({ size: clamp(Number(e.target.value) || 12, 6, 96) })} />
            </label>
            <button type="button" className="btn btn-soft btn-sm" aria-pressed={item.bold} onClick={() => onChange({ bold: !item.bold })} style={{ fontWeight: 700 }}>
              N
            </button>
          </div>
          <Swatches label="Color" colors={COLORS} value={item.color} onChange={(c) => onChange({ color: c ?? '#1C1B1A' })} />
          <small className="faint">Las fuentes estándar de PDF solo incluyen letras latinas: los emojis y otros alfabetos no se guardan.</small>
        </>
      )}
      {(item.kind === 'rect' || item.kind === 'ellipse') && (
        <>
          <Swatches label="Borde" colors={COLORS} value={item.stroke} allowNone onChange={(stroke) => onChange({ stroke })} />
          <Swatches label="Relleno" colors={COLORS} value={item.fill} allowNone onChange={(fill) => onChange({ fill })} />
          <label className="row" style={{ gap: 8 }}>
            <span className="faint">Grosor del borde</span>
            <input type="range" min={1} max={8} value={item.strokeWidth} onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })} />
          </label>
        </>
      )}
      {item.kind === 'highlight' && <Swatches label="Color del resaltador" colors={HIGHLIGHTS} value={item.fill} onChange={(fill) => onChange({ fill: fill ?? '#FDE047' })} />}
      {item.kind === 'whiteout' && <small className="faint">Tapa con blanco lo que hay debajo. Para borrar datos sensibles de verdad, usa "Censurar PDF".</small>}
    </div>
  )
}
