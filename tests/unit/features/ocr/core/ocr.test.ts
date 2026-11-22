import { describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { assembleSearchablePdf, imagePageSize, normalizeOcrText, recognizeOriented, runOcr, type OcrPageResult, type Recognizer } from '../../../../../src/features/ocr/core/ocr'

async function onePagePdf(): Promise<Uint8Array> {
  const d = await PDFDocument.create()
  d.addPage([100, 100])
  return d.save()
}

/** Reconocedor simulado: devuelve un texto por página y, si se pide, un PDF de una página. */
function fakeFactory(texts: string[], calls: { lang?: string; terminated?: boolean } = {}) {
  return async (lang: string, onStatus?: (f: number, s: string) => void): Promise<Recognizer> => {
    calls.lang = lang
    onStatus?.(0.5, 'loading language traineddata')
    let i = 0
    return {
      async recognize(_img, wantPdf) {
        onStatus?.(0.5, 'recognizing text')
        const text = texts[i++] ?? ''
        return { text, confidence: 80 + i, pdf: wantPdf ? await onePagePdf() : null }
      },
      terminate: async () => {
        calls.terminated = true
      },
    }
  }
}

const page = () => async () => new Blob(['x'])

describe('ocr', () => {
  it('normaliza el texto reconocido', () => {
    expect(normalizeOcrText('  Hola   \nmundo\t\n\n\n\nfin  ')).toBe('Hola\nmundo\n\nfin')
  })

  it('reconoce varias páginas, une el texto y promedia la confianza', async () => {
    const calls: { lang?: string; terminated?: boolean } = {}
    const progress = vi.fn()
    const r = await runOcr([page(), page()], {
      lang: 'spa+eng',
      wantPdf: false,
      onProgress: progress,
      recognizerFactory: fakeFactory(['Página uno  ', 'Página dos'], calls),
    })
    expect(r.text).toBe('Página uno\n\nPágina dos')
    expect(r.confidence).toBe(82)
    expect(r.pdf).toBeNull()
    expect(r.pages).toBe(2)
    expect(r.pageTexts).toEqual(['Página uno', 'Página dos'])
    expect(calls).toEqual({ lang: 'spa+eng', terminated: true })
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'preparando' }))
    expect(progress).toHaveBeenLastCalledWith({ page: 2, pages: 2, fraction: 1, stage: 'reconociendo' })
  })

  it('arma un PDF buscable con todas las páginas', async () => {
    const r = await runOcr([page(), page(), page()], { lang: 'spa', wantPdf: true, recognizerFactory: fakeFactory(['a', 'b', 'c']) })
    expect((await PDFDocument.load(r.pdf!)).getPageCount()).toBe(3)
  })

  it('una sola página devuelve su PDF tal cual', async () => {
    const r = await runOcr([page()], { lang: 'eng', wantPdf: true, recognizerFactory: fakeFactory(['hello']) })
    expect(r.text).toBe('hello')
    expect((await PDFDocument.load(r.pdf!)).getPageCount()).toBe(1)
  })

  it('cierra el reconocedor aunque falle una página', async () => {
    const calls: { terminated?: boolean } = {}
    const failing = async () => {
      throw new Error('imagen dañada')
    }
    await expect(runOcr([failing], { lang: 'spa', wantPdf: false, recognizerFactory: fakeFactory([], calls) })).rejects.toThrow('imagen dañada')
    expect(calls.terminated).toBe(true)
  })

  it('exige al menos una página', async () => {
    await expect(runOcr([], { lang: 'spa', wantPdf: false, recognizerFactory: fakeFactory([]) })).rejects.toThrow()
  })
})

/** Un PDF de una página de w×h con algo dibujado (como el que entrega Tesseract, en píxeles). */
async function drawnPdf(w: number, h: number): Promise<Uint8Array> {
  const d = await PDFDocument.create()
  d.addPage([w, h]).drawRectangle({ x: 10, y: 10, width: w / 2, height: h / 2 })
  return d.save()
}

const sizes = async (pdf: Uint8Array) => (await PDFDocument.load(pdf)).getPages().map((p) => [Math.round(p.getWidth()), Math.round(p.getHeight())])

describe('PDF buscable (W-146.6)', () => {
  it('cada página reconocida tiene el tamaño pedido, no el de los píxeles', async () => {
    const pdf = await assembleSearchablePdf([{ kind: 'ocr', pdf: await drawnPdf(1869, 2645), size: [595, 842] }])
    expect(await sizes(pdf)).toEqual([[595, 842]])
  })

  it('sin tamaño, la página se copia tal cual; una página vacía queda en blanco del tamaño pedido', async () => {
    const pdf = await assembleSearchablePdf([
      { kind: 'ocr', pdf: await drawnPdf(300, 400) },
      { kind: 'ocr', pdf: await onePagePdf(), size: [612, 792] },
    ])
    expect(await sizes(pdf)).toEqual([[300, 400], [612, 792]])
  })

  it('copia del original las páginas que ya tenían texto', async () => {
    const orig = await PDFDocument.create()
    orig.addPage([500, 700]).drawText('Hola')
    orig.addPage([595, 842])
    const original = await orig.save()
    const pdf = await assembleSearchablePdf([{ kind: 'original', index: 0 }, { kind: 'ocr', pdf: await drawnPdf(1800, 2600), size: [595, 842] }], original)
    expect(await sizes(pdf)).toEqual([[500, 700], [595, 842]])
    // Sin el original, las páginas "original" se omiten (pdf-lib deja solo su hoja en blanco por defecto).
    expect(await sizes(await assembleSearchablePdf([{ kind: 'original', index: 0 }, { kind: 'ocr', pdf: await drawnPdf(300, 400) }]))).toEqual([[300, 400]])
  })

  it('imagePageSize: ancho A4 y alto en proporción', () => {
    expect(imagePageSize(1000, 1414)).toEqual([595, 841])
    expect(imagePageSize(0, 100)).toEqual([595, 59500])
  })

  it('runOcr respeta las páginas con texto: no las reconoce y copia la original', async () => {
    const orig = await PDFDocument.create()
    orig.addPage([500, 700]).drawText('Texto digital')
    orig.addPage([595, 842])
    const original = await orig.save()
    const recognize = vi.fn(async (): Promise<OcrPageResult> => ({ text: 'escaneada', confidence: 90, pdf: await drawnPdf(1800, 2600) }))
    const r = await runOcr([{ text: 'Texto   digital  ', size: [500, 700] }, { image: async () => new Blob(['x']), size: [595, 842] }], {
      lang: 'spa',
      wantPdf: true,
      original,
      recognizerFactory: async () => ({ recognize, terminate: async () => {} }),
    })
    expect(recognize).toHaveBeenCalledTimes(1)
    expect(r.pageTexts).toEqual(['Texto   digital', 'escaneada'])
    expect(r.kept).toBe(1)
    expect(r.confidence).toBe(90)
    expect(await sizes(r.pdf!)).toEqual([[500, 700], [595, 842]])
  })

  it('runOcr: solo páginas con texto da confianza 100 y, sin original, ningún PDF', async () => {
    const r = await runOcr([{ text: 'ya tenía texto' }], { lang: 'spa', wantPdf: true, recognizerFactory: fakeFactory([]) })
    expect(r.confidence).toBe(100)
    expect(r.pdf).toBeNull()
    expect(r.kept).toBe(1)
  })
})

describe('orientación (W-146.6)', () => {
  /** Reconocedor que solo lee bien la imagen girada `good` grados. */
  function oriented(good: number) {
    const calls: unknown[] = []
    const recognizer: Recognizer = {
      async recognize(img) {
        calls.push(img)
        const deg = img instanceof Blob ? 0 : Number((img as unknown as { deg: number }).deg)
        return deg === good ? { text: 'Texto derecho', confidence: 92, pdf: null } : { text: 'x3$ ~#q zz', confidence: 30, pdf: null }
      },
      terminate: async () => {},
    }
    const rotate = vi.fn(async (_img: unknown, deg: number) => ({ deg }) as unknown as HTMLCanvasElement)
    return { recognizer, rotate, calls }
  }

  it('prueba girada y se queda con la mejor lectura', async () => {
    const { recognizer, rotate } = oriented(270)
    const { result, rotation } = await recognizeOriented(recognizer, new Blob(['x']), false, rotate)
    expect(rotation).toBe(270)
    expect(result.text).toBe('Texto derecho')
    // Con buena confianza a 270° ya no prueba 180°.
    expect(rotate.mock.calls.map((c) => c[1])).toEqual([90, 270])
  })

  it('no gira si la confianza es buena, si no hay cómo girar o si la página está casi vacía', async () => {
    const { recognizer, rotate } = oriented(0)
    expect((await recognizeOriented(recognizer, new Blob(['x']), false, rotate)).rotation).toBe(0)
    expect(rotate).not.toHaveBeenCalled()
    const bad = oriented(90)
    expect((await recognizeOriented(bad.recognizer, new Blob(['x']), false)).rotation).toBe(0)
    const empty: Recognizer = { recognize: async () => ({ text: ' a ', confidence: 10, pdf: null }), terminate: async () => {} }
    const rot = vi.fn()
    expect((await recognizeOriented(empty, new Blob(['x']), false, rot)).rotation).toBe(0)
    expect(rot).not.toHaveBeenCalled()
  })

  it('si ninguna orientación mejora, se queda con la original', async () => {
    const { recognizer, rotate } = oriented(-1)
    const { rotation } = await recognizeOriented(recognizer, new Blob(['x']), false, rotate)
    expect(rotation).toBe(0)
    expect(rotate).toHaveBeenCalledTimes(3)
  })

  it('runOcr cuenta las páginas giradas e intercambia ancho y alto', async () => {
    const { rotate } = oriented(90)
    const factory = async (): Promise<Recognizer> => ({
      async recognize(img) {
        const deg = img instanceof Blob ? 0 : Number((img as unknown as { deg: number }).deg)
        return deg === 90 ? { text: 'Texto derecho', confidence: 92, pdf: await drawnPdf(2600, 1800) } : { text: 'x3$ ~#q zz', confidence: 30, pdf: await drawnPdf(1800, 2600) }
      },
      terminate: async () => {},
    })
    const r = await runOcr([{ image: async () => new Blob(['x']), size: [595, 842] }], { lang: 'spa', wantPdf: true, rotate, recognizerFactory: factory })
    expect(r.rotated).toBe(1)
    expect(r.text).toBe('Texto derecho')
    expect(await sizes(r.pdf!)).toEqual([[842, 595]])
  })
})
