// Seguridad tras la auditoría W-146.3: contraseñas de hasta 127 bytes, proteger solo con
// restricciones y cambiar la contraseña; quitar metadatos de fotos dentro del PDF, comentarios,
// adjuntos y JavaScript, y autores de comentarios y cambios en Office.
import { resolve } from 'node:path'
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, PDFString } from 'pdf-lib'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { beforeAll, describe, expect, it } from 'vitest'
import { setQpdfWasmUrl } from '../../../../../src/features/security/infra/qpdf'
import { MAX_PASSWORD_BYTES, WrongPasswordError, changeProtection, isEncrypted, passwordTooLong, protect, unlock } from '../../../../../src/features/security/core/pdfSecurity'
import { leftovers, stripMetadata, readMetadata } from '../../../../../src/features/metadata/core/metadata'
import { buildExif, docxWithMeta, jpegWithMeta } from '../../../../shared/metaFixtures'

beforeAll(() => setQpdfWasmUrl(resolve(process.cwd(), 'node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm')))

async function onePage() {
  const d = await PDFDocument.create()
  d.addPage([300, 300])
  return d.save()
}

/** JPEG mínimo que pdf-lib acepta: SOI + SOF0 de 1×1 en gris + EOI. */
const tinyJpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9])
const keys = (f: { key: string }[]) => f.map((x) => x.key)

describe('proteger: largo de la contraseña', () => {
  it('cuenta bytes en UTF-8: 127 letras sirven, 128 o 70 "ñ" (140 bytes) no', () => {
    expect(MAX_PASSWORD_BYTES).toBe(127)
    expect(passwordTooLong('a'.repeat(127))).toBe(false)
    expect(passwordTooLong('a'.repeat(128))).toBe(true)
    expect(passwordTooLong('ñ'.repeat(70))).toBe(true)
    expect(passwordTooLong('😀'.repeat(31))).toBe(false) // 124 bytes
  })

  it('con 127 bytes protege y vuelve a abrir; con más, avisa en vez de dejar el PDF inaccesible', async () => {
    const src = await onePage()
    const pw = 'a'.repeat(127)
    expect((await PDFDocument.load(await unlock(await protect(src, { userPassword: pw }), pw))).getPageCount()).toBe(1)
    await expect(protect(src, { userPassword: 'a'.repeat(128) })).rejects.toThrow(/127/)
    await expect(protect(src, { userPassword: 'ok', ownerPassword: 'ñ'.repeat(70) })).rejects.toThrow(/127/)
  }, 60_000)
})

describe('proteger: solo restricciones y cambiar la contraseña', () => {
  it('sin contraseña para abrir, pero con restricciones: queda cifrado y abre sin contraseña', async () => {
    const locked = await protect(await onePage(), { userPassword: '', allowPrint: false, allowCopy: false })
    expect(await isEncrypted(locked)).toBe(true)
    expect((await PDFDocument.load(await unlock(locked, ''))).getPageCount()).toBe(1)
  }, 60_000)

  it('sin contraseña y sin restricciones no tiene sentido: pide contraseña', async () => {
    await expect(protect(await onePage(), { userPassword: '' })).rejects.toThrow()
  })

  it('cambia la contraseña con la actual: la vieja ya no abre y la nueva sí', async () => {
    const first = await protect(await onePage(), { userPassword: 'vieja-1' })
    const changed = await changeProtection(first, 'vieja-1', { userPassword: 'nueva-2' })
    await expect(unlock(changed, 'vieja-1')).rejects.toBeInstanceOf(WrongPasswordError)
    expect((await PDFDocument.load(await unlock(changed, 'nueva-2'))).getPageCount()).toBe(1)
    await expect(changeProtection(first, 'equivocada', { userPassword: 'x1234' })).rejects.toBeInstanceOf(WrongPasswordError)
  }, 60_000)
})

describe('quitar metadatos: fotos dentro del PDF', () => {
  it('quita el EXIF (cámara, autor, GPS) de las fotos sin recomprimirlas, y lo informa', async () => {
    const jpg = jpegWithMeta(tinyJpeg(), buildExif({ make: 'Apple', model: 'iPhone 15', artist: 'Ana Secreta', gps: [4.6, -74.08] }))
    const d = await PDFDocument.create()
    d.addPage([200, 200]).drawImage(await d.embedJpg(jpg), { x: 0, y: 0, width: 50, height: 50 })
    const r = await stripMetadata('scan.pdf', await d.save())
    expect(r.before).toContainEqual({ key: 'photos', value: '1' })
    expect(keys(r.after)).not.toContain('photos')
    const out = await PDFDocument.load(r.bytes)
    const photo = out.context.enumerateIndirectObjects().map(([, o]) => o).find((o): o is PDFRawStream => o instanceof PDFRawStream && o.dict.get(PDFName.of('Filter'))?.toString() === '/DCTDecode')!
    const data = Buffer.from(photo.getContents()).toString('latin1')
    expect(data).not.toContain('iPhone')
    expect(data).not.toContain('Ana Secreta')
    // Los píxeles quedan iguales: el final del JPEG (desde SOF) es el mismo.
    expect(photo.getContents().slice(-15)).toEqual(tinyJpeg().slice(-15))
  })
})

describe('quitar metadatos: comentarios, adjuntos y JavaScript del PDF', () => {
  async function withHidden() {
    const d = await PDFDocument.create()
    const page = d.addPage([400, 500])
    const note = d.context.register(d.context.obj({ Type: 'Annot', Subtype: 'Text', Rect: [10, 10, 30, 30], T: PDFString.of('Juan Revisor'), Contents: PDFString.of('Nota interna'), M: PDFString.of('D:20260101') }))
    const link = d.context.register(d.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [50, 50, 90, 60], A: { S: 'URI', URI: PDFString.of('https://docusmart.online') } }))
    page.node.set(PDFName.of('Annots'), d.context.obj([note, link]))
    await d.attach(strToU8('salarios'), 'nomina.txt', { mimeType: 'text/plain' })
    d.catalog.set(PDFName.of('OpenAction'), d.context.obj({ S: 'JavaScript', JS: PDFString.of('app.alert(1)') }))
    page.node.set(PDFName.of('AA'), d.context.obj({ O: { S: 'JavaScript', JS: PDFString.of('x()') } }))
    return d.save()
  }
  const annots = (doc: PDFDocument) => {
    const list = doc.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray)
    return list ? list.asArray().map((r) => doc.context.lookup(r) as PDFDict) : []
  }

  it('los detecta y los muestra en el informe', async () => {
    const found = await readMetadata('x.pdf', await withHidden())
    expect(found).toContainEqual({ key: 'comments', value: '1' })
    expect(found).toContainEqual({ key: 'commentAuthors', value: 'Juan Revisor' })
    expect(found).toContainEqual({ key: 'attachments', value: '1' })
    expect(found).toContainEqual({ key: 'javascript', value: '✓' })
  })

  it('siempre borra el autor y la fecha de los comentarios; sin la opción, conserva el comentario', async () => {
    const r = await stripMetadata('x.pdf', await withHidden(), { hidden: false })
    const out = await PDFDocument.load(r.bytes)
    const [note] = annots(out)
    expect(note.get(PDFName.of('T'))).toBeUndefined()
    expect(note.get(PDFName.of('M'))).toBeUndefined()
    expect(note.get(PDFName.of('Contents'))?.toString()).toContain('Nota interna')
    expect(keys(r.after)).not.toContain('commentAuthors')
    // Lo que se conserva a propósito no cuenta como "no se pudo quitar".
    expect(leftovers(r.after, { hidden: false })).toEqual([])
    expect(keys(leftovers(r.after, { hidden: true }))).toEqual(expect.arrayContaining(['comments', 'attachments', 'javascript']))
  })

  it('con la opción, quita comentarios, adjuntos y JavaScript, pero deja los enlaces', async () => {
    const r = await stripMetadata('x.pdf', await withHidden(), { hidden: true })
    const out = await PDFDocument.load(r.bytes)
    expect(annots(out).map((a) => a.get(PDFName.of('Subtype'))?.toString())).toEqual(['/Link'])
    expect(out.catalog.lookupMaybe(PDFName.of('Names'), PDFDict)?.get(PDFName.of('EmbeddedFiles'))).toBeUndefined()
    expect(out.catalog.get(PDFName.of('OpenAction'))).toBeUndefined()
    expect(out.getPage(0).node.get(PDFName.of('AA'))).toBeUndefined()
    expect(leftovers(r.after, { hidden: true })).toEqual([])
  })
})

describe('quitar metadatos: autores en Word, Excel y PowerPoint', () => {
  function docxWithPeople() {
    const files = unzipSync(docxWithMeta())
    files['word/comments.xml'] = strToU8('<w:comments xmlns:w="w"><w:comment w:id="0" w:author="Pedro Jefe" w:initials="PJ"><w:p/></w:comment></w:comments>')
    files['word/people.xml'] = strToU8('<w15:people xmlns:w15="x"><w15:person w15:author="Pedro Jefe"><w15:presenceInfo w15:providerId="AD" w15:userId="pedro@empresa.com"/></w15:person></w15:people>')
    files['word/_rels/document.xml.rels'] = strToU8('<Relationships><Relationship Id="r9" Type="people" Target="people.xml"/></Relationships>')
    const doc = files['word/document.xml'] ? strFromU8(files['word/document.xml']) : '<w:document><w:body></w:body></w:document>'
    files['word/document.xml'] = strToU8(doc.replace('</w:body>', '<w:ins w:id="1" w:author="Lucía Editora"><w:r/></w:ins></w:body>'))
    files['[Content_Types].xml'] = strToU8(strFromU8(files['[Content_Types].xml']).replace('</Types>', '<Override PartName="/word/people.xml" ContentType="x"/></Types>'))
    return zipSync(files)
  }

  it('Word: lee quién comentó o cambió, y los reemplaza por "Autor" sin correos ni people.xml', async () => {
    const before = await readMetadata('a.docx', docxWithPeople())
    const authors = before.find((f) => f.key === 'commentAuthors')!.value
    expect(authors).toContain('Pedro Jefe')
    expect(authors).toContain('Lucía Editora')
    const r = await stripMetadata('a.docx', docxWithPeople())
    const out = unzipSync(r.bytes)
    const all = Object.values(out).map((b) => strFromU8(b)).join('\n')
    expect(all).not.toContain('Pedro Jefe')
    expect(all).not.toContain('Lucía Editora')
    expect(all).not.toContain('pedro@empresa.com')
    expect(out['word/people.xml']).toBeUndefined()
    expect(strFromU8(out['word/_rels/document.xml.rels'])).not.toContain('people.xml')
    expect(strFromU8(out['[Content_Types].xml'])).not.toContain('/word/people.xml')
    expect(strFromU8(out['word/comments.xml'])).toContain('w:author="Autor"')
    expect(keys(r.after)).not.toContain('commentAuthors')
  })

  it('Excel: autores de comentarios y personas; el nombre de las tablas no se toca', async () => {
    const xlsx = zipSync({
      '[Content_Types].xml': strToU8('<Types/>'),
      'xl/comments1.xml': strToU8('<comments><authors><author>Marta Contable</author></authors></comments>'),
      'xl/persons/person.xml': strToU8('<personList><person displayName="Marta Contable" userId="marta@x.com" providerId="AD"/></personList>'),
      'xl/tables/table1.xml': strToU8('<table displayName="Ventas2026"/>'),
    })
    expect((await readMetadata('a.xlsx', xlsx)).find((f) => f.key === 'commentAuthors')?.value).toBe('Marta Contable')
    const out = unzipSync((await stripMetadata('a.xlsx', xlsx)).bytes)
    expect(strFromU8(out['xl/comments1.xml'])).toContain('<author>Autor</author>')
    expect(strFromU8(out['xl/persons/person.xml'])).not.toContain('marta@x.com')
    expect(strFromU8(out['xl/tables/table1.xml'])).toContain('displayName="Ventas2026"')
  })

  it('PowerPoint: autores de comentarios', async () => {
    const pptx = zipSync({ '[Content_Types].xml': strToU8('<Types/>'), 'ppt/commentAuthors.xml': strToU8('<p:cmAuthorLst><p:cmAuthor id="1" name="Raúl Ventas" initials="RV"/></p:cmAuthorLst>') })
    expect((await readMetadata('a.pptx', pptx)).find((f) => f.key === 'commentAuthors')?.value).toBe('Raúl Ventas')
    const out = strFromU8(unzipSync((await stripMetadata('a.pptx', pptx)).bytes)['ppt/commentAuthors.xml'])
    expect(out).toContain('name="Autor"')
    expect(out).toContain('initials="A"')
  })
})
