import { describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { normalizeOcrText, runOcr, type Recognizer } from './ocr'

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
