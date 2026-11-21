import { describe, expect, it } from 'vitest'
import { strFromU8, unzipSync } from 'fflate'
import { assignColors, buildDocument, buildLines, cleanFontName, dominant, findColumns, matchDrawn, summarize, untrack, writeDocx, xmlText, type Columns, type Para, type Table, type TextFrag } from '../../../../../src/features/convert/core/pdfWord'
import { encodePng } from '../../../../../src/features/pdf/core/pdfImages'

const A4 = { width: 595, height: 842 }
/** Fragmento con ancho aproximado (0.5 × tamaño por carácter). */
const t = (str: string, x: number, y: number, o: Partial<TextFrag> = {}): TextFrag => ({
  page: 0,
  str,
  x,
  y,
  w: str.length * (o.size ?? 11) * 0.5,
  size: 11,
  bold: false,
  italic: false,
  family: 'sans',
  ...o,
})
const text = (p: Para) => p.runs.map((r) => r.text).join('')
const paras = (blocks: ReturnType<typeof buildDocument>['blocks']) => blocks.filter((b): b is Para => b.kind === 'para')

describe('buildLines', () => {
  it('agrupa por línea base, ordena por x y pone espacios donde hay huecos', () => {
    const lines = buildLines([t('mundo', 97, 100), t('Hola', 72, 100.5), t('Otra', 72, 115)])
    expect(lines).toHaveLength(2)
    expect(lines[0].segments[0].runs.map((r) => r.text).join('')).toBe('Hola mundo')
  })

  it('separa en segmentos cuando hay un hueco grande (columnas)', () => {
    const [line] = buildLines([t('Nombre', 72, 100), t('Valor', 300, 100)])
    expect(line.segments).toHaveLength(2)
  })

  it('une fragmentos con el mismo estilo y respeta negrita y cursiva', () => {
    const [line] = buildLines([t('Hola', 72, 100), t('mundo', 96, 100, { bold: true }), t('feliz', 128, 100, { italic: true })])
    expect(line.segments[0].runs.map((r) => [r.text, r.bold, r.italic])).toEqual([
      ['Hola ', false, false],
      ['mundo ', true, false],
      ['feliz', false, true],
    ])
  })

  it('ignora fragmentos vacíos', () => {
    expect(buildLines([t('', 72, 100), t('   ', 72, 120)])).toEqual([])
  })

  it('los espacios que rellenan el hueco entre columnas no unen las celdas (como hace Word)', () => {
    const [line] = buildLines([t('Concepto', 90, 100), t('                    ', 134, 100, { w: 100 }), t('Fecha', 234, 100)])
    expect(line.segments.map((s) => s.runs.map((r) => r.text).join(''))).toEqual(['Concepto', 'Fecha'])
  })
})

describe('cleanFontName', () => {
  it('saca el nombre de familia de la fuente incrustada', () => {
    expect(cleanFontName('BCDEEE+Calibri-Bold')).toBe('Calibri')
    expect(cleanFontName('TimesNewRomanPSMT')).toBe('Times New Roman')
    expect(cleanFontName('ArialMT')).toBe('Arial')
    expect(cleanFontName('Cambria,BoldItalic')).toBe('Cambria')
    expect(cleanFontName('CourierNewPS-BoldMT')).toBe('Courier New')
    expect(cleanFontName('g_d0_f1')).toBeUndefined()
    expect(cleanFontName(undefined)).toBeUndefined()
  })
})

describe('dominant', () => {
  it('elige el valor con más caracteres', () => {
    expect(dominant([t('aaaa', 0, 0, { size: 10 }), t('b', 0, 0, { size: 20 })], (f) => f.size)).toBe(10)
    expect(dominant([], (f) => f.size)).toBeUndefined()
  })
})

describe('buildDocument', () => {
  // Página típica: título grande centrado, párrafo de dos líneas con palabra cortada, lista y una tabla.
  const frags = [
    t('INFORME ANUAL', 230, 80, { size: 22, bold: true }),
    t('El proyecto avanzó según lo previsto y la docu-', 72, 130),
    t('mentación quedó completa en todos los módulos.', 72, 144),
    t('Un párrafo nuevo después de un espacio.', 72, 180),
    t('• Primer punto de la lista', 72, 210),
    t('• Segundo punto', 72, 224),
    t('Producto', 72, 260, { bold: true }),
    t('Cantidad', 300, 260, { bold: true }),
    t('Cuadernos', 72, 274),
    t('120', 300, 274),
    t('Lápices', 72, 288),
    t('450', 300, 288),
    t('Segunda página', 72, 80, { page: 1 }),
  ]

  it('reconstruye títulos, párrafos, listas y tablas', () => {
    const doc = buildDocument([A4, A4], frags)
    expect(doc.bodySize).toBe(11)
    const ps = paras(doc.blocks)
    const title = ps[0]
    expect(text(title)).toBe('INFORME ANUAL')
    expect(title.heading).toBe(1)
    expect(title.align).toBe('center')
    // Dos líneas unidas, sin el guion de la palabra cortada
    expect(text(ps[1])).toBe('El proyecto avanzó según lo previsto y la documentación quedó completa en todos los módulos.')
    expect(text(ps[2])).toBe('Un párrafo nuevo después de un espacio.')
    expect(ps[3]).toMatchObject({ bullet: true })
    expect(text(ps[3])).toBe('Primer punto de la lista')
    expect(text(ps[4])).toBe('Segundo punto')
    const table = doc.blocks.find((b): b is Table => b.kind === 'table')!
    expect(table.rows.map((r) => r.map((c) => c.map((x) => x.text).join('')))).toEqual([
      ['Producto', 'Cantidad'],
      ['Cuadernos', '120'],
      ['Lápices', '450'],
    ])
    expect(table.rows[0][0][0].bold).toBe(true)
    // Salto de página y el contenido de la segunda
    const pb = doc.blocks.findIndex((b) => b.kind === 'pagebreak')
    expect(text(doc.blocks[pb + 1] as Para)).toBe('Segunda página')
    expect(summarize(doc)).toEqual({ paragraphs: 6, tables: 1, images: 0, headings: 1 })
  })

  it('asigna los niveles de título por tamaño, y detecta sangría y texto a la derecha', () => {
    const doc = buildDocument([A4], [
      t('Introducción', 72, 80, { size: 15 }),
      t('Detalle importante', 72, 110, { size: 12.5, bold: true }),
      t('Texto normal del documento que ocupa casi todo el ancho disponible.', 72, 140),
      t('Cita con sangría', 120, 170),
      t('Bogotá, 14 de noviembre', 400, 200),
      t('Texto normal del documento que ocupa casi todo el ancho de la página.', 72, 230),
    ])
    const ps = paras(doc.blocks)
    expect(ps.map((p) => p.heading)).toEqual([1, 2, 0, 0, 0, 0])
    expect(ps[3].indent).toBeGreaterThan(0)
    expect(ps[4].align).toBe('right')
  })

  it('intercala las imágenes según su posición y descarta las diminutas', () => {
    const png = encodePng(new Uint8Array([255, 0, 0, 255]), 1, 1)
    const doc = buildDocument(
      [A4],
      [t('Arriba', 72, 100), t('Abajo', 72, 400)],
      [
        { page: 0, x: 72, y: 200, w: 200, h: 100, png },
        { page: 0, x: 72, y: 300, w: 10, h: 10, png },
      ],
    )
    expect(doc.blocks.map((b) => b.kind)).toEqual(['para', 'image', 'para'])
  })

  it('un PDF sin texto da un documento vacío con márgenes por defecto', () => {
    const doc = buildDocument([A4], [])
    expect(doc.blocks).toEqual([])
    expect(doc.margins.left).toBe(72)
  })

  it('un título ancho centrado en la página se reconoce como centrado', () => {
    const body = t('x'.repeat(80), 72, 140) // cuerpo de 72 a 512
    const title = t('Contrato de prestación de servicios', 297.5 - 180, 80, { size: 20, w: 360 })
    const [p] = paras(buildDocument([A4], [title, body]).blocks)
    expect(p.align).toBe('center')
  })

  it('el espacio entre líneas no hereda la cursiva de la línea siguiente', () => {
    const [p] = paras(buildDocument([A4], [t('Firmado por', 72, 100), t('DocuSmart', 72, 114, { italic: true })]).blocks)
    expect(p.runs.map((r) => [r.text, r.italic])).toEqual([['Firmado por ', false], ['DocuSmart', true]])
  })

  it('usa la fuente real del PDF, conserva el aspecto de los títulos y centra imágenes', () => {
    const png = encodePng(new Uint8Array([255, 0, 0, 255]), 1, 1)
    const doc = buildDocument(
      [A4],
      [
        t('Título grande', 72, 80, { size: 26, font: 'Calibri Light' }),
        t('Texto del cuerpo en Calibri que ocupa buena parte del ancho de la página entera.', 72, 140, { font: 'Calibri' }),
        t('Código', 72, 160, { family: 'mono', font: 'Consolas' }),
      ],
      [{ page: 0, x: 247.5, y: 100, w: 100, h: 30, png }],
    )
    expect(doc.bodyFont).toBe('Calibri')
    const xml = strFromU8(unzipSync(writeDocx(doc))['word/document.xml'])
    expect(xml).toContain('<w:rFonts w:ascii="Calibri Light"')
    expect(xml).toContain('<w:rFonts w:ascii="Consolas"')
    // Título: tamaño real (26 pt) y sin negrita explícita, por encima del estilo
    expect(xml).toMatch(/<w:pStyle w:val="Heading1"\/><\/w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri Light"[^>]*\/><w:b w:val="0"\/><w:sz w:val="52"\/>/)
    expect(xml).toContain('<w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing>')
    expect(strFromU8(unzipSync(writeDocx(doc))['word/styles.xml'])).toContain('w:ascii="Calibri"')
  })

  it('reconoce la viñeta aunque venga sola, con otra fuente (como en los PDF de Word)', () => {
    const ps = paras(buildDocument([A4], [t('•', 90, 100, { font: 'Symbol' }), t('Primer punto', 108, 100, { font: 'Calibri' }), t('•', 90, 300, { font: 'Symbol' })]).blocks)
    expect(ps[0]).toMatchObject({ bullet: true })
    expect(ps[0].runs.map((r) => r.text)).toEqual(['Primer punto'])
    // Una viñeta sin texto no es un elemento de lista
    expect(ps[1].bullet).toBe(false)
  })

  it('las listas numeradas conservan su número original', () => {
    const ps = paras(buildDocument([A4], [t('1. Primero', 72, 100), t('2. Segundo', 72, 114)]).blocks)
    expect(ps.map(text)).toEqual(['1. Primero', '2. Segundo'])
    expect(ps.every((p) => !p.bullet)).toBe(true)
  })
})

describe('writeDocx', () => {
  const png = encodePng(new Uint8Array([0, 128, 255, 255]), 1, 1)
  const doc = buildDocument(
    [A4, { width: 842, height: 595 }],
    [
      t('Título & <prueba>', 72, 80, { size: 20 }),
      t('Texto con', 72, 120),
      t('negrita', 124, 120, { bold: true }),
      t('Una línea de texto normal que ocupa todo el ancho de la página, como en un documento.', 72, 135),
      t('Código', 72, 150, { family: 'mono', size: 9 }),
      t('• Viñeta', 72, 180),
      t('A', 72, 210),
      t('B', 300, 210),
      t('C', 72, 224),
      t('D', 300, 224),
      t('Centro', 281, 260),
      t('Hoja dos', 72, 80, { page: 1 }),
    ],
    [{ page: 0, x: 72, y: 300, w: 800, h: 400, png }],
  )
  const files = unzipSync(writeDocx(doc))
  const xml = strFromU8(files['word/document.xml'])

  it('arma el paquete con todas sus partes', () => {
    expect(Object.keys(files).sort()).toEqual(
      ['[Content_Types].xml', '_rels/.rels', 'word/_rels/document.xml.rels', 'word/document.xml', 'word/media/imagen1.png', 'word/numbering.xml', 'word/styles.xml'].sort(),
    )
    expect(files['word/media/imagen1.png']).toEqual(png)
    expect(strFromU8(files['word/_rels/document.xml.rels'])).toContain('Target="media/imagen1.png"')
  })

  it('escribe títulos, formato, viñetas, tablas, imágenes y saltos de página', () => {
    expect(xml).toContain('<w:pStyle w:val="Heading1"/>')
    expect(xml).toContain('Título &amp; &lt;prueba&gt;')
    expect(xml).toMatch(/<w:b\/><\/w:rPr><w:t xml:space="preserve">negrita ?<\/w:t>/)
    expect(xml).toContain('<w:rFonts w:ascii="Courier New"')
    expect(xml).toContain('<w:sz w:val="18"/>')
    expect(xml).toContain('<w:numId w:val="1"/>')
    expect(xml).toContain('<w:tbl>')
    expect(xml).toContain('<w:jc w:val="center"/>')
    expect(xml).toContain('<w:br w:type="page"/>')
    expect(xml).toContain('r:embed="rIdImg1"')
    // La imagen más ancha que la página se achica al ancho del texto, conservando la proporción
    const [, cx, cy] = /<wp:extent cx="(\d+)" cy="(\d+)"\/>/.exec(xml)!
    expect(Number(cx) / Number(cy)).toBeCloseTo(2)
    expect(Number(cx)).toBeLessThan(595 * 12700)
    // Tamaño de página A4 en twips
    expect(xml).toContain('<w:pgSz w:w="11900" w:h="16840"/>')
  })

  it('las etiquetas abren y cierran parejas', () => {
    for (const tag of ['w:p', 'w:r', 'w:tbl', 'w:tr', 'w:tc', 'w:body']) {
      const open = (xml.match(new RegExp(`<${tag}[ >]`, 'g')) ?? []).length
      const close = (xml.match(new RegExp(`</${tag}>`, 'g')) ?? []).length
      expect(open, tag).toBe(close)
    }
  })

  it('estilos con la fuente y el tamaño del cuerpo, y página apaisada', () => {
    const styles = strFromU8(files['word/styles.xml'])
    expect(styles).toContain('w:ascii="Arial"')
    expect(styles).toContain('<w:sz w:val="22"/>')
    expect(strFromU8(files['word/numbering.xml'])).toContain('w:ascii="Symbol"')
    const land = buildDocument([{ width: 842, height: 595 }], [t('x', 72, 80)])
    expect(strFromU8(unzipSync(writeDocx(land))['word/document.xml'])).toContain('w:orient="landscape"')
  })

  it('escapa y limpia el texto', () => {
    expect(xmlText('a\u0001b & "c"')).toBe('ab &amp; &quot;c&quot;')
  })
})

describe('colores, texto espaciado, columnas y fondos (PDF con diseño)', () => {
  it('asigna a cada texto el color con que se dibujó y recupera los espacios reales', () => {
    const runs = [{ color: '000000', text: 'Hola' }, { color: 'CA726F', text: 'RUTH' }, { color: 'CA726F', text: ' ' }, { color: '4F6274', text: 'ESP.GESTIÓN DE LA' }]
    expect(assignColors(['Hola', 'RUTH', 'E S P . G E S T I Ó N', 'D E', 'L A', 'nada'], runs)).toEqual([undefined, 'CA726F', '4F6274', '4F6274', '4F6274', undefined])
    expect(matchDrawn(['E S P . G E S T I Ó N D E L A'], runs)[0]?.text).toBe('ESP.GESTIÓN DE LA')
  })

  it('untrack: texto letra por letra a palabras con espaciado entre letras', () => {
    expect(untrack('O P T Ó M E T R A', 'OPTÓMETRA', 88, 9)).toEqual({ str: 'OPTÓMETRA', spacing: expect.any(Number) })
    expect(untrack('O P T Ó M E T R A', 'OPTÓMETRA', 88, 9)!.spacing).toBeGreaterThan(3)
    expect(untrack('D E', 'DE', 17, 11)?.str).toBe('DE')
    // Si lo dibujado no coincide, o el texto no está espaciado, se deja como está.
    expect(untrack('O P T', 'OTRA', 30, 9)).toBeNull()
    expect(untrack('Hola mundo', 'Hola mundo', 50, 11)).toBeNull()
    expect(untrack('A B C', undefined, 30, 11)).toBeNull()
  })

  it('una línea espaciada queda en una sola corrida, con el mismo espaciado y los espacios entre palabras', () => {
    const lines = buildLines([
      t('ESP.GESTIÓN', 80, 100, { w: 99, spacing: 2 }),
      t('DE', 188, 100, { w: 17, spacing: 2.2 }),
      t('Y', 214, 100, { w: 6 }),
      t('SALUD', 230, 100, { w: 46, spacing: 2.1 }),
    ])
    expect(lines[0].segments[0].runs.map((r) => [r.text, r.spacing])).toEqual([['ESP.GESTIÓN DE Y SALUD', 2.1]])
    // Letras sueltas con el mismo hueco (cada una un fragmento): también es texto espaciado.
    const single = buildLines('OPTÓMETRA'.split('').map((c, i) => t(c, 100 + i * 9, 50, { w: 5.5 })))
    expect(single[0].segments[0].runs[0]).toMatchObject({ text: 'OPTÓMETRA', spacing: 3.5 })
  })

  it('findColumns: corte por el texto y por el fondo de la columna lateral', () => {
    const left = Array.from({ length: 12 }, (_, i) => t(`Dato personal ${i}`, 40, 200 + i * 40, { w: 120 }))
    const right = Array.from({ length: 12 }, (_, i) => t(`Experiencia profesional larga ${i}`, 260, 200 + i * 40, { w: 280 }))
    const title = t('NOMBRE COMPLETO DE LA PERSONA', 40, 80, { w: 500, size: 30 })
    const cols = findColumns(buildLines([title, ...left, ...right]), A4)
    expect(cols).not.toBeNull()
    expect(cols!.x).toBeGreaterThan(160)
    expect(cols!.x).toBeLessThan(260)
    expect(cols!.top).toBe(80)
    // Poco texto a la izquierda: sin el fondo no hay columnas; con él, sí (en su borde).
    const few = buildLines([title, t('IDIOMAS', 40, 200, { w: 60 }), ...right])
    expect(findColumns(few, A4)).toBeNull()
    expect(findColumns(few, A4, [{ page: 0, x: 0, y: 150, w: 220, h: 650, color: 'EAEBEC' }])).toEqual({ x: 220, top: 80 })
    // Un documento normal (líneas de lado a lado) no tiene columnas.
    expect(findColumns(buildLines(Array.from({ length: 20 }, (_, i) => t('Texto de un párrafo que ocupa todo el ancho de la hoja', 60, 100 + i * 14, { w: 470 }))), A4)).toBeNull()
  })

  it('buildDocument: franjas, columnas con su fondo y colores en las corridas', () => {
    const left = Array.from({ length: 10 }, (_, i) => t(`Dato ${i}`, 40, 220 + i * 40, { w: 100, color: '4F6274' }))
    const right = Array.from({ length: 10 }, (_, i) => t(`Experiencia ${i}`, 260, 220 + i * 40, { w: 200 }))
    const rects = [
      { page: 0, x: 0, y: 0, w: 595, h: 842, color: 'F2F2F2' },
      { page: 0, x: 20, y: 10, w: 555, h: 20, color: 'CA726F' },
      { page: 0, x: 0, y: 180, w: 220, h: 600, color: 'EAEBEC' },
    ]
    const doc = buildDocument([A4], [t('RUTH GÓMEZ', 200, 100, { size: 28, color: 'CA726F' }), ...left, ...right], [], rects)
    expect(doc.blocks.map((b) => b.kind)).toEqual(['band', 'para', 'columns'])
    expect(doc.blocks[0]).toEqual({ kind: 'band', color: 'CA726F', height: 20 })
    expect(doc.margins.top).toBe(10)
    expect((doc.blocks[1] as Para).runs[0].color).toBe('CA726F')
    const cols = doc.blocks[2] as Columns
    expect(cols.fills).toEqual(['EAEBEC', undefined])
    expect(cols.cells.map((c) => c.length)).toEqual([10, 10])
    expect(((cols.cells[0][0] as Para).runs[0]).color).toBe('4F6274')
    expect(summarize(doc).paragraphs).toBe(21)

    // En el .docx: tabla sin bordes, fondo de la columna, franja sombreada, color y espaciado.
    const xml = strFromU8(unzipSync(writeDocx({ ...doc, blocks: [...doc.blocks, { kind: 'para', runs: [{ text: 'OPTÓMETRA', bold: false, italic: false, size: 9, family: 'sans', spacing: 3.5 }], align: 'center', heading: 0, bullet: false, indent: 0 }] }))['word/document.xml'])
    expect(xml).toContain('<w:shd w:val="clear" w:color="auto" w:fill="CA726F"/><w:spacing w:before="0" w:after="0" w:line="400" w:lineRule="exact"/>')
    expect(xml).toContain('<w:insideV w:val="nil"/>')
    expect(xml).toContain('<w:shd w:val="clear" w:color="auto" w:fill="EAEBEC"/>')
    expect(xml).toContain('<w:color w:val="CA726F"/>')
    expect(xml).toContain('<w:spacing w:val="70"/>')
  })
})
