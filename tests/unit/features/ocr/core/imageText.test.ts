import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import { IMAGE_OCR_ACCEPT, combineTexts, pastedName, textFileBase, textWordDoc, toParagraphs } from '../../../../../src/features/ocr/core/imageText'
import { writeDocx } from '../../../../../src/features/convert/core/pdfWord'

describe('combineTexts', () => {
  const items = [
    { name: 'a.jpg', text: ' Hola \n' },
    { name: 'b.png', text: '   ' },
    { name: 'c.png', text: 'Mundo' },
  ]
  it('une con o sin el nombre de cada imagen y omite las vacías', () => {
    expect(combineTexts(items, true)).toBe('a.jpg\nHola\n\nc.png\nMundo')
    expect(combineTexts(items, false)).toBe('Hola\n\nMundo')
  })
  it('con una sola imagen no pone el nombre', () => {
    expect(combineTexts([items[0]], true)).toBe('Hola')
    expect(combineTexts([], true)).toBe('')
  })
})

describe('toParagraphs', () => {
  it('une las líneas de un bloque y separa los bloques', () => {
    expect(toParagraphs('El zorro marrón\nsalta sobre el\nperro.\n\nOtro párrafo.')).toEqual(['El zorro marrón salta sobre el perro.', 'Otro párrafo.'])
  })
  it('repara palabras partidas con guion y respeta las viñetas', () => {
    expect(toParagraphs('Una pala-\nbra partida.')).toEqual(['Una palabra partida.'])
    expect(toParagraphs('Lista:\n- uno\n- dos\n1. tres\n2) cuatro\n• cinco')).toEqual(['Lista:', '- uno', '- dos', '1. tres', '2) cuatro', '• cinco'])
    expect(toParagraphs('- primero\nsigue')).toEqual(['- primero sigue'])
  })
  it('tolera saltos de Windows, espacios y texto vacío', () => {
    expect(toParagraphs('a\r\nb\r\n\r\n  \r\nc')).toEqual(['a b', 'c'])
    expect(toParagraphs('')).toEqual([])
    expect(toParagraphs('  \n \n')).toEqual([])
  })
})

describe('Word', () => {
  it('arma un .docx con un párrafo por bloque', () => {
    const doc = textWordDoc('Primera línea\nsigue.\n\nSegundo párrafo & más <cosas>.')
    expect(doc.blocks).toHaveLength(2)
    const xml = strFromU8(unzipSync(writeDocx(doc))['word/document.xml'])
    expect(xml).toContain('Primera línea sigue.')
    expect(xml).toContain('Segundo párrafo &amp; más &lt;cosas&gt;.')
  })
})

describe('nombres', () => {
  it('nombre del resultado', () => {
    expect(textFileBase(['Foto 1.JPG'], 'texto')).toBe('Foto 1-texto')
    expect(textFileBase(['.png'], 'texto')).toBe('texto-texto')
    expect(textFileBase(['a.png', 'b.png'], 'texto')).toBe('texto')
  })
  it('nombre de una captura pegada', () => {
    expect(pastedName('captura', 1, 'image/png')).toBe('captura-1.png')
    expect(pastedName('captura', 2, 'image/jpeg')).toBe('captura-2.jpg')
    expect(pastedName('captura', 3, 'image/svg+xml')).toBe('captura-3.svgxml')
    expect(pastedName('captura', 4, '')).toBe('captura-4.png')
    expect(IMAGE_OCR_ACCEPT).toContain('.heic')
  })
})
