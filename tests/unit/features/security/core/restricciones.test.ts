// Matriz de verificación: PDF que se abren SIN contraseña pero traen restricciones (no imprimir,
// no copiar, no modificar), con los 4 cifrados que existen (RC4 40 y 128 bits, AES 128 y 256),
// metadatos sin cifrar y flujos de objetos. Cada uno pasa por todas las herramientas que usan
// pdf-lib: ninguna debe decir "tiene contraseña" y el resultado se abre sin cifrado. Los mismos PDF
// con contraseña de apertura siguen avisando que la tienen.
import { resolve } from 'node:path'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { beforeAll, describe, expect, it } from 'vitest'
import { QPDF_OK, QPDF_WARNINGS, runQpdf, setQpdfWasmUrl } from '../../../../../src/features/security/infra/qpdf'
import { isEncrypted } from '../../../../../src/features/security/core/pdfSecurity'
import { LockedPdfError, pdfLock } from '../../../../../src/features/security/core/openPdf'
import { compressImages } from '../../../../../src/features/security/core/pdfImageCompress'
import { extractPages, mergePdfs, pageCount, rotate, splitEach, watermarkPdf, numberPages } from '../../../../../src/features/pdf/core/pdfTools'
import { splitBySize } from '../../../../../src/features/pdf/core/pdfSplit'
import { cropPdf } from '../../../../../src/features/pdf/core/pdfCrop'
import { applyEdits } from '../../../../../src/features/pdf/core/pdfEdit'
import { fillForm, readForm } from '../../../../../src/features/pdf/core/pdfForm'
import { addFormFields } from '../../../../../src/features/pdf/core/pdfFormCreate'
import { extractImages } from '../../../../../src/features/pdf/core/pdfImages'
import { redactPdf } from '../../../../../src/features/pdf/core/pdfRedact'
import { signPdf } from '../../../../../src/features/pdf/core/pdfSign'
import { readPdf, stripPdf } from '../../../../../src/features/metadata/core/pdfMeta'
import { errorMessage } from '../../../../../src/shared/ui/ui'

const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))

beforeAll(() => {
  setQpdfWasmUrl(resolve(process.cwd(), 'node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm'))
})

/** Como un extracto real: 3 páginas con texto, un campo de formulario, una imagen y título. */
async function base(): Promise<Uint8Array> {
  const d = await PDFDocument.create()
  d.setTitle('Extracto de prueba')
  const font = await d.embedFont(StandardFonts.Helvetica)
  const png = await d.embedPng(PNG)
  for (let i = 0; i < 3; i++) {
    const p = d.addPage([595, 842])
    p.drawText(`Extracto de prueba - pagina ${i + 1}`, { font, x: 60, y: 760, size: 16 })
    if (i === 0) p.drawImage(png, { x: 60, y: 600, width: 120, height: 120 })
  }
  const field = d.getForm().createTextField('Titular')
  field.setText('Cuenta de prueba')
  field.addToPage(d.getPage(0), { x: 60, y: 500, width: 200, height: 24 })
  return d.save()
}

/** Cifra con qpdf: `user` vacío = solo restricciones (se abre sin contraseña). */
async function encrypt(input: Uint8Array, user: string, bits: '40' | '128' | '256', extra: string[] = []): Promise<Uint8Array> {
  const perms = bits === '40' ? ['--print=n', '--modify=n', '--extract=n', '--annotate=n'] : ['--print=none', '--modify=none', '--extract=n']
  const weak = bits === '256' || extra.includes('--use-aes=y') ? [] : ['--allow-weak-crypto']
  // Las opciones generales van antes de --encrypt; las del cifrado, entre --encrypt y --.
  const general = extra.filter((o) => o.startsWith('--object-streams'))
  const enc = extra.filter((o) => !general.includes(o))
  const r = await runQpdf([...weak, ...general, '--encrypt', user, 'propietario-de-prueba', bits, ...perms, ...enc, '--', '{in}', '{out}'], input)
  if ((r.code !== QPDF_OK && r.code !== QPDF_WARNINGS) || !r.output) throw new Error(`qpdf: ${r.messages.join(' ')}`)
  return r.output
}

const VARIANTS: Array<[name: string, bits: '40' | '128' | '256', extra: string[]]> = [
  ['RC4 40 bits', '40', []],
  ['RC4 128 bits', '128', ['--use-aes=n']],
  ['AES 128 bits', '128', ['--use-aes=y']],
  ['AES 256 bits', '256', []],
  ['AES 256 con metadatos sin cifrar', '256', ['--cleartext-metadata']],
  ['AES 256 con flujos de objetos', '256', ['--object-streams=generate']],
]

/** El resultado se abre con pdf-lib sin opciones (o sea, ya no está cifrado). */
async function opensPlain(bytes: Uint8Array): Promise<PDFDocument> {
  expect(await isEncrypted(bytes)).toBe(false)
  return PDFDocument.load(bytes)
}
const buf = (b: Uint8Array) => b.slice().buffer as ArrayBuffer

describe.each(VARIANTS)('solo restricciones (%s)', (_name, bits, extra) => {
  let pdf: Uint8Array
  beforeAll(async () => {
    pdf = await encrypt(await base(), '', bits, extra)
  })

  it('está cifrado, pdf-lib solo no lo abre y se reconoce como "solo restricciones"', async () => {
    expect(await isEncrypted(pdf)).toBe(true)
    await expect(PDFDocument.load(pdf)).rejects.toThrow(/encrypted/i)
    expect(await pdfLock(pdf)).toBe('restrictions')
  })

  it('organizar: unir, contar, extraer, dividir, rotar', async () => {
    const plain = await base()
    expect((await opensPlain(await mergePdfs([{ bytes: plain }, { bytes: pdf }, { bytes: pdf, pages: [0] }]))).getPageCount()).toBe(7)
    expect(await pageCount(buf(pdf))).toBe(3)
    expect((await opensPlain(await extractPages(buf(pdf), [2, 0]))).getPageCount()).toBe(2)
    expect(await splitEach(buf(pdf))).toHaveLength(3)
    expect((await splitBySize(pdf, 10_000_000)).files.length).toBeGreaterThan(0)
    expect((await opensPlain(await rotate(buf(pdf), [0], 90))).getPage(0).getRotation().angle).toBe(90)
  })

  it('editar: numerar, marca de agua, recortar, texto, firma y censurar', async () => {
    expect((await opensPlain(await numberPages(pdf))).getPageCount()).toBe(3)
    await opensPlain(await watermarkPdf(pdf, { text: 'COPIA' }))
    await opensPlain(await cropPdf(pdf, { top: 0.1, right: 0, bottom: 0, left: 0 }))
    await opensPlain(await applyEdits(pdf, [{ kind: 'text', page: 0, x: 0.1, y: 0.1, text: 'Hola', size: 14, color: '#000000', font: 'helvetica', bold: false }]))
    await opensPlain(await signPdf(pdf, PNG, [{ page: 0, x: 0.6, y: 0.8, w: 0.2, h: 0.08 }]))
    const raster = async () => ({ image: PNG, format: 'png' as const, widthPt: 595, heightPt: 842 })
    await opensPlain(await redactPdf(pdf, [{ page: 0, x: 0.1, y: 0.1, w: 0.3, h: 0.05 }], raster))
  })

  it('formularios: leer, llenar y crear campos', async () => {
    const form = await readForm(pdf)
    expect(form.fields.map((f) => [f.name, f.value])).toEqual([['Titular', 'Cuenta de prueba']])
    const filled = await opensPlain(await fillForm(pdf, { Titular: 'Otra cuenta' }))
    expect(filled.getForm().getTextField('Titular').getText()).toBe('Otra cuenta')
    const created = await opensPlain(await addFormFields(pdf, [{ kind: 'text', name: 'Nuevo', page: 0, x: 0.1, y: 0.3, w: 0.4, h: 0.05, options: [], required: false }]))
    expect(created.getForm().getFields().length).toBe(2)
  })

  it('imágenes, comprimir fotos y metadatos', async () => {
    expect((await extractImages(pdf)).images.length).toBeGreaterThanOrEqual(0)
    const encoder = async (img: { width: number; height: number }) => ({ data: PNG, width: img.width, height: img.height })
    const c = await compressImages(pdf, { maxSide: 1600, quality: 0.75, gray: false }, encoder)
    expect(c.bytes.length).toBeGreaterThan(0)
    const meta = await readPdf(pdf)
    expect(meta.find((m) => m.key === 'title')?.value).toBe('Extracto de prueba')
    await opensPlain(await stripPdf(pdf))
  })
})

describe.each(VARIANTS.slice(0, 4))('con contraseña de apertura (%s)', (_name, bits, extra) => {
  let pdf: Uint8Array
  beforeAll(async () => {
    pdf = await encrypt(await base(), 'clave-de-prueba', bits, extra)
  })

  it('se reconoce como protegido y las herramientas siguen avisando que tiene contraseña', async () => {
    expect(await pdfLock(pdf)).toBe('password')
    const err = await mergePdfs([{ bytes: await base() }, { bytes: pdf }]).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(LockedPdfError)
    expect(errorMessage(err)).toMatch(/contraseña/)
    await expect(rotate(buf(pdf), [0], 90)).rejects.toBeInstanceOf(LockedPdfError)
    await expect(readForm(pdf)).rejects.toBeInstanceOf(LockedPdfError)
    await expect(readPdf(pdf)).rejects.toThrow()
  })
})
