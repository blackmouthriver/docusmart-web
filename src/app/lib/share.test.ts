import { describe, expect, it, vi } from 'vitest'
import { canShareFile, docSummary, resultFile, shareFile, sizeChange } from './share'
import { formatBytes } from './files'

describe('resultFile', () => {
  it('limpia el nombre y usa un tipo seguro', async () => {
    const f = resultFile(new Uint8Array([1, 2, 3]), 'a/b:c.pdf', 'application/pdf')
    expect(f.name).toBe('a_b_c.pdf')
    expect(f.type).toBe('application/pdf')
    expect(f.size).toBe(3)
    expect(resultFile(new Blob(['<b>'], { type: 'text/html' }), 'x.html').type).toBe('application/octet-stream')
  })
})

describe('compartir', () => {
  const file = resultFile(new Uint8Array([1]), 'r.pdf', 'application/pdf')

  it('solo si el navegador sabe compartir archivos', () => {
    expect(canShareFile(file, {})).toBe(false)
    expect(canShareFile(file, { share: async () => {}, canShare: () => false })).toBe(false)
    expect(canShareFile(file, { share: async () => {}, canShare: () => true })).toBe(true)
    expect(canShareFile(file, { share: async () => {}, canShare: () => { throw new Error('x') } })).toBe(false)
  })

  it('comparte, detecta la cancelación y propaga otros errores', async () => {
    const share = vi.fn(async () => {})
    expect(await shareFile(file, { share, canShare: () => true })).toBe('shared')
    expect(share).toHaveBeenCalledWith({ files: [file], title: 'r.pdf' })
    expect(await shareFile(file, {})).toBe('unsupported')
    const abort = Object.assign(new Error('cerró'), { name: 'AbortError' })
    expect(await shareFile(file, { share: async () => Promise.reject(abort), canShare: () => true })).toBe('cancelled')
    await expect(shareFile(file, { share: async () => Promise.reject(new Error('otro')), canShare: () => true })).rejects.toThrow('otro')
  })
})

describe('textos', () => {
  it('resumen y cambio de peso', () => {
    expect(docSummary(1, 2048, formatBytes)).toBe('1 página · 2 KB')
    expect(docSummary(12, 3 * 1024 * 1024, formatBytes)).toBe('12 páginas · 3.0 MB')
    expect(docSummary(0, 500, formatBytes)).toBe('500 B')
    expect(sizeChange(1000, 380)).toBe('62% menos')
    expect(sizeChange(1000, 1080)).toBe('8% más')
    expect(sizeChange(1000, 1000)).toBeNull()
    expect(sizeChange(1000, 999)).toBeNull()
    expect(sizeChange(0, 10)).toBeNull()
  })
})
