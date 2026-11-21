import { afterEach, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import {
  fontsForText,
  isWinAnsi,
  loadFonts,
  piecesWidth,
  scriptsOf,
  setFontLoader,
  wrapPieces,
} from '../../../../src/shared/pdf/pdfFonts'

const nodeLoader = async (file: string) => new Uint8Array(await readFile(`public/pdf-fonts/${file}`))
afterEach(() => setFontLoader(nodeLoader))

describe('escrituras', () => {
  it('distingue latín, chino/japonés y coreano', () => {
    expect(isWinAnsi('Tamaño, café, Größe, “hola” – €')).toBe(true)
    expect(isWinAnsi('Размер')).toBe(false)
    expect(scriptsOf('Hola')).toEqual({ cjk: false, hangul: false })
    expect(scriptsOf('日本語 カナ')).toEqual({ cjk: true, hangul: false })
    expect(scriptsOf('한국어')).toEqual({ cjk: false, hangul: true })
  })
})

describe('FontSet', () => {
  it('parte en palabras, espacios y caracteres chinos; omite lo que no se puede dibujar', async () => {
    const fonts = await loadFonts(await PDFDocument.create(), 'sans', [], '中文 한국어')
    expect(fonts.standard).toBe(false)
    const pieces = fonts.pieces('Привет  мир\t中文 한국어 🎉')
    expect(pieces.map((p) => p.text)).toEqual(['Привет', ' ', 'мир', ' ', '中', '文', ' ', '한국어', ' '])
    // Cirílico con Carlito, chino con Droid, coreano con Nanum: tres fuentes distintas.
    expect(new Set(pieces.filter((p) => !p.space).map((p) => p.font)).size).toBe(3)
    expect(fonts.printable('a🎉b')).toBe('ab')
  })

  it('corta las líneas al ancho, también entre caracteres chinos', async () => {
    const fonts = await loadFonts(await PDFDocument.create(), 'sans', [], '中')
    const lines = wrapPieces(fonts.pieces('uno dos tres cuatro 中文中文中文中文中文中文'), 10, 50)
    expect(lines.length).toBeGreaterThan(2)
    for (const l of lines) expect(piecesWidth(l, 10)).toBeLessThanOrEqual(50.01)
    expect(lines.flat().map((p) => p.text).join('').replace(/ /g, '')).toBe('unodostrescuatro中文中文中文中文中文中文')
  })

  it('sin las fuentes (sin conexión) usa las estándar de PDF', async () => {
    setFontLoader(() => Promise.reject(new Error('offline')))
    const fonts = await loadFonts(await PDFDocument.create(), 'serif', ['bold'], 'Привет')
    expect(fonts.standard).toBe(true)
    expect(fonts.printable('Hola Привет')).toBe('Hola ')
  })

  it('con texto latino no descarga nada', async () => {
    let asked = 0
    setFontLoader((f) => (asked++, nodeLoader(f)))
    const fonts = await fontsForText(await PDFDocument.create(), 'sans', ['bold'], 'Confidencial')
    expect(fonts.standard).toBe(true)
    expect(asked).toBe(0)
  })
})
