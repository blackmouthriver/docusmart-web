import { useEffect, useState, type ComponentType } from 'react'
import { go, useApp } from '../../../app/state'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { BackButton, BusyButton, DropZone, FileRow, HeroCard, Notice, Segmented, errorMessage } from '../../../shared/ui/ui'
import { baseName, chunkPages, moveItem, parsePageRanges, parseRangeGroups } from '../../../shared/files/files'
import { closePdf, openPdf, renderPage } from '../../../shared/pdf/pdf'
import { composePages, extractPages, mergePdfs, numberPages, rotate, splitEach, splitGroups, watermark, NUMBER_POSITIONS, DEFAULT_NUMBER_OPTIONS, type NumberPosition, type Sheet } from '../core/pdfTools'
import { useSortable } from '../../../shared/ui/useSortable'
import { track } from '../../../shared/platform/analytics'
import { CompressTool, ProtectTool, RepairTool, UnlockTool } from '../../security/ui/PdfSecurityTools'
import { OcrTool } from '../../ocr/ui/OcrTool'
import { CropTool } from './CropTool'
import { SignTool } from './SignTool'
import { RedactTool } from './RedactTool'
import { CompareTool } from './CompareTool'
import { ExtractImagesTool } from './ExtractImagesTool'
import { EditTool } from './EditTool'
import { FormTool } from './FormTool'
import { ScanTool } from '../../scan/ui/ScanTool'
import { PdfATool } from '../../pdfa/ui/PdfATool'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'

/** Nombre y descripción de cada herramienta, en el idioma de la página. */
export const toolName = (id: string) => tr(`tool.${id}` as MessageKey)
export const toolDesc = (id: string) => tr(`tool.${id}.desc` as MessageKey)
import { BeforeAfter } from '../../../shared/ui/DocPreview'
import { bundleFiles, resultFile } from '../../../shared/files/share'

const TOOLS: Array<{ id: string; icon: IconName; cls: string }> = [
  { id: 'editar', icon: 'edit', cls: 'ico-blue' },
  { id: 'formulario', icon: 'form', cls: 'ico-green' },
  { id: 'escanear', icon: 'camera', cls: 'ico-cyan' },
  { id: 'unir', icon: 'merge', cls: 'ico-red' },
  { id: 'dividir', icon: 'split', cls: 'ico-violet' },
  { id: 'rotar', icon: 'rotate', cls: 'ico-blue' },
  { id: 'reordenar', icon: 'reorder', cls: 'ico-cyan' },
  { id: 'recortar', icon: 'crop', cls: 'ico-amber' },
  { id: 'firmar', icon: 'pen', cls: 'ico-blue' },
  { id: 'censurar', icon: 'redact', cls: 'ico-red' },
  { id: 'comparar', icon: 'compare', cls: 'ico-violet' },
  { id: 'imagenes', icon: 'images', cls: 'ico-violet' },
  { id: 'numerar', icon: 'hash', cls: 'ico-green' },
  { id: 'marca', icon: 'stamp', cls: 'ico-amber' },
  { id: 'comprimir', icon: 'compress', cls: 'ico-green' },
  { id: 'proteger', icon: 'lock', cls: 'ico-amber' },
  { id: 'desbloquear', icon: 'unlock', cls: 'ico-blue' },
  { id: 'reparar', icon: 'wrench', cls: 'ico-violet' },
  { id: 'pdfa', icon: 'archive', cls: 'ico-cyan' },
  { id: 'ocr', icon: 'text', cls: 'ico-cyan' },
]

const PDF_TYPE = 'application/pdf'

/** Título del resultado, propio de cada herramienta. */
const title = (toolId: string) => tr(`single.title.${toolId}` as MessageKey)

/** Herramientas con su propio componente (las demás usan SingleFileTool). */
export const OWN_TOOLS: Record<string, ComponentType> = {
  unir: MergeTool,
  comprimir: CompressTool,
  proteger: ProtectTool,
  desbloquear: UnlockTool,
  reparar: RepairTool,
  ocr: OcrTool,
  recortar: CropTool,
  firmar: SignTool,
  censurar: RedactTool,
  comparar: CompareTool,
  imagenes: ExtractImagesTool,
  editar: EditTool,
  formulario: FormTool,
  escanear: ScanTool,
  pdfa: PdfATool,
}

export function PdfTools({ sub }: { sub?: string }) {
  const tool = TOOLS.find((t) => t.id === sub)
  const Own = tool ? OWN_TOOLS[tool.id] : undefined
  return (
    <>
      <HeroCard title={tr('pdf.heroTitle')} subtitle={tr('pdf.heroSub')} />
      {tool ? (
        <>
          <BackButton label={tr('pdf.back')} onClick={() => go('pdf')} />
          <h2 style={{ fontSize: 26, margin: '6px 0 4px' }}>{toolName(tool.id)}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{toolDesc(tool.id)}</p>
          {Own ? <Own /> : <SingleFileTool key={tool.id} toolId={tool.id} />}
        </>
      ) : (
        <>
          <h2 className="section-title">{tr('pdf.choose')}</h2>
          <div className="tool-grid">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" className="tool-card" onClick={() => go('pdf', t.id)}>
                <span className={'ico ' + t.cls}><Icon name={t.icon} /></span>
                <span>
                  <b>{toolName(t.id)}</b>
                  <small>{toolDesc(t.id)}</small>
                </span>
              </button>
            ))}
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
  const run = async (fn: () => Promise<void>, okMsg = tr('pdf.downloadedToast')) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      track('pdf_tool_used', { tool_name: toolName })
      toast(okMsg)
    } catch (e) {
      setError(errorMessage(e))
      track('app_error', { error_context: 'pdf_tool_' + toolName, error_message: e instanceof Error ? e.name : 'error' })
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

let nextId = 0
const withId = (file: File) => ({ id: ++nextId, file })

export function MergeTool() {
  const [files, setFiles] = useState<Array<{ id: number; file: File }>>([])
  const [bookmarks, setBookmarks] = useState<'keep' | 'perFile'>('keep')
  const { busy, error, run } = useRun('merge')
  const [output, setOutput] = useState<File | null>(null)
  // Agregar, quitar u ordenar los PDF (o cambiar los marcadores) invalida el resultado anterior.
  useEffect(() => setOutput(null), [files, bookmarks])
  const move = (i: number, j: number) => setFiles((p) => moveItem(p, i, j))
  const sort = useSortable(files.length, move)
  return (
    <div className="card stack">
      <DropZone accept="application/pdf" multiple title={tr('merge.pick')} hint={tr('merge.pickHint')} onFiles={(f) => setFiles((p) => [...p, ...f.map(withId)])} />
      {files.length > 0 && (
        <ul className={'file-list sortable' + (sort.dragging ? ' is-sorting' : '')}>
          {files.map(({ id, file: f }, i) => (
            <FileRow
              key={id}
              file={f}
              extra={`#${i + 1}`}
              rowProps={sort.item(i)}
              lead={
                files.length > 1 && (
                  <button type="button" className="icon-btn drag-handle" aria-label={tr('merge.drag', { name: f.name })} title={tr('merge.drag', { name: f.name })} {...sort.handle(i)}>
                    <Icon name="grip" />
                  </button>
                )
              }
              actions={
                <>
                  <button type="button" className="icon-btn" aria-label={tr('merge.up')} disabled={i === 0} onClick={() => move(i, i - 1)}><Icon name="up" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('merge.down')} disabled={i === files.length - 1} onClick={() => move(i, i + 1)}><Icon name="downArrow" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('merge.remove', { name: f.name })} onClick={() => setFiles((p) => p.filter((x) => x.id !== id))}><Icon name="close" /></button>
                </>
              }
            />
          ))}
        </ul>
      )}
      {files.length > 1 && (
        <div className="stack" style={{ gap: 6 }}>
          <Segmented
            label={tr('merge.bookmarks')}
            value={bookmarks}
            onChange={setBookmarks}
            options={[
              { value: 'keep', label: tr('merge.bookmarks.keep') },
              { value: 'perFile', label: tr('merge.bookmarks.perFile') },
            ]}
          />
          <small className="faint">{tr('merge.keepsHint')}</small>
        </div>
      )}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton
          busy={busy}
          disabled={files.length < 2}
          icon="merge"
          onClick={() =>
            run(async () => {
              const inputs = await Promise.all(files.map(async ({ file }) => ({ bytes: await file.arrayBuffer(), name: file.name })))
              const out = await mergePdfs(inputs, { bookmarks })
              setOutput(resultFile(out, `${baseName(files[0].file.name)}-${tr('file.merged')}.pdf`, PDF_TYPE))
            }, tr('common.doneReview'))
          }
        >
          {files.length < 2 ? tr('merge.needTwo') : tr('merge.go', { n: files.length })}
        </BusyButton>
      </div>
      {files.length > 0 && (
        <BeforeAfter
          originals={files.map((x) => x.file)}
          result={output}
          labels={[tr('merge.labelIn'), tr('merge.labelOut')]}
          toolName="merge"
          title={tr('merge.title')}
          previewTitle={tr('merge.previewTitle')}
          placeholder={busy ? tr('merge.busy') : files.length < 2 ? tr('merge.addAnother') : tr('merge.press', { n: files.length })}
        />
      )}
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
    void (async () => {
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

type SplitMode = 'range' | 'groups' | 'every' | 'each'
type SheetItem = { id: number; sheet: Sheet }
const sheetsOf = (count: number): SheetItem[] => Array.from({ length: count }, (_, i) => ({ id: ++nextId, sheet: i }))
/** Grados de 0 a 359 (las rotaciones a la izquierda suman negativos). */
const norm = (deg: number) => ((deg % 360) + 360) % 360
/** Nombre de cada parte al dividir: "informe-4-8.pdf". */
const partName = (name: string, group: number[]) => `${name}-${group[0] + 1}${group.length > 1 ? `-${group[group.length - 1] + 1}` : ''}.pdf`

export function SingleFileTool({ toolId }: { toolId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const { thumbs, error: loadError } = useThumbs(file)
  const trackName = { dividir: 'split', rotar: 'rotate', reordenar: 'reorder_pages', numerar: 'number_pages', marca: 'watermark' }[toolId] ?? toolId
  const { busy, error, run } = useRun(trackName)

  // Estado por herramienta
  const [splitMode, setSplitMode] = useState<SplitMode>('range')
  const [range, setRange] = useState('')
  const [groupsText, setGroupsText] = useState('')
  const [every, setEvery] = useState(2)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rotations, setRotations] = useState<number[]>([])
  const [order, setOrder] = useState<SheetItem[]>([])
  const [position, setPosition] = useState<NumberPosition>(DEFAULT_NUMBER_OPTIONS.position)
  const [template, setTemplate] = useState(DEFAULT_NUMBER_OPTIONS.template)
  const [start, setStart] = useState(1)
  const [skip, setSkip] = useState(0)
  const [size, setSize] = useState<'9' | '11' | '14'>('11')
  const [mark, setMark] = useState(() => tr('out.watermarkDefault'))
  /** Resultado listo para ver y guardar (ya no se descarga solo). */
  const [output, setOutput] = useState<File | null>(null)
  /** Dividir en varios archivos: los PDF de cada parte y el ZIP para guardarlos. */
  const [parts, setParts] = useState<{ files: File[]; zip: File | null } | null>(null)

  const count = thumbs.length
  const withThumbs = toolId === 'dividir' || toolId === 'rotar' || toolId === 'reordenar'
  useEffect(() => {
    setSelected(new Set())
    setRange('')
    setGroupsText('')
  }, [file])
  // Cualquier cambio de archivo u opciones invalida el resultado anterior.
  useEffect(() => {
    setOutput(null)
    setParts(null)
  }, [file, splitMode, range, groupsText, every, selected, rotations, order, position, template, start, skip, size, mark])
  useEffect(() => {
    setRotations(Array(count).fill(0))
    setOrder(sheetsOf(count))
  }, [count])
  const sort = useSortable(order.length, (from, to) => setOrder((o) => moveItem(o, from, to)))

  const name = file ? baseName(file.name) : ''
  const bytes = () => file!.arrayBuffer()

  const ranges = range.trim() ? parsePageRanges(range, count) : null
  const pagesFromSelection = [...selected].sort((a, b) => a - b)
  const groups = splitMode === 'groups' ? (groupsText.trim() ? parseRangeGroups(groupsText, count) : null) : splitMode === 'every' ? chunkPages(count, every) : null

  const splitInto = async (list: number[][]) => {
    const files = (await splitGroups(await bytes(), list)).map((d, i) => resultFile(d, partName(name, list[i]), PDF_TYPE))
    setParts({ files, zip: await bundleFiles(files, `${name}-${tr('file.pages')}.zip`) })
  }

  let action: { label: string; disabled: boolean; go: () => Promise<void> } = { label: '', disabled: true, go: async () => {} }
  if (toolId === 'dividir') {
    if (splitMode === 'each')
      action = {
        label: tr('single.splitEach', { n: count }),
        disabled: count < 2,
        go: async () => {
          const files = (await splitEach(await bytes())).map((d, i) => resultFile(d, `${name}-${tr('file.page')}-${i + 1}.pdf`, PDF_TYPE))
          setParts({ files, zip: await bundleFiles(files, `${name}-${tr('file.pages')}.zip`) })
        },
      }
    else if (splitMode === 'groups' || splitMode === 'every')
      action = {
        label: tr('single.splitFiles', { n: groups?.length ?? 0 }),
        disabled: !groups || groups.length < (splitMode === 'every' ? 2 : 1),
        go: () => splitInto(groups!),
      }
    else
      action = {
        label: tr('single.extract'),
        disabled: !(ranges ?? pagesFromSelection).length,
        go: async () => setOutput(resultFile(await extractPages(await bytes(), ranges ?? pagesFromSelection), `${name}-${tr('file.extract')}.pdf`, PDF_TYPE)),
      }
  } else if (toolId === 'rotar') {
    const changed = rotations.some((r) => norm(r) !== 0)
    action = {
      label: tr('single.rotate'),
      disabled: !changed,
      go: async () => {
        let data: ArrayBuffer | Uint8Array = await bytes()
        for (const angle of [90, 180, 270] as const) {
          const idx = rotations.map((r, i) => (norm(r) === angle ? i : -1)).filter((i) => i >= 0)
          if (idx.length) data = await rotate(toArrayBuffer(data), idx, angle)
        }
        setOutput(resultFile(data as Uint8Array, `${name}-${tr('file.rotated')}.pdf`, PDF_TYPE))
      },
    }
  } else if (toolId === 'reordenar') {
    const same = order.length === count && order.every((o, i) => o.sheet === i)
    action = {
      label: tr('single.reorder'),
      disabled: same || order.length === 0,
      go: async () => setOutput(resultFile(await composePages(await bytes(), order.map((o) => o.sheet)), `${name}-${tr('file.reordered')}.pdf`, PDF_TYPE)),
    }
  } else if (toolId === 'numerar') {
    action = {
      label: tr('single.number'),
      disabled: !count || !template.trim(),
      go: async () =>
        setOutput(resultFile(await numberPages(await bytes(), { position, template, start, skip, size: Number(size) }), `${name}-${tr('file.numbered')}.pdf`, PDF_TYPE)),
    }
  } else if (toolId === 'marca') {
    action = {
      label: tr('single.watermark'),
      disabled: !count || !mark.trim(),
      go: async () => setOutput(resultFile(await watermark(await bytes(), mark), `${name}-${tr('file.watermark')}.pdf`, PDF_TYPE)),
    }
  }

  if (!file) {
    return (
      <div className="card">
        <DropZone accept="application/pdf" title={tr('common.pickPdf')} hint={tr('common.dragHere')} onFiles={([f]) => setFile(f)} />
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
  const turn = (pageIdx: number, by: number) => setRotations((r) => r.map((v, i) => (i === pageIdx ? v + by : v)))
  const templates = ['{n}', '{n} / {total}', tr('number.tplPage')]

  return (
    <div className="card stack">
      <ul className="file-list" style={{ marginTop: 0 }}>
        <FileRow
          file={file}
          extra={count ? tr('single.pagesN', { n: count }) : tr('single.reading')}
          actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setFile(null)}>{tr('common.change')}</button>}
        />
      </ul>

      {/* Numerar y marca de agua no tienen miniaturas: se ve el documento y el resultado al lado. */}
      {!withThumbs && (
        <BeforeAfter
          original={file}
          result={output}
          toolName={trackName}
          title={title(toolId)}
          previewTitle={tr('common.previewPdf')}
          placeholder={busy ? tr('common.processing') : tr('common.chooseApply')}
        />
      )}

      {toolId === 'dividir' && (
        <>
          <Segmented
            label={tr('single.splitMode')}
            value={splitMode}
            onChange={setSplitMode}
            options={[
              { value: 'range', label: tr('single.splitPick') },
              { value: 'groups', label: tr('single.splitGroupsOpt') },
              { value: 'every', label: tr('single.splitEveryOpt') },
              { value: 'each', label: tr('single.splitEachOpt') },
            ]}
          />
          {splitMode === 'range' && (
            <label className="field">
              <span>{tr('single.rangeLabel')}</span>
              <input className="input" value={range} placeholder="1-3, 5, 8-" onChange={(e) => setRange(e.target.value)} />
              {range.trim() && !ranges && <small style={{ color: 'var(--danger)' }}>{tr('single.rangeBad', { n: count })}</small>}
            </label>
          )}
          {splitMode === 'groups' && (
            <label className="field">
              <span>{tr('single.groupsLabel')}</span>
              <input className="input" value={groupsText} placeholder="1-3, 4-8, 9-" onChange={(e) => setGroupsText(e.target.value)} />
              {groupsText.trim() && !groups ? (
                <small style={{ color: 'var(--danger)' }}>{tr('single.rangeBad', { n: count })}</small>
              ) : (
                groups && <small className="faint">{tr('single.groupsHint', { n: groups.length })}</small>
              )}
            </label>
          )}
          {splitMode === 'every' && (
            <label className="field">
              <span>{tr('single.everyLabel')}</span>
              <input className="input" type="number" inputMode="numeric" min={1} max={Math.max(1, count)} value={every} onChange={(e) => setEvery(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
              {groups && <small className="faint">{tr('single.groupsHint', { n: groups.length })}</small>}
            </label>
          )}
        </>
      )}

      {toolId === 'numerar' && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="number-options">
            <div className="field">
              <span id="number-pos-label">{tr('single.position')}</span>
              <div className="pos-grid" role="radiogroup" aria-labelledby="number-pos-label">
                {NUMBER_POSITIONS.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={position === p} aria-label={tr(`number.pos.${p}` as MessageKey)} title={tr(`number.pos.${p}` as MessageKey)} className={'pos-cell pos-' + p} onClick={() => setPosition(p)}>
                    <span aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div className="stack" style={{ gap: 10, flex: 1, minWidth: 0 }}>
              <Segmented label={tr('single.format')} value={template} onChange={setTemplate} options={templates.map((v) => ({ value: v, label: v.replace('{n}', '1').replace('{total}', '10') }))} />
              <label className="field">
                <span>{tr('number.text')}</span>
                <input className="input" value={template} maxLength={60} onChange={(e) => setTemplate(e.target.value)} aria-describedby="number-text-hint" />
                <small className="faint" id="number-text-hint">{tr('number.textHint')}</small>
              </label>
            </div>
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <label className="field" style={{ width: 130 }}>
              <span>{tr('number.start')}</span>
              <input className="input" type="number" inputMode="numeric" min={0} value={start} onChange={(e) => setStart(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
            </label>
            <label className="field" style={{ width: 210 }}>
              <span>{tr('number.skip')}</span>
              <input className="input" type="number" inputMode="numeric" min={0} max={Math.max(0, count - 1)} value={skip} onChange={(e) => setSkip(Math.max(0, Math.floor(Number(e.target.value) || 0)))} aria-describedby="number-skip-hint" />
              <small className="faint" id="number-skip-hint">{tr('number.skipHint')}</small>
            </label>
            <div className="field">
              <span aria-hidden="true">{tr('number.size')}</span>
              <Segmented label={tr('number.size')} value={size} onChange={setSize} options={[{ value: '9', label: tr('number.size.s') }, { value: '11', label: tr('number.size.m') }, { value: '14', label: tr('number.size.l') }]} />
            </div>
          </div>
        </div>
      )}

      {toolId === 'marca' && (
        <label className="field">
          <span>{tr('single.markText')}</span>
          <input className="input" value={mark} maxLength={40} onChange={(e) => setMark(e.target.value)} />
        </label>
      )}

      {loadError && <Notice kind="error">{loadError}</Notice>}

      {toolId === 'reordenar' && count > 0 && <small className="faint">{tr('single.reorderHint')}</small>}

      {(toolId === 'dividir' && splitMode === 'range') || toolId === 'rotar' ? (
        <div className="thumbs">
          {thumbs.map((src, pageIdx) =>
            toolId === 'dividir' ? (
              <button key={pageIdx} type="button" className="thumb" aria-pressed={selected.has(pageIdx)} onClick={() => { setRange(''); toggle(pageIdx) }}>
                <img src={src} alt={tr('single.pageAlt', { n: pageIdx + 1 })} />
                <span>{pageIdx + 1}</span>
              </button>
            ) : (
              <div key={pageIdx} className="thumb">
                <button type="button" className="thumb-hit" onClick={() => turn(pageIdx, 90)} aria-label={tr('single.rotatePage', { n: pageIdx + 1 })}>
                  <img src={src} alt="" style={{ transform: `rotate(${rotations[pageIdx] ?? 0}deg) scale(${norm(rotations[pageIdx] ?? 0) % 180 ? 0.72 : 1})` }} />
                </button>
                <span>{pageIdx + 1} · {norm(rotations[pageIdx] ?? 0)}°</span>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn flip-x" aria-label={tr('single.rotateLeft', { n: pageIdx + 1 })} onClick={() => turn(pageIdx, -90)}><Icon name="rotate" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.rotateRight', { n: pageIdx + 1 })} onClick={() => turn(pageIdx, 90)}><Icon name="rotate" /></button>
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}

      {toolId === 'reordenar' && count > 0 && (
        <div className={'thumbs sortable' + (sort.dragging ? ' is-sorting' : '')}>
          {order.map(({ id, sheet }, pos) => {
            const src = sheet === 'blank' ? null : thumbs[sheet]
            if (sheet !== 'blank' && !src) return null
            const label = sheet === 'blank' ? tr('single.blankPage') : tr('single.pageShort', { n: sheet + 1 })
            return (
              <div key={id} className="thumb" {...sort.item(pos)}>
                <button type="button" className="drag-handle thumb-drag" aria-label={tr('single.dragPage', { name: label })} title={tr('single.dragPage', { name: label })} {...sort.handle(pos)}>
                  {src ? <img src={src} alt="" draggable={false} /> : <span className="thumb-blank" aria-hidden="true" />}
                  <span className="thumb-grip" aria-hidden="true"><Icon name="grip" /></span>
                </button>
                <span>{label}</span>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn" aria-label={tr('single.moveBefore')} disabled={pos === 0} onClick={() => setOrder((o) => moveItem(o, pos, pos - 1))}><Icon name="back" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.moveAfter')} disabled={pos === order.length - 1} onClick={() => setOrder((o) => moveItem(o, pos, pos + 1))} style={{ transform: 'scaleX(-1)' }}><Icon name="back" /></button>
                </div>
                <div className="thumb-actions">
                  <button type="button" className="icon-btn" aria-label={tr('single.duplicatePage', { name: label })} title={tr('single.duplicatePage', { name: label })} onClick={() => setOrder((o) => [...o.slice(0, pos + 1), { id: ++nextId, sheet }, ...o.slice(pos + 1)])}><Icon name="copy" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.addBlank', { name: label })} title={tr('single.addBlank', { name: label })} onClick={() => setOrder((o) => [...o.slice(0, pos + 1), { id: ++nextId, sheet: 'blank' }, ...o.slice(pos + 1)])}><Icon name="plus" /></button>
                  <button type="button" className="icon-btn" aria-label={tr('single.removePage')} disabled={order.length === 1} onClick={() => setOrder((o) => o.filter((x) => x.id !== id))}><Icon name="trash" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toolId === 'rotar' && count > 0 && (
        <div className="row">
          <span className="faint">{tr('single.tapRotate')}</span>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setRotations((r) => r.map((v) => v - 90))}>
            <span className="flip-x" style={{ display: 'inline-flex' }}><Icon name="rotate" /></span> {tr('single.rotateAllLeft')}
          </button>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setRotations((r) => r.map((v) => v + 90))}>
            <Icon name="rotate" /> {tr('single.rotateAll')}
          </button>
        </div>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <div className="row row-end">
        <BusyButton busy={busy} disabled={action.disabled} onClick={() => run(action.go, tr('common.doneReview'))} icon="check">
          {action.label}
        </BusyButton>
      </div>
      {withThumbs && output && <BeforeAfter original={file} result={output} toolName={trackName} title={title(toolId)} />}
      {parts && (
        <BeforeAfter
          original={file}
          result={null}
          results={parts.files}
          saveAs={parts.zip}
          toolName={trackName}
          title={tr('single.partsTitle')}
          summary={<Notice kind="success">{tr('single.partsSummary', { n: parts.files.length })}</Notice>}
        />
      )}
    </div>
  )
}

function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
}
