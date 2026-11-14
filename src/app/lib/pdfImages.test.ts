import { describe, expect, it } from 'vitest'
import { PDFDocument, PDFHexString, PDFName, type PDFPage } from 'pdf-lib'
import { unzlibSync, zlibSync } from 'fflate'
import { encodePng, extractImages, undoPngPredictor, unpackSamples } from './pdfImages'

/** Lee un PNG generado por encodePng (filtro 0): ancho, alto, canales y pixeles. */
function readPng(png: Uint8Array) {
  expect([...png.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  const view = new DataView(png.buffer, png.byteOffset)
  let off = 8
  let w = 0
  let h = 0
  let type = 0
  const idat: Uint8Array[] = []
  while (off < png.length) {
    const len = view.getUint32(off)
    const name = String.fromCharCode(...png.slice(off + 4, off + 8))
    const data = png.slice(off + 8, off + 8 + len)
    if (name === 'IHDR') {
      w = new DataView(data.buffer).getUint32(0)
      h = new DataView(data.buffer).getUint32(4)
      type = data[9]
    }
    if (name === 'IDAT') idat.push(data)
    off += 12 + len
  }
  const ch = type === 6 ? 4 : 3
  const raw = unzlibSync(idat[0])
  const px: number[][] = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.push([...raw.slice(y * (1 + w * ch) + 1 + x * ch, y * (1 + w * ch) + 1 + (x + 1) * ch)])
  return { w, h, ch, px }
}

const JPEG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))

/** Agrega a la página un XObject de imagen hecho a mano. */
function addImage(doc: PDFDocument, page: PDFPage, name: string, dict: Record<string, unknown>, data: Uint8Array, flate = true) {
  const stream = flate ? doc.context.flateStream(data, dict as never) : doc.context.stream(data, dict as never)
  const ref = doc.context.register(stream)
  page.node.setXObject(PDFName.of(name), ref)
  return ref
}

describe('encodePng', () => {
  it('guarda RGB si es opaco y RGBA si tiene transparencia', () => {
    const opaque = readPng(encodePng(new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]), 2, 1))
    expect(opaque).toMatchObject({ w: 2, h: 1, ch: 3, px: [[255, 0, 0], [0, 255, 0]] })
    const alpha = readPng(encodePng(new Uint8Array([1, 2, 3, 128]), 1, 1))
    expect(alpha).toMatchObject({ ch: 4, px: [[1, 2, 3, 128]] })
  })
})

describe('extractImages', () => {
  it('copia las JPEG tal cual y convierte las PNG con su transparencia', async () => {
    const doc = await PDFDocument.create()
    const page = doc.addPage()
    const pngIn = encodePng(new Uint8Array([10, 20, 30, 255, 40, 50, 60, 0, 70, 80, 90, 128, 1, 2, 3, 255]), 2, 2)
    page.drawImage(await doc.embedPng(pngIn), { x: 0, y: 0, width: 50, height: 50 })
    page.drawImage(await doc.embedJpg(JPEG), { x: 60, y: 0, width: 50, height: 50 })
    const { images, skipped } = await extractImages(await doc.save())
    expect(skipped).toBe(0)
    expect(images.map((i) => [i.page, i.index, i.format, i.width, i.height])).toEqual([
      [1, 1, 'png', 2, 2],
      [1, 2, 'jpg', 1, 1],
    ])
    expect(readPng(images[0].data).px).toEqual([[10, 20, 30, 255], [40, 50, 60, 0], [70, 80, 90, 128], [1, 2, 3, 255]])
    expect(images[1].data).toEqual(JPEG)
  })

  it('gris de 1 bit, indexado, CMYK e invertido', async () => {
    const doc = await PDFDocument.create()
    const page = doc.addPage()
    // 3x1 en 1 bit: 1 0 1 → blanco negro blanco
    addImage(doc, page, 'G', { Type: 'XObject', Subtype: 'Image', Width: 3, Height: 1, BitsPerComponent: 1, ColorSpace: 'DeviceGray' }, new Uint8Array([0b10100000]))
    // Indexado con paleta en hex: 0 = rojo, 1 = azul
    addImage(doc, page, 'I', { Type: 'XObject', Subtype: 'Image', Width: 2, Height: 1, BitsPerComponent: 8, ColorSpace: ['Indexed', 'DeviceRGB', 1, PDFHexString.of('FF00000000FF')] }, new Uint8Array([1, 0]))
    // CMYK: solo negro al 100 %
    addImage(doc, page, 'C', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, BitsPerComponent: 8, ColorSpace: 'DeviceCMYK' }, new Uint8Array([0, 0, 0, 255]))
    // Gris con Decode invertido: 0 se ve blanco
    addImage(doc, page, 'D', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, BitsPerComponent: 8, ColorSpace: 'DeviceGray', Decode: [1, 0] }, new Uint8Array([0]))
    const { images } = await extractImages(await doc.save())
    expect(images.map((i) => readPng(i.data).px)).toEqual([
      [[255, 255, 255], [0, 0, 0], [255, 255, 255]],
      [[0, 0, 255], [255, 0, 0]],
      [[0, 0, 0]],
      [[255, 255, 255]],
    ])
  })

  it('paleta en un stream, ICC de 1 componente y máscara de esténcil', async () => {
    const doc = await PDFDocument.create()
    const page = doc.addPage()
    const palette = doc.context.register(doc.context.flateStream(new Uint8Array([0, 255, 0]), {} as never))
    addImage(doc, page, 'P', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, BitsPerComponent: 8, ColorSpace: ['Indexed', 'DeviceRGB', 0, palette] }, new Uint8Array([0]))
    const icc = doc.context.register(doc.context.flateStream(new Uint8Array([0]), { N: 1 } as never))
    addImage(doc, page, 'Q', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, BitsPerComponent: 8, ColorSpace: ['ICCBased', icc] }, new Uint8Array([77]))
    addImage(doc, page, 'M', { Type: 'XObject', Subtype: 'Image', Width: 2, Height: 1, ImageMask: true }, new Uint8Array([0b01000000]))
    const { images } = await extractImages(await doc.save())
    expect(images.map((i) => readPng(i.data).px)).toEqual([[[0, 255, 0]], [[77, 77, 77]], [[0, 0, 0, 255], [0, 0, 0, 0]]])
  })

  it('revierte el predictor PNG', async () => {
    const doc = await PDFDocument.create()
    const page = doc.addPage()
    // 2x2 gris con filtro Sub en la fila 1 y Up en la 2: valores 10 30 / 15 35
    const filtered = new Uint8Array([1, 10, 20, 2, 5, 5])
    addImage(doc, page, 'R', { Type: 'XObject', Subtype: 'Image', Width: 2, Height: 2, BitsPerComponent: 8, ColorSpace: 'DeviceGray', DecodeParms: { Predictor: 15, Columns: 2, Colors: 1 } }, filtered)
    const { images } = await extractImages(await doc.save())
    expect(readPng(images[0].data).px).toEqual([[10, 10, 10], [30, 30, 30], [15, 15, 15], [35, 35, 35]])
  })

  it('omite las pequeñas, cuenta las no soportadas, entra en Form XObjects y no repite', async () => {
    const doc = await PDFDocument.create()
    const p1 = doc.addPage()
    const p2 = doc.addPage()
    const big = { Type: 'XObject', Subtype: 'Image', Width: 60, Height: 60, BitsPerComponent: 8, ColorSpace: 'DeviceGray' }
    const ref = addImage(doc, p1, 'A', big, new Uint8Array(3600).fill(128))
    p2.node.setXObject(PDFName.of('A'), ref) // la misma imagen en la página 2
    addImage(doc, p1, 'S', { ...big, Width: 10, Height: 10 }, new Uint8Array(100))
    addImage(doc, p1, 'F', { ...big, Filter: 'CCITTFaxDecode' }, new Uint8Array([0]), false)
    addImage(doc, p1, 'L', { ...big, ColorSpace: 'Lab' }, new Uint8Array(3600))
    // Imagen dentro de un Form XObject en la página 2
    const inner = doc.context.register(doc.context.flateStream(new Uint8Array(3600).fill(9), big as never))
    const form = doc.context.register(
      doc.context.flateStream(new Uint8Array(), { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 1, 1], Resources: { XObject: { Im: inner } } } as never),
    )
    p2.node.setXObject(PDFName.of('Fm'), form)
    const r = await extractImages(await doc.save(), { minSize: 50 })
    expect(r.images.map((i) => [i.page, i.index])).toEqual([[1, 1], [2, 1]])
    expect(r.small).toBe(1)
    expect(r.skipped).toBe(2)
    expect(readPng(r.images[1].data).px[0]).toEqual([9, 9, 9])
  })

  it('un PDF sin imágenes', async () => {
    const doc = await PDFDocument.create()
    doc.addPage()
    expect(await extractImages(await doc.save())).toEqual({ images: [], skipped: 0, small: 0 })
  })
})

describe('utilidades', () => {
  it('desempaqueta 2, 4 y 16 bits', () => {
    expect([...unpackSamples(new Uint8Array([0b11100100]), 4, 1, 1, 2, true)]).toEqual([255, 170, 85, 0])
    expect([...unpackSamples(new Uint8Array([0x0f]), 2, 1, 1, 4, false)]).toEqual([0, 15])
    expect([...unpackSamples(new Uint8Array([200, 1, 100, 2]), 2, 1, 1, 16, true)]).toEqual([200, 100])
  })

  it('predictores Average y Paeth', () => {
    // Fila 1: None [10, 20]; fila 2: Average → [10+5, 20+(15+20)/2] ; fila 3: Paeth
    const out = undoPngPredictor(new Uint8Array([0, 10, 20, 3, 10, 2, 4, 1, 1]), 2, 1, 8)
    expect([...out]).toEqual([10, 20, 15, 19, 16, 20])
  })

  it('una imagen dañada se cuenta como omitida sin romper el resto', async () => {
    const doc = await PDFDocument.create()
    const page = doc.addPage()
    addImage(doc, page, 'X', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, BitsPerComponent: 8, ColorSpace: 'DeviceGray', Filter: 'FlateDecode' }, new Uint8Array([1, 2, 3]), false)
    addImage(doc, page, 'Y', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, BitsPerComponent: 8, ColorSpace: 'DeviceGray' }, zlibSync(new Uint8Array([200])).subarray(0, 0), false)
    addImage(doc, page, 'Z', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1, BitsPerComponent: 8, ColorSpace: 'DeviceGray' }, new Uint8Array([200]))
    const r = await extractImages(await doc.save())
    expect(r.skipped).toBe(1)
    expect(r.images.length).toBe(2)
  })
})
