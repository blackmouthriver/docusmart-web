import { beforeAll, describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { setQpdfWasmUrl } from './qpdf'
import { WrongPasswordError, compressLossless, isEncrypted, protect, repair, unlock } from './pdfSecurity'

async function makePdf(pages: number, text = 'Hola DocuSmart'): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([400, 500])
    for (let l = 0; l < 30; l++) page.drawText(`${text} ${i}-${l} `.repeat(4), { x: 10, y: 480 - l * 15, size: 8, font })
  }
  return doc.save({ useObjectStreams: false })
}

beforeAll(() => {
  setQpdfWasmUrl(resolve(import.meta.dirname, '../../../node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm'))
})

describe('pdfSecurity (qpdf en wasm)', () => {
  it('protege con AES-256 y desbloquea con la contraseña correcta', async () => {
    const original = await makePdf(2)
    const locked = await protect(original, { userPassword: 'clave-ñ 123' })
    expect(await isEncrypted(locked)).toBe(true)
    await expect(PDFDocument.load(locked)).rejects.toThrow()

    const opened = await unlock(locked, 'clave-ñ 123')
    expect(await isEncrypted(opened)).toBe(false)
    expect((await PDFDocument.load(opened)).getPageCount()).toBe(2)
  })

  it('rechaza una contraseña incorrecta', async () => {
    const locked = await protect(await makePdf(1), { userPassword: 'correcta' })
    await expect(unlock(locked, 'incorrecta')).rejects.toBeInstanceOf(WrongPasswordError)
  })

  it('las restricciones sin contraseña de apertura se quitan sin pedir contraseña', async () => {
    const restricted = await protect(await makePdf(1), { userPassword: 'x', ownerPassword: 'duena', allowPrint: false })
    // Con la contraseña de propietario también se desbloquea.
    expect(await isEncrypted(await unlock(restricted, 'duena'))).toBe(false)
  })

  it('no acepta proteger sin contraseña', async () => {
    await expect(protect(await makePdf(1), { userPassword: '' })).rejects.toThrow()
  })

  it('comprime sin pérdida un PDF sin optimizar y conserva las páginas', async () => {
    const original = await makePdf(6)
    const r = await compressLossless(original)
    expect(r.improved).toBe(true)
    expect(r.after).toBeLessThan(r.before)
    expect((await PDFDocument.load(r.bytes)).getPageCount()).toBe(6)
  })

  it('si el PDF ya está optimizado devuelve el original', async () => {
    const tiny = await (await PDFDocument.create()).save()
    const r = await compressLossless(tiny)
    expect(r.after).toBeLessThanOrEqual(r.before)
    if (!r.improved) expect(r.bytes).toBe(tiny)
  })

  describe('reparar', () => {
    const latin1 = (b: Uint8Array) => new TextDecoder('latin1').decode(b)
    const bytesOf = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0))

    it.each([
      ['startxref incorrecto', (t: string) => t.replace(/startxref\s+\d+/, 'startxref\n999999')],
      ['sin tabla de referencias', (t: string) => t.replace(/xref[\s\S]*?trailer/, 'trailer')],
      ['posiciones corridas', (t: string) => t.replace(/(\d{10}) 00000 n/g, (_m, n: string) => String(Number(n) + 7).padStart(10, '0') + ' 00000 n')],
      ['sin trailer', (t: string) => t.slice(0, t.indexOf('xref'))],
    ])('recupera un PDF con %s', async (_name, damage) => {
      const broken = bytesOf(damage(latin1(await makePdf(2))))
      const r = await repair(broken)
      expect(r.hadProblems).toBe(true)
      expect((await PDFDocument.load(r.bytes)).getPageCount()).toBe(2)
    })

    it('un PDF sano se reescribe sin reportar problemas', async () => {
      const r = await repair(await makePdf(1))
      expect(r.hadProblems).toBe(false)
    })

    it('pide desbloquear antes de reparar un PDF con contraseña', async () => {
      const locked = await protect(await makePdf(1), { userPassword: 'x' })
      await expect(repair(locked)).rejects.toThrow(/desbloquéalo/)
    })

    it('falla con un archivo que no es PDF', async () => {
      await expect(repair(new TextEncoder().encode('esto no es un pdf'))).rejects.toThrow()
    })
  })
})
