// Censurar PDF: marcar zonas a mano o buscando texto, y eliminarlas de verdad.
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useApp } from '../state'
import { Icon } from '../components/Icon'
import { BusyButton, DropZone, FileRow, Notice, errorMessage } from '../components/ui'
import { baseName, download } from '../lib/files'
import { PRESETS, areaFromCorners, clampArea, groupByPage, phraseMatcher, redactPdf, type Area, type Matcher } from '../lib/pdfRedact'
import { track } from '../../shared/analytics'
import { PageNav, usePdfPreview } from './PdfPreview'

const MIN_SIZE = 0.006

export function RedactTool() {
  const { toast } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const { doc, pages, ready, pageNo, setPageNo, preview, error, setError } = usePdfPreview(file)
  const [areas, setAreas] = useState<Area[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setAreas([])
    setSelected(null)
  }, [file])

  const search = async (match: Matcher, label: string) => {
    if (!doc) return
    setSearching(true)
    setError(null)
    try {
      const { searchAreas } = await import('../lib/pdfRedactSources')
      const found = await searchAreas(doc, match)
      setAreas((prev) => [...prev, ...found])
      const inPages = groupByPage(found).size
      if (!found.length) toast(`No se encontró ${label}. Si el PDF es escaneado, márcalo a mano.`)
      else {
        toast(`${found.length === 1 ? 'Se marcó 1 coincidencia' : `Se marcaron ${found.length} coincidencias`} en ${inPages} ${inPages === 1 ? 'página' : 'páginas'}.`)
        // Llevar la vista a la primera página con coincidencias.
        setPageNo(Math.min(...found.map((a) => a.page)) + 1)
      }
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSearching(false)
    }
  }

  const save = async () => {
    if (!file || !doc) return
    setBusy(true)
    setError(null)
    try {
      const { makeRasterizer } = await import('../lib/pdfRedactSources')
      const raster = makeRasterizer(doc)
      const total = groupByPage(areas).size
      let done = 0
      const out = await redactPdf(await file.arrayBuffer(), areas, async (i, a) => {
        setStatus(`Censurando página ${++done} de ${total}…`)
        return raster(i, a)
      })
      download(out, `${baseName(file.name)}-censurado.pdf`, 'application/pdf')
      track('pdf_tool_used', { tool_name: 'redact' })
      toast('Listo. El archivo se descargó.')
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_redact', error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title="Toca para seleccionar el PDF a censurar" hint="O arrástralo aquí" onFiles={([f]) => setFile(f)} />
      </div>
    )
  }

  const onPage = areas.map((a, i) => ({ a, i })).filter(({ a }) => a.page === pageNo - 1)
  const pagesWithAreas = groupByPage(areas).size

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

        <form
          className="field"
          onSubmit={(e) => {
            e.preventDefault()
            if (query.trim()) void search(phraseMatcher(query), `"${query.trim()}"`)
          }}
        >
          <span>Buscar y marcar en todas las páginas</span>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input className="input" value={query} placeholder="Un nombre, un número, una palabra…" onChange={(e) => setQuery(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
            <button type="submit" className="btn btn-soft" disabled={!ready || searching || !query.trim()}><Icon name="eye" /> Buscar</button>
          </div>
        </form>
        <div className="row">
          <span className="faint">O marca todos los</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!ready || searching} onClick={() => search(PRESETS.correos, 'ningún correo')}>Correos</button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!ready || searching} onClick={() => search(PRESETS.numeros, 'ningún número largo')}>Números (cédulas, teléfonos, cuentas)</button>
        </div>
      </div>

      <div className="card stack">
        {preview ? (
          <>
            <p className="faint" style={{ margin: 0 }}>Arrastra sobre la página para tapar una zona. Toca una zona para moverla o quitarla.</p>
            <div className="sign-frame">
              <RedactStage
                url={preview.url}
                page={pageNo - 1}
                areas={onPage}
                selected={selected}
                onSelect={setSelected}
                onAdd={(a) => {
                  setSelected(areas.length)
                  setAreas((prev) => [...prev, a])
                }}
                onChange={(i, a) => setAreas((prev) => prev.map((x, j) => (j === i ? a : x)))}
                onRemove={(i) => {
                  setAreas((prev) => prev.filter((_, j) => j !== i))
                  setSelected(null)
                }}
              />
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <PageNav pageNo={pageNo} pages={pages} onChange={setPageNo} />
              <span className="faint">
                {areas.length ? `${areas.length} ${areas.length === 1 ? 'zona' : 'zonas'} en ${pagesWithAreas} ${pagesWithAreas === 1 ? 'página' : 'páginas'}` : 'Sin zonas marcadas'}
              </span>
            </div>
            {areas.length > 0 && (
              <div className="row">
                <button type="button" className="btn btn-ghost btn-sm" disabled={!onPage.length} onClick={() => setAreas((prev) => prev.filter((a) => a.page !== pageNo - 1))}><Icon name="reset" /> Quitar las de esta página</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAreas([]); setSelected(null) }}><Icon name="trash" /> Quitar todas</button>
              </div>
            )}
          </>
        ) : (
          !error && <p className="faint">Preparando la vista previa…</p>
        )}
        <Notice kind="info">
          Lo tapado se elimina de verdad: las páginas con zonas marcadas se convierten en imagen, así que su texto ya no se puede copiar ni buscar. Las demás páginas quedan igual. Revisa todas las páginas antes de descargar.
        </Notice>
        {status && <small className="faint">{status}</small>}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end">
          <BusyButton busy={busy} disabled={!ready || !areas.length} onClick={save} icon="download">
            Censurar y descargar
          </BusyButton>
        </div>
      </div>
    </div>
  )
}

type Indexed = { a: Area; i: number }

/** Página con las zonas encima: arrastrar en vacío dibuja una zona nueva. */
function RedactStage({
  url,
  page,
  areas,
  selected,
  onSelect,
  onAdd,
  onChange,
  onRemove,
}: {
  url: string
  page: number
  areas: Indexed[]
  selected: number | null
  onSelect: (i: number | null) => void
  onAdd: (a: Area) => void
  onChange: (i: number, a: Area) => void
  onRemove: (i: number) => void
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<Area | null>(null)
  const drag = useRef<{ kind: 'new'; x: number; y: number } | { kind: 'move'; i: number; x: number; y: number; start: Area } | null>(null)

  const frac = (e: PointerEvent) => {
    const r = stage.current!.getBoundingClientRect()
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as const
  }

  const startNew = (e: PointerEvent<HTMLElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect(null)
    const [x, y] = frac(e)
    drag.current = { kind: 'new', x, y }
    setDraft(areaFromCorners(page, x, y, x, y))
  }
  const startMove = (i: number, a: Area) => (e: PointerEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    onSelect(i)
    const [x, y] = frac(e)
    drag.current = { kind: 'move', i, x, y, start: a }
  }
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    const [x, y] = frac(e)
    if (d.kind === 'new') setDraft(areaFromCorners(page, d.x, d.y, x, y))
    else onChange(d.i, clampArea({ ...d.start, x: d.start.x + x - d.x, y: d.start.y + y - d.y }))
  }
  const end = () => {
    if (drag.current?.kind === 'new' && draft && draft.w >= MIN_SIZE && draft.h >= MIN_SIZE) onAdd(draft)
    drag.current = null
    setDraft(null)
  }

  const keys = (i: number, a: Area) => (e: KeyboardEvent<HTMLElement>) => {
    const step = e.shiftKey ? 0.02 : 0.005
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }
    if (moves[e.key]) onChange(i, clampArea({ ...a, x: a.x + moves[e.key][0], y: a.y + moves[e.key][1] }))
    else if (e.key === 'Delete' || e.key === 'Backspace') onRemove(i)
    else return
    e.preventDefault()
  }

  const pos = (a: Area) => ({ left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: `${a.w * 100}%`, height: `${a.h * 100}%` })

  return (
    <div className="sign-stage redact-stage" ref={stage} onPointerDown={startNew} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <img src={url} alt={`Página ${page + 1}`} draggable={false} />
      {areas.map(({ a, i }) => (
        <div
          key={i}
          className={'redact-box' + (selected === i ? ' is-selected' : '')}
          style={pos(a)}
          role="group"
          tabIndex={0}
          aria-label="Zona a censurar. Flechas para mover, Suprimir para quitarla."
          onFocus={() => onSelect(i)}
          onKeyDown={keys(i, a)}
          onPointerDown={startMove(i, a)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <button type="button" className="sign-del" aria-label="Quitar esta zona" onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemove(i)}>
            <Icon name="close" />
          </button>
        </div>
      ))}
      {draft && <div className="redact-box is-draft" style={pos(draft)} />}
    </div>
  )
}
