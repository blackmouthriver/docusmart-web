// W-147.3: PDF a imagen con resolución, calidad y páginas, y la ruta del GIF animado.
// Corre en Node: pdf.js y el canvas se reemplazan por dobles que registran lo pedido.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const fakeCanvas = (width = 0, height = 0) => ({
  width,
  height,
  getContext: () => ({ fillStyle: '', fillRect() {}, drawImage() {} }),
})
const renderPage = vi.fn(async (_doc: unknown, _n: number, width: number) => fakeCanvas(width, Math.round((width * 842) / 595)))
const canvasToBlob = vi.fn(async (_c: unknown, type: string, _q?: number) => new Blob(['x'], { type }))
const closePdf = vi.fn(async () => {})
const doc = { numPages: 3, getPage: vi.fn(async () => ({ getViewport: () => ({ width: 595, height: 842 }), cleanup() {} })) }
vi.mock('../../../../../src/shared/pdf/pdf', () => ({ openPdf: vi.fn(async () => doc), renderPage, canvasToBlob, closePdf, extractText: vi.fn() }))

const encodeAnimatedGif = vi.fn(async (): Promise<Blob | null> => new Blob(['GIF89a'], { type: 'image/gif' }))
vi.mock('../../../../../src/features/convert/infra/formatCodecs', () => ({ encodeAnimatedGif }))

const { PageRangeError, convertImagePages, pdfToImages, pdfToNumberedImages } = await import('../../../../../src/features/convert/core/convert')

beforeAll(() => {
  vi.stubGlobal('document', { createElement: () => fakeCanvas() })
})
afterAll(() => {
  vi.unstubAllGlobals()
})
beforeEach(() => {
  renderPage.mockClear()
  canvasToBlob.mockClear()
  closePdf.mockClear()
})

describe('PDF a imagen', () => {
  it('solo las páginas elegidas, al tamaño de la resolución y con la calidad del JPG', async () => {
    const progress: number[] = []
    const out = await pdfToNumberedImages(new ArrayBuffer(1), 'jpg', 1600, (d) => progress.push(d), { dpi: 72, quality: 0.6, pages: '2-3' })
    expect(out.map((o) => o.page)).toEqual([2, 3])
    expect(renderPage.mock.calls.map((c) => [c[1], c[2]])).toEqual([[2, 595], [3, 595]])
    expect(canvasToBlob.mock.calls.every((c) => c[1] === 'image/jpeg' && c[2] === 0.6)).toBe(true)
    expect(progress).toEqual([1, 2])
    expect(closePdf).toHaveBeenCalledTimes(1)
  })

  it('sin resolución usa el ancho pedido; en PNG, todas las páginas', async () => {
    const blobs = await pdfToImages(new ArrayBuffer(1), 'png', 1600)
    expect(blobs).toHaveLength(3)
    expect(renderPage.mock.calls.map((c) => c[2])).toEqual([1600, 1600, 1600])
    expect(canvasToBlob.mock.calls.every((c) => c[1] === 'image/png')).toBe(true)
  })

  it('páginas que no existen: error propio y el PDF se cierra igual', async () => {
    await expect(pdfToNumberedImages(new ArrayBuffer(1), 'png', 1600, undefined, { pages: '7-9' })).rejects.toBeInstanceOf(PageRangeError)
    await expect(pdfToNumberedImages(new ArrayBuffer(1), 'png', 1600, undefined, { pages: 'abc' })).rejects.toThrow('Páginas no válidas')
    expect(closePdf).toHaveBeenCalledTimes(2)
    expect(renderPage).not.toHaveBeenCalled()
  })
})

describe('Imagen a GIF animado', () => {
  it('un GIF o WebP animado pasa por el codificador de animación', async () => {
    const webp = new File([new Uint8Array([1])], 'a.webp', { type: 'image/webp' })
    expect(await convertImagePages(webp, 'gif')).toEqual([expect.any(Blob)])
    expect(encodeAnimatedGif).toHaveBeenCalledWith(webp)
  })
})
