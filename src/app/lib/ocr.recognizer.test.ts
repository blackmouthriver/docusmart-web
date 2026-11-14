import { describe, expect, it, vi } from 'vitest'

const recognize = vi.fn()
const terminate = vi.fn()
const createWorker = vi.fn(async (_lang: string, _oem: number, opts: { logger: (m: { progress?: number; status?: string }) => void }) => {
  opts.logger({ progress: 0.3, status: 'loading language traineddata' })
  opts.logger({})
  return { recognize, terminate }
})
vi.mock('tesseract.js', () => ({ createWorker, OEM: { LSTM_ONLY: 1 } }))

const { createRecognizer } = await import('./ocr')

describe('createRecognizer', () => {
  it('usa el worker propio y los recursos del propio dominio', async () => {
    const status = vi.fn()
    await createRecognizer('spa+eng', status)
    expect(createWorker).toHaveBeenCalledWith(
      'spa+eng',
      1,
      expect.objectContaining({ workerPath: '/ocr-worker.js', workerBlobURL: false, corePath: '/ocr/core', langPath: '/ocr/lang', gzip: true }),
    )
    expect(status).toHaveBeenCalledWith(0.3, 'loading language traineddata')
    expect(status).toHaveBeenCalledWith(0, '')
  })

  it('devuelve texto, confianza y el PDF como bytes', async () => {
    recognize.mockResolvedValueOnce({ data: { text: 'Hola', confidence: 91, pdf: [37, 80, 68, 70] } })
    const r = await createRecognizer('spa')
    expect(await r.recognize(new Blob(['x']), true)).toEqual({ text: 'Hola', confidence: 91, pdf: new Uint8Array([37, 80, 68, 70]) })
    expect(recognize).toHaveBeenLastCalledWith(expect.any(Blob), { pdfTitle: 'DocuSmart OCR' }, { text: true, pdf: true })
  })

  it('sin PDF pedido o con datos vacíos no inventa resultados', async () => {
    recognize.mockResolvedValueOnce({ data: { text: null, confidence: null, pdf: [1] } })
    const r = await createRecognizer('eng')
    expect(await r.recognize(new Blob(['x']), false)).toEqual({ text: '', confidence: 0, pdf: null })
    await r.terminate()
    expect(terminate).toHaveBeenCalled()
  })
})
