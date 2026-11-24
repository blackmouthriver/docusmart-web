// Dibujar el QR (PNG en un canvas, SVG y el logo en círculo para el PDF): lo usan Crear QR y
// Varios QR desde una lista (W-147.8). Necesita el canvas del navegador.
import QRCode from 'qrcode'
import { errorLevels, logoBox, svgWithLogo } from '../core/qrDesign'

/** El fondo para la librería: transparente es "#0000" (sin pintar). */
const lightOf = (background = '#FFFFFF') => (background === 'transparent' ? '#0000' : background)

/**
 * Dibuja el QR en un canvas con el color, el tamaño y el logo elegidos (W-85). Con logo usa
 * corrección alta (H, o Q si el contenido no entra) para que siga leyéndose con el centro tapado.
 */
export async function renderQr(payload: string, opts: { color: string; background?: string; size: number; logo: File | null }): Promise<string> {
  const canvas = document.createElement('canvas')
  let failure: unknown = null
  for (const level of errorLevels(!!opts.logo)) {
    try {
      await QRCode.toCanvas(canvas, payload, { width: opts.size, margin: 2, errorCorrectionLevel: level, color: { dark: opts.color, light: lightOf(opts.background) } })
      failure = null
      break
    } catch (e) {
      failure = e
    }
  }
  if (failure) throw failure
  if (opts.logo) {
    const bmp = await createImageBitmap(opts.logo)
    const ctx = canvas.getContext('2d')!
    const box = logoBox(canvas.width)
    // Logo circular (W-85b): círculo blanco de fondo y la imagen recortada en círculo, cubriéndolo.
    const r = box.side / 2
    const cx = box.x + r
    const cy = box.y + r
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(cx, cy, r + box.pad, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()
    const fit = box.side / Math.min(bmp.width, bmp.height)
    const w = bmp.width * fit
    const h = bmp.height * fit
    ctx.drawImage(bmp, cx - w / 2, cy - h / 2, w, h)
    ctx.restore()
    bmp.close()
  }
  const url = canvas.toDataURL('image/png')
  canvas.width = canvas.height = 0
  return url
}

/** El mismo QR en SVG (W-86): vectorial, para imprimir nítido en cualquier tamaño. */
export async function renderQrSvg(payload: string, opts: { color: string; background?: string; logo: File | null }): Promise<string> {
  let svg = ''
  let failure: unknown = null
  for (const level of errorLevels(!!opts.logo)) {
    try {
      svg = await QRCode.toString(payload, { type: 'svg', margin: 2, errorCorrectionLevel: level, color: { dark: opts.color, light: lightOf(opts.background) } })
      failure = null
      break
    } catch (e) {
      failure = e
    }
  }
  if (failure) throw failure
  let logoUrl: string | null = null
  if (opts.logo) {
    // El logo se vuelve a dibujar como PNG: dentro del SVG solo va una imagen limpia.
    const bmp = await createImageBitmap(opts.logo)
    const k = Math.min(1, 512 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * k)
    canvas.height = Math.round(bmp.height * k)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    logoUrl = canvas.toDataURL('image/png')
    canvas.width = canvas.height = 0
  }
  return svgWithLogo(svg, logoUrl)
}

/** El logo recortado en círculo (PNG con transparencia), para el PDF. */
export async function circleLogoPng(logo: File): Promise<Uint8Array> {
  const bmp = await createImageBitmap(logo)
  const side = 512
  const c = document.createElement('canvas')
  c.width = c.height = side
  const ctx = c.getContext('2d')!
  ctx.beginPath()
  ctx.arc(side / 2, side / 2, side / 2, 0, Math.PI * 2)
  ctx.clip()
  const fit = side / Math.min(bmp.width, bmp.height)
  ctx.drawImage(bmp, (side - bmp.width * fit) / 2, (side - bmp.height * fit) / 2, bmp.width * fit, bmp.height * fit)
  bmp.close()
  const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/png'))
  c.width = c.height = 0
  if (!blob) throw new Error('logo')
  return new Uint8Array(await blob.arrayBuffer())
}
