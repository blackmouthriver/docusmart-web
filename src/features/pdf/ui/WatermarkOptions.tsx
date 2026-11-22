// Opciones de la marca de agua (W-146.2): texto o imagen, posición o mosaico, rotación,
// transparencia, tamaño, color, encima o detrás del contenido y páginas.
import { DropZone, FileRow, Segmented } from '../../../shared/ui/ui'
import { tr } from '../../../shared/i18n/translate'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { DEFAULT_WATERMARK, WATERMARK_POSITIONS, type WatermarkOptions, type WatermarkPosition, type WatermarkSize } from '../core/pdfWatermark'

export type WatermarkUi = {
  mode: 'text' | 'image'
  text: string
  image: File | null
  position: WatermarkPosition
  rotation: '0' | '45' | '90' | '-45'
  /** Opacidad en porcentaje (5 a 100). */
  opacity: number
  size: WatermarkSize
  color: string
  layer: 'over' | 'under'
  /** Páginas como "1-3, 5" (vacío: todas). */
  pages: string
}

export const watermarkUiDefault = (text: string): WatermarkUi => ({
  mode: 'text',
  text,
  image: null,
  position: 'center',
  rotation: '45',
  opacity: 20,
  size: 'medium',
  color: DEFAULT_WATERMARK.color,
  layer: 'over',
  pages: '',
})

const COLORS: Array<{ value: string; key: MessageKey }> = [
  { value: '#2563EB', key: 'wm.color.blue' },
  { value: '#DC2626', key: 'wm.color.red' },
  { value: '#6B7280', key: 'wm.color.gray' },
  { value: '#111827', key: 'wm.color.black' },
]

/** ¿Hay algo que estampar? (texto escrito o imagen elegida). */
export const watermarkReady = (w: WatermarkUi) => (w.mode === 'image' ? !!w.image : !!w.text.trim())

/** Las opciones para `watermarkPdf`. La imagen se pasa a PNG si no es JPG ni PNG. */
export async function toWatermarkOptions(w: WatermarkUi, pages: number[] | undefined): Promise<Partial<WatermarkOptions>> {
  let image: WatermarkOptions['image']
  if (w.mode === 'image' && w.image) {
    if (w.image.type === 'image/png' || w.image.type === 'image/jpeg') image = { data: new Uint8Array(await w.image.arrayBuffer()), format: w.image.type === 'image/png' ? 'png' : 'jpg' }
    else {
      const bmp = await createImageBitmap(w.image)
      const c = document.createElement('canvas')
      c.width = bmp.width
      c.height = bmp.height
      c.getContext('2d')!.drawImage(bmp, 0, 0)
      bmp.close()
      image = { data: new Uint8Array(await (await canvasToBlob(c, 'image/png')).arrayBuffer()), format: 'png' }
    }
  }
  return { text: w.text, image, position: w.position, rotation: Number(w.rotation), opacity: w.opacity / 100, size: w.size, color: w.color, layer: w.layer, pages }
}

export function WatermarkOptionsPanel({ value: w, onChange, pagesInvalid }: { value: WatermarkUi; onChange: (w: WatermarkUi) => void; pagesInvalid: boolean }) {
  const set = (patch: Partial<WatermarkUi>) => onChange({ ...w, ...patch })
  const mosaic = w.position === 'mosaic'
  return (
    <div className="stack" style={{ gap: 14 }}>
      <Segmented label={tr('wm.mode')} value={w.mode} onChange={(mode) => set({ mode })} options={[{ value: 'text', label: tr('wm.mode.text') }, { value: 'image', label: tr('wm.mode.image') }]} />
      {w.mode === 'text' ? (
        <label className="field">
          <span>{tr('single.markText')}</span>
          <input className="input" value={w.text} maxLength={40} onChange={(e) => set({ text: e.target.value })} />
        </label>
      ) : w.image ? (
        <ul className="file-list" style={{ marginTop: 0 }}>
          <FileRow file={w.image} actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ image: null })}>{tr('common.change')}</button>} />
        </ul>
      ) : (
        <DropZone accept="image/png,image/jpeg,image/webp" title={tr('wm.pickImage')} hint={tr('wm.pickImageHint')} onFiles={([f]) => set({ image: f })} />
      )}

      <div className="number-options">
        <div className="field">
          <span id="wm-pos-label">{tr('single.position')}</span>
          <div className="pos-grid pos-grid-9" role="radiogroup" aria-labelledby="wm-pos-label">
            {WATERMARK_POSITIONS.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={w.position === p} aria-label={tr(`wm.pos.${p}` as MessageKey)} title={tr(`wm.pos.${p}` as MessageKey)} className={'pos-cell pos9-' + p} onClick={() => set({ position: p })}>
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm wm-mosaic" aria-pressed={mosaic} onClick={() => set({ position: mosaic ? 'center' : 'mosaic' })} style={{ marginTop: 6 }}>
            {tr('wm.mosaic')}
          </button>
        </div>
        <div className="stack" style={{ gap: 12, flex: 1 }}>
          <div className="field">
            <span aria-hidden="true">{tr('wm.rotation')}</span>
            <Segmented label={tr('wm.rotation')} value={w.rotation} onChange={(rotation) => set({ rotation })} options={[{ value: '0', label: '0°' }, { value: '45', label: '45°' }, { value: '90', label: '90°' }, { value: '-45', label: '−45°' }]} />
          </div>
          <div className="field">
            <span aria-hidden="true">{tr('number.size')}</span>
            <Segmented label={tr('number.size')} value={w.size} onChange={(size) => set({ size })} options={[{ value: 'small', label: tr('number.size.s') }, { value: 'medium', label: tr('number.size.m') }, { value: 'large', label: tr('number.size.l') }]} />
          </div>
          <label className="field">
            <span>{tr('wm.opacity', { n: w.opacity })}</span>
            <input type="range" min={5} max={100} step={5} value={w.opacity} onChange={(e) => set({ opacity: Number(e.target.value) })} />
          </label>
        </div>
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        {w.mode === 'text' && (
          <div className="field">
            <span id="wm-color-label">{tr('sign.color')}</span>
            <div className="accent-row" role="radiogroup" aria-labelledby="wm-color-label">
              {COLORS.map((c) => (
                <button key={c.value} type="button" role="radio" aria-checked={w.color === c.value} aria-label={tr(c.key)} title={tr(c.key)} className="accent-swatch" style={{ background: c.value }} onClick={() => set({ color: c.value })} />
              ))}
            </div>
          </div>
        )}
        <div className="field">
          <span aria-hidden="true">{tr('wm.layer')}</span>
          <Segmented label={tr('wm.layer')} value={w.layer} onChange={(layer) => set({ layer })} options={[{ value: 'over', label: tr('wm.layer.over') }, { value: 'under', label: tr('wm.layer.under') }]} />
          {w.layer === 'under' && <small className="faint">{tr('wm.layer.underHint')}</small>}
        </div>
        <label className="field" style={{ width: 200 }}>
          <span>{tr('wm.pages')}</span>
          <input className="input" value={w.pages} placeholder={tr('wm.pagesPh')} onChange={(e) => set({ pages: e.target.value })} aria-invalid={pagesInvalid || undefined} />
          {pagesInvalid && <small style={{ color: 'var(--danger)' }}>{tr('wm.pagesBad')}</small>}
        </label>
      </div>
    </div>
  )
}
