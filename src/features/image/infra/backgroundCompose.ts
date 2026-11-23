// Quitar fondo (W-147.5): el fondo nuevo (color, la foto difuminada u otra imagen) detrás del
// recorte, el pincel para borrar o recuperar partes y la silueta para encuadrar la foto
// documento. Usa canvas: excluido de la cobertura como los demás archivos de infra.
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { blurPx, coverRect, strokeDabs, type Backdrop, type BrushStroke } from '../core/background'

type Drawable = CanvasImageSource & { width: number; height: number }

export function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return { canvas, ctx }
}

/** Lo que va detrás del recorte, ya dibujado al tamaño del resultado (null si es transparente). */
export async function drawBackdrop(backdrop: Backdrop, original: Drawable, width: number, height: number): Promise<HTMLCanvasElement | null> {
  if (backdrop.kind === 'transparent') return null
  const { canvas, ctx } = makeCanvas(width, height)
  if (backdrop.kind === 'color') {
    ctx.fillStyle = backdrop.color
    ctx.fillRect(0, 0, width, height)
  } else if (backdrop.kind === 'blur') {
    // Debajo, blanco y la foto nítida: el desenfoque aclara los bordes y no debe quedar nada
    // transparente. Encima, la foto difuminada y algo más grande que el lienzo.
    const r = blurPx(width, height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(original, 0, 0, width, height)
    ctx.filter = `blur(${r}px)`
    ctx.drawImage(original, -3 * r, -3 * r, width + 6 * r, height + 6 * r)
    ctx.filter = 'none'
  } else {
    const bmp = await createImageBitmap(backdrop.image, { imageOrientation: 'from-image' })
    try {
      const c = coverRect(bmp.width, bmp.height, width, height)
      ctx.drawImage(bmp, c.sx, c.sy, c.sw, c.sh, 0, 0, width, height)
    } finally {
      bmp.close()
    }
  }
  return canvas
}

/** El recorte sobre su fondo, como PNG. */
export async function composeCutout(cut: Drawable, original: Drawable, backdrop: Backdrop): Promise<Blob> {
  const { canvas, ctx } = makeCanvas(cut.width, cut.height)
  const back = await drawBackdrop(backdrop, original, cut.width, cut.height)
  if (back) {
    ctx.drawImage(back, 0, 0)
    back.width = back.height = 0
  }
  ctx.drawImage(cut, 0, 0)
  try {
    return await canvasToBlob(canvas, 'image/png')
  } finally {
    canvas.width = canvas.height = 0
  }
}

/** Aplica un trazo del pincel al recorte: borra (transparente) o devuelve el original en esa zona. */
export function applyStroke(ctx: CanvasRenderingContext2D, original: Drawable, stroke: BrushStroke) {
  const dabs = strokeDabs(stroke.points, stroke.radius)
  if (!dabs.length) return
  ctx.save()
  ctx.beginPath()
  for (const [x, y] of dabs) {
    ctx.moveTo(x + stroke.radius, y)
    ctx.arc(x, y, stroke.radius, 0, Math.PI * 2)
  }
  if (stroke.mode === 'erase') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = '#000'
    ctx.fill()
  } else {
    ctx.clip()
    // Lo de debajo se limpia antes, así un borde semitransparente vuelve entero.
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.drawImage(original, 0, 0, ctx.canvas.width, ctx.canvas.height)
  }
  ctx.restore()
}

/** La transparencia de un recorte, achicado a `maxSide`: un valor por pixel (para el encuadre). */
export async function alphaOf(blob: Blob, maxSide = 512): Promise<{ alpha: Uint8ClampedArray; width: number; height: number }> {
  const bmp = await createImageBitmap(blob)
  try {
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const width = Math.max(1, Math.round(bmp.width * k))
    const height = Math.max(1, Math.round(bmp.height * k))
    const { canvas, ctx } = makeCanvas(width, height)
    ctx.drawImage(bmp, 0, 0, width, height)
    const rgba = ctx.getImageData(0, 0, width, height).data
    canvas.width = canvas.height = 0
    const alpha = new Uint8ClampedArray(width * height)
    for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3]
    return { alpha, width, height }
  } finally {
    bmp.close()
  }
}
