// PDF con restricciones pero sin contraseña de apertura: las herramientas los abren (antes decían
// "Este PDF tiene contraseña"); los que de verdad piden contraseña siguen avisándolo.
import { resolve } from 'node:path'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { beforeAll, describe, expect, it } from 'vitest'
import { setQpdfWasmUrl } from '../../../../../src/features/security/infra/qpdf'
import { isEncrypted, protect } from '../../../../../src/features/security/core/pdfSecurity'
import { LockedPdfError, loadPdf, pdfLock, withoutRestrictions } from '../../../../../src/features/security/core/openPdf'
import { mergePdfs } from '../../../../../src/features/pdf/core/pdfMerge'
import { pageCount, rotate } from '../../../../../src/features/pdf/core/pdfTools'
import { errorMessage } from '../../../../../src/shared/ui/ui'

beforeAll(() => {
  setQpdfWasmUrl(resolve(process.cwd(), 'node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm'))
})

async function pdf(pages: number, text = 'Hola') {
  const d = await PDFDocument.create()
  const font = await d.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < pages; i++) d.addPage([300, 400]).drawText(`${text} ${i + 1}`, { font, x: 40, y: 300 })
  return d.save()
}
const onlyRestrictions = async (pages = 2) => protect(await pdf(pages), { userPassword: '', allowPrint: false, allowCopy: false, allowModify: false })

describe('abrir PDF con restricciones', () => {
  it('un PDF sin cifrar se carga tal cual', async () => {
    expect((await loadPdf(await pdf(3))).getPageCount()).toBe(3)
  })

  it('uno con solo restricciones se abre sin pedir contraseña, también para unir y rotar', async () => {
    const restricted = await onlyRestrictions(2)
    expect(await isEncrypted(restricted)).toBe(true)
    await expect(PDFDocument.load(restricted)).rejects.toThrow(/encrypted/i)
    expect((await loadPdf(restricted)).getPageCount()).toBe(2)
    expect(await pageCount(restricted.buffer as ArrayBuffer)).toBe(2)
    const merged = await mergePdfs([{ bytes: await pdf(1) }, { bytes: restricted }])
    expect((await PDFDocument.load(merged)).getPageCount()).toBe(3)
    expect(await isEncrypted(merged)).toBe(false)
    const rotated = await rotate(restricted.buffer as ArrayBuffer, [0], 90)
    expect((await PDFDocument.load(rotated)).getPage(0).getRotation().angle).toBe(90)
  }, 30_000)

  it('uno con contraseña de apertura sigue diciendo que tiene contraseña', async () => {
    const locked = await protect(await pdf(1), { userPassword: 'clave-de-prueba' })
    await expect(withoutRestrictions(locked)).rejects.toBeInstanceOf(LockedPdfError)
    const err = await mergePdfs([{ bytes: await pdf(1) }, { bytes: locked }]).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(LockedPdfError)
    expect(errorMessage(err)).toMatch(/contraseña/)
  }, 30_000)

  it('un archivo que no es PDF no se confunde con uno cifrado', async () => {
    await expect(loadPdf(new TextEncoder().encode('no soy un pdf'))).rejects.not.toBeInstanceOf(LockedPdfError)
  })

  it('distingue sin cifrar, solo restricciones y con contraseña', async () => {
    expect(await pdfLock(await pdf(1))).toBe('none')
    expect(await pdfLock(await onlyRestrictions(1))).toBe('restrictions')
    expect(await pdfLock(await protect(await pdf(1), { userPassword: 'clave-de-prueba' }))).toBe('password')
  }, 30_000)
})
