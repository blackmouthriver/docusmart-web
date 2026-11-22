// Auditoría W-146.8 (Imagen): PNG con paleta, formato de salida, comprimir a un tamaño, medidas
// listas y centímetros, resolución guardada, giro de JPG sin pérdida, nitidez y mejora automática.
import { describe, expect, it } from 'vitest'
import { unzlibSync } from 'fflate'
import { compressPlan, encodeIndexedPng, fitToSize, palettePng, paletteToRgba, psnr, quantizeRgba, TARGET_SIZES } from '../../../../../src/features/image/core/imageCompress'
import { RESIZE_PRESETS, cmToPx, composeOrientation, coverCrop, jpegWithOrientation, readDpi, writeDpi } from '../../../../../src/features/image/core/imageMeta'
import { NEUTRAL, applyLevels, autoLevels, changesPixels, isNeutral, sharpen } from '../../../../../src/features/image/core/adjust'
import { MAX_SIDE, IDENTITY } from '../../../../../src/features/image/core/imageTools'
import { encodePng } from '../../../../../src/features/pdf/core/pdfImages'
import { jpegInfo } from '../../../../../src/features/convert/core/imagePdf'

/** Lee los bloques de un PNG: tipo → datos. */
function chunks(png: Uint8Array): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {}
  let i = 8
  while (i + 12 <= png.length) {
    const len = ((png[i] << 24) | (png[i + 1] << 16) | (png[i + 2] << 8) | png[i + 3]) >>> 0
    out[String.fromCharCode(...png.subarray(i + 4, i + 8))] = png.subarray(i + 8, i + 8 + len)
    i += 12 + len
  }
  return out
}

/** Una "captura": franjas de 3 colores planos, y una parte transparente si se pide. */
function flat(w: number, h: number, alpha = false): Uint8Array {
  const px = new Uint8Array(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const band = Math.floor((i % w) / (w / 3))
    px.set([[240, 240, 240], [37, 99, 235], [20, 20, 20]][band], i * 4)
    px[i * 4 + 3] = alpha && i < (w * h) / 2 ? 0 : 255
  }
  return px
}

describe('Comprimir: plan y formato (W-146.8)', () => {
  it('conserva el formato, o el elegido; lo que no es JPG, PNG ni WebP sale como JPG (o PNG con transparencia)', () => {
    expect(compressPlan('media', 'same', 'image/png', true)).toEqual({ mime: 'image/png', quality: 0.74, maxSide: 2560, minPsnr: 35 })
    expect(compressPlan('baja', 'same', 'image/jpeg', false)).toMatchObject({ mime: 'image/jpeg', quality: 0.86, maxSide: MAX_SIDE, minPsnr: 40 })
    expect(compressPlan('alta', 'same', 'image/webp', true)).toMatchObject({ mime: 'image/webp', quality: 0.6, maxSide: 1600 })
    expect(compressPlan('media', 'same', 'image/heic', false).mime).toBe('image/jpeg')
    expect(compressPlan('media', 'same', 'image/gif', true).mime).toBe('image/png')
    expect(compressPlan('media', 'jpg', 'image/png', true).mime).toBe('image/jpeg')
    expect(compressPlan('media', 'webp', 'image/jpeg', false).mime).toBe('image/webp')
    const custom = compressPlan('custom', 'same', 'image/jpeg', false, 0.5)
    expect(custom).toMatchObject({ quality: 0.5, maxSide: MAX_SIDE, minPsnr: 34 })
    expect(compressPlan('custom', 'same', 'image/jpeg', false, 5).quality).toBe(1)
    expect(compressPlan('custom', 'same', 'image/jpeg', false, 0).quality).toBe(0.1)
    expect(TARGET_SIZES).toEqual([51200, 102400, 204800, 512000, 1024000])
  })
})

describe('PNG con paleta (W-146.8)', () => {
  it('una captura de pocos colores pasa a paleta sin cambiar nada y pesa menos', () => {
    const rgba = flat(300, 60)
    const r = palettePng(rgba, 300, 60, 35)!
    expect(r.psnr).toBeGreaterThan(45)
    const c = chunks(r.png)
    expect(c.IHDR[9]).toBe(3) // tipo 3: paleta
    expect(c.PLTE.length % 3).toBe(0)
    expect(c.tRNS).toBeUndefined()
    expect(r.png.length).toBeLessThan(encodePng(rgba, 300, 60).length)
    // Cada fila: un byte de filtro y un índice por pixel.
    expect(unzlibSync(c.IDAT).length).toBe(60 * 301)
  })

  it('con transparencia guarda tRNS', () => {
    const r = palettePng(flat(90, 20, true), 90, 20, 35)!
    const c = chunks(r.png)
    expect(c.tRNS).toBeDefined()
    expect([...c.tRNS]).toContain(0)
  })

  it('una imagen con miles de colores que pierde demasiado no se pasa a paleta', () => {
    const w = 128
    const h = 128
    const rgba = new Uint8Array(w * h * 4)
    let seed = 7
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) >>> 16) & 255
    for (let i = 0; i < w * h; i++) rgba.set([rand(), rand(), rand(), 255], i * 4)
    expect(palettePng(rgba, w, h, 45)).toBeNull()
  })

  it('cuantizar, volver a RGBA y comparar', () => {
    const rgba = flat(30, 3)
    const { palette, index } = quantizeRgba(rgba)
    expect(palette.every((c) => c.length === 4)).toBe(true)
    expect(paletteToRgba(index, palette).length).toBe(rgba.length)
    expect(paletteToRgba(new Uint8Array([5]), [[1, 2, 3, 4]])).toEqual(new Uint8ClampedArray([0, 0, 0, 0]))
    expect(psnr(rgba, rgba)).toBe(99)
    expect(psnr([], [])).toBe(99)
    const darker = rgba.map((v, i) => (i % 4 === 3 ? v : Math.max(0, v - 10)))
    expect(psnr(rgba, darker)).toBeCloseTo(29.4, 1)
    expect(() => encodeIndexedPng(new Uint8Array(1), [], 1, 1)).toThrow()
  })
})

describe('Comprimir a un tamaño (W-146.8)', () => {
  /** Un "codificador" de prueba: el tamaño crece con la calidad y con el lado. */
  const fake = (calls: Array<[number, number]>) => async (q: number, scale: number) => {
    calls.push([q, scale])
    return new Blob([new Uint8Array(Math.round(1000 * q * scale * scale))])
  }

  it('busca la mayor calidad que entra', async () => {
    const calls: Array<[number, number]> = []
    const r = await fitToSize(fake(calls), 500, { lossy: true, maxQuality: 0.9 })
    expect(r.fits).toBe(true)
    expect(r.scale).toBe(1)
    expect(r.blob.size).toBeLessThanOrEqual(500)
    expect(r.quality).toBeGreaterThan(0.45)
    expect(r.quality).toBeLessThanOrEqual(0.5)
  })

  it('si con la menor calidad no entra, achica la imagen', async () => {
    const r = await fitToSize(fake([]), 200, { lossy: true, maxQuality: 0.9 })
    expect(r.fits).toBe(true)
    expect(r.scale).toBeLessThan(1)
    expect(r.blob.size).toBeLessThanOrEqual(200)
  })

  it('entra de una con la calidad máxima', async () => {
    const calls: Array<[number, number]> = []
    const r = await fitToSize(fake(calls), 5000, { lossy: true, maxQuality: 0.8 })
    expect(r).toMatchObject({ quality: 0.8, scale: 1, fits: true })
    expect(calls).toHaveLength(1)
  })

  it('sin calidad (PNG) solo achica; si nunca entra, devuelve la más liviana', async () => {
    const png = await fitToSize(fake([]), 300, { lossy: false, maxQuality: 1 })
    expect(png.fits).toBe(true)
    expect(png.scale).toBeLessThan(1)
    const never = await fitToSize(async () => new Blob([new Uint8Array(900)]), 100, { lossy: false, maxQuality: 1, minScale: 0.5 })
    expect(never.fits).toBe(false)
    expect(never.blob.size).toBe(900)
    const lossyNever = await fitToSize(async (q) => new Blob([new Uint8Array(Math.round(900 + q))]), 100, { lossy: true, maxQuality: 1, minScale: 0.6 })
    expect(lossyNever.fits).toBe(false)
  })
})

describe('Redimensionar: medidas listas, centímetros y resolución (W-146.8)', () => {
  it('coverCrop llena la medida recortando parejo', () => {
    expect(coverCrop(4000, 3000, 1080, 1920)).toEqual({ x: 1156, y: 0, width: 1688, height: 3000 })
    expect(coverCrop(1000, 3000, 1500, 500)).toEqual({ x: 0, y: 1334, width: 1000, height: 333 })
    expect(RESIZE_PRESETS.find((p) => p.id === 'story')).toEqual({ id: 'story', w: 1080, h: 1920 })
    expect(cmToPx(10, 300)).toBe(1181)
    expect(cmToPx(0, 300)).toBe(1)
  })

  it('lee y escribe la resolución en JPG y PNG', () => {
    const jfif = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, 0, 72, 0, 72, 0, 0, 0xff, 0xd9])
    expect(readDpi(jfif)).toBe(72)
    expect(readDpi(writeDpi(jfif, 300))).toBe(300)
    const dpcm = jfif.slice()
    dpcm[13] = 2
    dpcm[15] = 118
    expect(readDpi(dpcm)).toBe(300)
    const noUnit = jfif.slice()
    noUnit[13] = 0
    expect(readDpi(noUnit)).toBeNull()
    const png = encodePng(new Uint8Array(4 * 4).fill(200), 2, 2)
    expect(readDpi(png)).toBeNull()
    const with300 = writeDpi(png, 300)
    expect(readDpi(with300)).toBe(300)
    // Reemplaza el pHYs que había, no agrega otro.
    const twice = writeDpi(with300, 150)
    expect(readDpi(twice)).toBe(150)
    expect(twice.length).toBe(with300.length)
    expect(Object.keys(chunks(twice))).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND'])
    const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46])
    expect(writeDpi(webp, 300)).toBe(webp)
    expect(readDpi(webp)).toBeNull()
  })
})

describe('Girar un JPG sin pérdida (W-146.8)', () => {
  it('compone la orientación EXIF con el giro y el volteo', () => {
    expect(composeOrientation(1, { rotate: 90, flipH: false, flipV: false })).toBe(6)
    expect(composeOrientation(1, { rotate: 270, flipH: false, flipV: false })).toBe(8)
    expect(composeOrientation(1, { rotate: 180, flipH: false, flipV: false })).toBe(3)
    expect(composeOrientation(1, { rotate: 0, flipH: true, flipV: false })).toBe(2)
    expect(composeOrientation(1, { rotate: 0, flipH: false, flipV: true })).toBe(4)
    expect(composeOrientation(6, { rotate: 90, flipH: false, flipV: false })).toBe(3)
    expect(composeOrientation(6, { rotate: 270, flipH: false, flipV: false })).toBe(1)
    expect(composeOrientation(8, { rotate: 0, flipH: true, flipV: false })).toBe(7)
    // Voltear y después girar (como se dibuja): transversal.
    expect(composeOrientation(1, { rotate: 90, flipH: true, flipV: false })).toBe(7)
    expect(composeOrientation(3, IDENTITY)).toBe(3)
    expect(composeOrientation(99, IDENTITY)).toBe(1)
  })

  it('reemplaza el EXIF (con el GPS) por uno con solo la orientación y deja la imagen igual', () => {
    const gpsExif = [0xff, 0xe1, 0, 12, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x47, 0x50, 0x53, 0x21]
    const iptc = [0xff, 0xed, 0, 4, 1, 2]
    const jfif = [0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, 1, 44, 1, 44, 0, 0]
    const scan = [0xff, 0xc0, 0, 11, 8, 0, 10, 0, 20, 1, 1, 0x11, 0, 0xff, 0xda, 0, 2, 9, 9, 9, 0xff, 0xd9]
    const src = Uint8Array.from([0xff, 0xd8, ...jfif, ...gpsExif, ...iptc, ...scan])
    const out = jpegWithOrientation(src, 6)
    expect(jpegInfo(out)).toEqual({ orientation: 6, components: 1 })
    expect(String.fromCharCode(...out)).not.toContain('GPS!')
    expect(Array.from(out.subarray(2, 2 + jfif.length))).toEqual(jfif)
    expect(Array.from(out.subarray(out.length - scan.length))).toEqual(scan)
    // Sin JFIF, el EXIF va primero.
    const bare = jpegWithOrientation(Uint8Array.from([0xff, 0xd8, ...scan]), 8)
    expect([bare[2], bare[3]]).toEqual([0xff, 0xe1])
    expect(jpegInfo(bare)?.orientation).toBe(8)
    expect(() => jpegWithOrientation(new Uint8Array([1, 2, 3, 4, 5]), 1)).toThrow()
  })
})

describe('Ajustar: nitidez y mejora automática (W-146.8)', () => {
  it('neutral y qué toca los pixeles', () => {
    expect(isNeutral(NEUTRAL)).toBe(true)
    expect(isNeutral({ ...NEUTRAL, sharpen: 10 })).toBe(false)
    expect(isNeutral({ ...NEUTRAL, auto: true })).toBe(false)
    expect(changesPixels({ ...NEUTRAL, angle: 5 })).toBe(false)
    expect(changesPixels({ ...NEUTRAL, auto: true })).toBe(true)
  })

  it('autoLevels estira una foto lavada a todo el rango, y deja igual una que ya lo usa', () => {
    const washed = new Uint8ClampedArray(400 * 4)
    for (let i = 0; i < 400; i++) washed.set([80 + (i % 100), 90 + (i % 80), 100 + (i % 60), 255], i * 4)
    const luts = autoLevels(washed)
    const out = applyLevels(washed.slice(), luts)
    const reds = Array.from({ length: 400 }, (_, i) => out[i * 4])
    expect(Math.min(...reds)).toBe(0)
    expect(Math.max(...reds)).toBe(255)
    const full = new Uint8ClampedArray(256 * 4)
    for (let v = 0; v < 256; v++) full.set([v, v, v, 255], v * 4)
    expect(Array.from(autoLevels(full)[0])).toEqual(Array.from({ length: 256 }, (_, v) => v))
    // Lo transparente no cuenta; un canal de un solo tono no se toca.
    const flatPx = new Uint8ClampedArray([50, 50, 50, 255, 0, 0, 0, 0])
    expect(autoLevels(flatPx)[0][50]).toBe(50)
  })

  it('sharpen resalta un borde y no toca las orillas ni con 0', () => {
    const w = 5
    const h = 3
    const px = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.set(x < 2 ? [100, 100, 100, 255] : [160, 160, 160, 255], (y * w + x) * 4)
    const out = sharpen(px.slice(), w, h, 100)
    const at = (x: number, y: number) => out[(y * w + x) * 4]
    expect(at(1, 1)).toBeLessThan(100)
    expect(at(2, 1)).toBeGreaterThan(160)
    expect(at(0, 0)).toBe(100)
    expect(sharpen(px.slice(), w, h, 0)).toEqual(px)
    expect(sharpen(px.slice(0, 8), 2, 1, 50)).toEqual(px.slice(0, 8))
  })
})
