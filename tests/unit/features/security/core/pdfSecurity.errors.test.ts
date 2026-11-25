import { describe, expect, it, vi } from 'vitest'
import { PDFDocument } from 'pdf-lib'

// qpdf simulado para los caminos de error que el qpdf real no permite provocar.
const runQpdf = vi.fn()
vi.mock('../../../../../src/features/security/infra/qpdf', () => ({ QPDF_OK: 0, QPDF_ERROR: 2, QPDF_WARNINGS: 3, runQpdf: (...a: unknown[]) => runQpdf(...a) }))

const { WrongPasswordError, QpdfError, compressLossless, protect, unlock } = await import('../../../../../src/features/security/core/pdfSecurity')
const pdf = async () => (await PDFDocument.create()).save()

describe('pdfSecurity: errores de qpdf', () => {
  it('proteger: un error de contraseña se informa como contraseña incorrecta', async () => {
    runQpdf.mockResolvedValueOnce({ code: 2, output: null, messages: ['file.pdf: invalid password'] })
    await expect(protect(await pdf(), { userPassword: 'x' })).rejects.toBeInstanceOf(WrongPasswordError)
  })

  it('proteger: otro error pide quitar la contraseña previa', async () => {
    runQpdf.mockResolvedValueOnce({ code: 2, output: null, messages: ['algo salió mal'] })
    await expect(protect(await pdf(), { userPassword: 'x' })).rejects.toThrow(/quítala primero/)
  })

  it('proteger: sin archivo de salida', async () => {
    runQpdf.mockResolvedValueOnce({ code: 0, output: null, messages: [] })
    await expect(protect(await pdf(), { userPassword: 'x' })).rejects.toBeInstanceOf(QpdfError)
  })

  it('desbloquear: un error sin relación con la contraseña', async () => {
    runQpdf.mockResolvedValueOnce({ code: 2, output: null, messages: ['estructura dañada'] })
    await expect(unlock(await pdf(), 'x')).rejects.toThrow('No se pudo desbloquear el PDF.')
  })

  it('desbloquear: sin archivo de salida', async () => {
    runQpdf.mockResolvedValueOnce({ code: 0, output: null, messages: [] })
    await expect(unlock(await pdf(), 'x')).rejects.toBeInstanceOf(QpdfError)
  })

  it('comprimir: sin archivo de salida', async () => {
    runQpdf.mockResolvedValueOnce({ code: 2, output: null, messages: [] })
    await expect(compressLossless(await pdf())).rejects.toThrow('No se pudo comprimir el PDF.')
  })
})

describe('withoutRestrictions: errores de qpdf', () => {
  it('sin mensaje o con "password" es que pide contraseña; otro error se informa tal cual', async () => {
    const { LockedPdfError, withoutRestrictions } = await import('../../../../../src/features/security/core/openPdf')
    runQpdf.mockResolvedValueOnce({ code: 2, output: null, messages: [] })
    await expect(withoutRestrictions(new Uint8Array([1]))).rejects.toBeInstanceOf(LockedPdfError)
    runQpdf.mockResolvedValueOnce({ code: 2, output: null, messages: ['file.pdf: invalid password'] })
    await expect(withoutRestrictions(new Uint8Array([1]))).rejects.toBeInstanceOf(LockedPdfError)
    runQpdf.mockResolvedValueOnce({ code: 2, output: null, messages: ['file.pdf: damaged xref'] })
    await expect(withoutRestrictions(new Uint8Array([1]))).rejects.toThrow('damaged xref')
    runQpdf.mockResolvedValueOnce({ code: 0, output: new Uint8Array([7]), messages: [] })
    expect(await withoutRestrictions(new ArrayBuffer(1))).toEqual(new Uint8Array([7]))
  })

  it('si qpdf no puede (no cargó), loadPdf deja el error original de "cifrado"', async () => {
    const { loadPdf } = await import('../../../../../src/features/security/core/openPdf')
    const { EncryptedPDFError } = await import('pdf-lib')
    const load = vi.spyOn(PDFDocument, 'load').mockRejectedValueOnce(new EncryptedPDFError())
    runQpdf.mockRejectedValueOnce(new Error('no cargó el wasm'))
    await expect(loadPdf(new Uint8Array([1]))).rejects.toThrow(/is encrypted/)
    load.mockRestore()
  })
})

