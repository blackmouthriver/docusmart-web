// Optimizar tras la auditoría W-146.5: compresión que conserva el texto (solo fotos), comprimir a
// un tamaño máximo, y comparar ignorando mayúsculas/puntuación con bloques movidos.
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef, StandardFonts } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { compressImages, compressToSize, megabytes, type ImageEncoder } from '../../../../../src/features/security/core/pdfImageCompress'
import { compareKey, compareTexts, reportText, type Line } from '../../../../../src/features/pdf/core/pdfCompare'

/** JPEG mínimo (SOI + SOF0 1×1 + EOI): lo que "devuelve" el codificador falso. */
const TINY = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9])
const fakeEncoder = (calls: Array<{ format: string; gray: boolean; maxSide: number }>): ImageEncoder => async (img, t) => {
  calls.push({ format: img.format, gray: t.gray, maxSide: t.maxSide })
  return { data: TINY, width: Math.min(img.width, 50), height: Math.min(img.height, 50) }
}

/** PDF con texto, una foto RGB grande (ruido, no se comprime sola) con transparencia y una imagen chica. */
async function photoPdf() {
  const doc = await PDFDocument.create()
  const page = doc.addPage([400, 400])
  page.drawText('Texto que debe seguir siendo texto', { x: 20, y: 380, size: 12, font: await doc.embedFont(StandardFonts.Helvetica) })
  const ctx = doc.context
  const noise = (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 7919 + ((i * i) % 251)) & 255)
  const smask = ctx.register(ctx.flateStream(noise(200 * 200), { Type: 'XObject', Subtype: 'Image', Width: 200, Height: 200, ColorSpace: 'DeviceGray', BitsPerComponent: 8 }))
  const photo = ctx.register(ctx.flateStream(noise(200 * 200 * 3), { Type: 'XObject', Subtype: 'Image', Width: 200, Height: 200, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, SMask: smask }))
  const icon = ctx.register(ctx.flateStream(noise(32 * 32 * 3), { Type: 'XObject', Subtype: 'Image', Width: 32, Height: 32, ColorSpace: 'DeviceRGB', BitsPerComponent: 8 }))
  page.node.newXObject('Photo', photo)
  page.node.newXObject('Icon', icon)
  return { bytes: await doc.save(), photo, smask, icon }
}

async function textOf(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const text = (await (await doc.getPage(1)).getTextContent()).items.map((it) => ('str' in it ? it.str : '')).join(' ')
  await task.destroy()
  return text
}

describe('compresión que conserva el texto', () => {
  it('recomprime solo las fotos (no la máscara ni las chicas) y el texto sigue ahí', async () => {
    const { bytes, photo, smask, icon } = await photoPdf()
    const calls: Array<{ format: string; gray: boolean; maxSide: number }> = []
    const r = await compressImages(bytes, { maxSide: 1600, quality: 0.75, gray: true }, fakeEncoder(calls))
    expect(r.improved).toBe(true)
    expect(r.after).toBeLessThan(r.before)
    expect(r.changed).toBe(1)
    expect(calls).toEqual([{ format: 'png', gray: true, maxSide: 1600 }])
    const out = await PDFDocument.load(r.bytes)
    const img = out.context.lookup(photo) as PDFRawStream
    expect(img.dict.get(PDFName.of('Filter'))?.toString()).toBe('/DCTDecode')
    expect((img.dict.get(PDFName.of('Width')) as PDFNumber).asNumber()).toBe(50)
    expect(img.dict.get(PDFName.of('SMask'))).toEqual(smask)
    expect((out.context.lookup(smask) as PDFRawStream).dict.get(PDFName.of('Filter'))?.toString()).toBe('/FlateDecode')
    expect((out.context.lookup(icon) as PDFRawStream).dict.get(PDFName.of('Filter'))?.toString()).toBe('/FlateDecode')
    expect(await textOf(r.bytes)).toContain('Texto que debe seguir siendo texto')
  })

  it('si el JPEG nuevo no es más liviano, deja la imagen como estaba', async () => {
    const { bytes } = await photoPdf()
    const huge: ImageEncoder = async (img) => ({ data: new Uint8Array(10_000_000), width: img.width, height: img.height })
    const r = await compressImages(bytes, { maxSide: 1600, quality: 0.75, gray: false }, huge)
    expect(r.improved).toBe(false)
    expect(r.bytes).toBe(bytes)
    expect(r.changed).toBe(0)
  })

  it('no toca los JPEG CMYK (se verían distintos al pasarlos por el navegador)', async () => {
    const doc = await PDFDocument.create()
    doc.addPage()
    const big = new Uint8Array(20_000)
    big.set(TINY.slice(0, 15))
    big.set([0xff, 0xd9], big.length - 2)
    const ref = doc.context.register(PDFRawStream.of(doc.context.obj({ Type: 'XObject', Subtype: 'Image', Width: 300, Height: 300, ColorSpace: 'DeviceCMYK', BitsPerComponent: 8, Filter: 'DCTDecode' }), big))
    expect(ref).toBeInstanceOf(PDFRef)
    const calls: Array<{ format: string; gray: boolean; maxSide: number }> = []
    const r = await compressImages(await doc.save(), { maxSide: 1600, quality: 0.75, gray: false }, fakeEncoder(calls))
    expect(calls).toEqual([])
    expect(r.images).toBe(0)
  })
})

describe('comprimir a un tamaño máximo', () => {
  const result = (after: number) => ({ bytes: new Uint8Array(after), before: 1000, after, improved: after < 1000 })

  it('se queda con el primer nivel que entra, sin probar los siguientes', async () => {
    const ran: string[] = []
    const r = await compressToSize(
      ['a', 'b', 'c'].map((level, i) => ({ level, run: async () => (ran.push(level), result([900, 500, 100][i])) })),
      600,
    )
    expect(r).toMatchObject({ level: 'b', reached: true })
    expect(ran).toEqual(['a', 'b'])
  })

  it('si ninguno entra, devuelve el más liviano y avisa', async () => {
    const r = await compressToSize([{ level: 'x', run: async () => result(800) }, { level: 'y', run: async () => result(700) }], 100)
    expect(r).toMatchObject({ level: 'y', reached: false })
    expect(r.result.after).toBe(700)
    await expect(compressToSize([], 1)).rejects.toThrow()
  })

  it('MB como los cuentan los portales (1024 × 1024)', () => {
    expect(megabytes(2)).toBe(2_097_152)
    expect(megabytes(0.5)).toBe(524_288)
  })
})

describe('comparar: opciones y bloques movidos', () => {
  const doc = (texts: string[]): Line[] => texts.map((text, i) => ({ text, page: Math.floor(i / 5) + 1 }))
  const base = ['Primera cláusula del contrato de arriendo.', 'El canon mensual es de 1.500.000 pesos.', 'El arrendatario paga los servicios públicos.', 'La duración es de doce meses.', 'Cualquier cambio debe constar por escrito.']

  it('la clave de comparación ignora mayúsculas y puntuación solo si se pide', () => {
    expect(compareKey('El Canon, ES de: $1.500!', { ignoreCase: true, ignorePunctuation: true })).toBe('el canon es de 1500')
    expect(compareKey('El  Canon', {})).toBe('El Canon')
  })

  it('con las opciones, cambios de mayúsculas o puntuación no cuentan', () => {
    const shouted = doc(base.map((t) => t.toUpperCase().replace(/\./g, '')))
    expect(compareTexts(doc(base), shouted).identical).toBe(false)
    expect(compareTexts(doc(base), shouted, 2, { ignoreCase: true }).identical).toBe(false)
    expect(compareTexts(doc(base), shouted, 2, { ignoreCase: true, ignorePunctuation: true }).identical).toBe(true)
  })

  it('un párrafo que cambió de lugar se marca como movido, no como quitado y agregado', () => {
    const moved = doc([base[0], base[2], base[3], base[4], base[1]])
    const c = compareTexts(doc(base), moved)
    expect(c.moved).toBe(1)
    expect(c.hunks.map((h) => h.moved)).toEqual(['from', 'to'])
    expect(c.added).toBe(0)
    expect(c.removed).toBe(0)
    expect(reportText(c, 'a.pdf', 'b.pdf')).toContain('~ El canon mensual')
    // Un cambio real sigue siendo cambio.
    const edited = compareTexts(doc(base), doc(base.map((t, i) => (i === 3 ? 'La duración es de seis meses.' : t))))
    expect(edited.moved).toBe(0)
    expect(edited.hunks[0].moved).toBeUndefined()
  })
})
