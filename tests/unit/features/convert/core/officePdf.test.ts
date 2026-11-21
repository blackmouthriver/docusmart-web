import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { layoutPdf, tokenize, wrap, type OBlock, type OPara } from '../../../../../src/features/convert/core/officePdf'
import { FONT_STYLES, loadFonts } from '../../../../../src/shared/pdf/pdfFonts'
import { encodePng } from '../../../../../src/features/pdf/core/pdfImages'

const p = (text: string, o: Partial<OPara> = {}): OPara => ({ kind: 'para', runs: [{ text }], ...o })

/** Texto de cada página del PDF (con pdf.js, como lo vería un lector). */
async function pagesText(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: bytes.slice() }).promise
  const out: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent()
    out.push(tc.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim())
  }
  return out
}

const fonts = async () => loadFonts(await PDFDocument.create(), 'sans', FONT_STYLES, '')

describe('texto', () => {
  it('omite lo que ninguna fuente dibuja (emojis) y cambia el tabulador por espacios', async () => {
    const f = await fonts()
    const tokens = tokenize([{ text: 'Año €5 – “ok” 🎉\tfin' }], f, 10)
    expect(tokens.map((t) => (t === 'br' ? '⏎' : t.text)).join('')).toBe('Año €5 – “ok” fin')
  })

  it('separa palabras y espacios, con saltos de línea', async () => {
    const f = await fonts()
    const tokens = tokenize([{ text: 'Hola mundo\nfin', bold: true }], f, 10)
    expect(tokens.map((t) => (t === 'br' ? '⏎' : t.text))).toEqual(['Hola', ' ', 'mundo', '⏎', 'fin'])
  })

  it('corta líneas por palabra y parte las palabras larguísimas', async () => {
    const f = await fonts()
    const lines = wrap(tokenize([{ text: 'uno dos tres cuatro cinco seis' }], f, 10), 60, 1.3)
    expect(lines.length).toBeGreaterThan(1)
    lines.forEach((l) => expect(l.width).toBeLessThanOrEqual(60))
    expect(lines.every((l) => !l.tokens[l.tokens.length - 1].space)).toBe(true)
    const long = wrap(tokenize([{ text: 'https://docusmart.online/una-direccion-muy-larga' }], f, 10), 50, 1.3)
    expect(long.length).toBeGreaterThan(2)
    long.forEach((l) => expect(l.width).toBeLessThanOrEqual(50))
    // Líneas vacías (dos saltos seguidos) también ocupan su alto
    expect(wrap(tokenize([{ text: 'a\n\nb' }], f, 10), 100, 1.3)).toHaveLength(3)
  })
})

describe('layoutPdf', () => {
  it('diagrama títulos, párrafos, listas e imágenes en orden', async () => {
    const png = encodePng(new Uint8Array(Array.from({ length: 100 * 4 }, (_, i) => (i % 4 === 3 ? 255 : 120))), 10, 10)
    const blocks: OBlock[] = [
      p('Contrato de servicios', { style: 'title', align: 'center' }),
      { kind: 'image', data: png, type: 'png', width: 120, height: 120, align: 'center' },
      { kind: 'para', runs: [{ text: 'Entre ' }, { text: 'ANA', bold: true }, { text: ' y ' }, { text: 'DocuSmart', italic: true, underline: true }] },
      p('Cláusulas', { style: 'h1' }),
      p('Primer punto', { list: { ordered: false, level: 0, index: 1 } }),
      p('Segundo punto', { list: { ordered: true, level: 1, index: 2 } }),
      p('Fin', { align: 'right' }),
    ]
    const out = await layoutPdf(blocks, { title: 'Prueba', family: 'serif' })
    const [text] = await pagesText(out)
    expect(text).toBe('Contrato de servicios Entre ANA y DocuSmart Cláusulas • Primer punto 2. Segundo punto Fin')
    const doc = await PDFDocument.load(out)
    expect(doc.getTitle()).toBe('Prueba')
  })

  it('pasa a la página siguiente cuando no cabe y respeta los saltos de página', async () => {
    const many: OBlock[] = Array.from({ length: 80 }, (_, i) => p(`Párrafo número ${i + 1} con algo de texto.`))
    const out = await layoutPdf([...many, { kind: 'pagebreak' }, p('Anexo')])
    const pages = await pagesText(out)
    expect(pages.length).toBeGreaterThanOrEqual(3)
    expect(pages.at(-1)).toBe('Anexo')
    expect(pages.join(' ')).toContain('Párrafo número 80')
  })

  it('tablas con encabezado repetido en cada página', async () => {
    const cell = (s: string, bold = false): OPara[] => [{ kind: 'para', runs: [{ text: s, bold }] }]
    const rows = [[cell('Producto', true), cell('Total', true)], ...Array.from({ length: 70 }, (_, i) => [cell(`Item ${i + 1}`), cell(String(i * 100))])]
    const out = await layoutPdf([{ kind: 'table', rows, header: true, title: 'Ventas' }])
    const pages = await pagesText(out)
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[0].startsWith('Ventas Producto Total Item 1 0')).toBe(true)
    // La segunda página arranca repitiendo el encabezado
    expect(pages[1].startsWith('Producto Total')).toBe(true)
    expect(pages.join(' ')).toContain('Item 70 6900')
  })

  it('una columna de montos no parte los números aunque otra tenga texto largo', async () => {
    const cell = (s: string): OPara[] => [{ kind: 'para', runs: [{ text: s }] }]
    const long = 'Titular: Ana María Peña, cuenta de ahorros número 123-456789-00, noviembre de 2026'
    const out = await layoutPdf([{ kind: 'table', rows: [[cell(long), cell(''), cell('')], [cell('Pago'), cell('4.200.000'), cell('6.550.000,25')]] }])
    const [text] = await pagesText(out)
    expect(text).toContain('4.200.000 6.550.000,25')
  })

  it('escribe ruso, griego, chino, japonés y coreano con las fuentes incrustadas', async () => {
    const out = await layoutPdf([
      p('Договор услуг', { style: 'h1' }),
      p('Ελληνικά και Ελλάδα'),
      p('中文合同'),
      p('日本語の契約'),
      p('한국어 계약서'),
    ])
    const [text] = await pagesText(out)
    for (const s of ['Договор', 'услуг', 'Ελληνικά', '한국어', '계약서']) expect(text).toContain(s)
    // El chino y el japonés van carácter por carácter (ahí se puede cortar la línea).
    expect(text.replace(/ /g, '')).toContain('中文合同日本語の契約')
  })

  it('un salto de página al inicio no deja una página en blanco', async () => {
    const out = await layoutPdf([{ kind: 'pagebreak' }, p('Hola')])
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1)
  })

  it('las imágenes enormes se achican al ancho útil', async () => {
    const jpg = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0))
    const out = await layoutPdf([{ kind: 'image', data: jpg, type: 'jpg', width: 4000, height: 2000 }], { pageSize: [400, 600], margin: 50 })
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1)
  })
})
