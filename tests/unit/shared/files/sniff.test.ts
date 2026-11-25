// Firma de los archivos: avisar al elegir un archivo vacío, dañado o que no es lo que dice ser.
import { describe, expect, it } from 'vitest'
import { checkFile, expectFromAccept, problemMessage, problemOf, sniff } from '../../../../src/shared/files/sniff'

const b = (...bytes: number[]) => new Uint8Array(bytes)
const s = (text: string) => new TextEncoder().encode(text)
const pad = (head: Uint8Array) => {
  const out = new Uint8Array(64)
  out.set(head)
  return out
}

describe('sniff', () => {
  it('reconoce cada formato por sus primeros bytes', () => {
    expect(sniff(s('%PDF-1.7\n%âãÏÓ'))).toBe('pdf')
    expect(sniff(s('basura antes\n%PDF-1.4\n'))).toBe('pdf')
    expect(sniff(pad(b(0xff, 0xd8, 0xff, 0xe0)))).toBe('jpeg')
    expect(sniff(pad(b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a)))).toBe('png')
    expect(sniff(s('GIF89a......'))).toBe('gif')
    expect(sniff(s('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '))).toBe('webp')
    expect(sniff(s('BM\u0000\u0000\u0000\u0000'))).toBe('bmp')
    expect(sniff(pad(b(0x49, 0x49, 0x2a, 0x00)))).toBe('tiff')
    expect(sniff(pad(b(0x4d, 0x4d, 0x00, 0x2a)))).toBe('tiff')
    expect(sniff(s('\u0000\u0000\u0000\u0018ftypheic\u0000\u0000'))).toBe('heif')
    expect(sniff(s('\u0000\u0000\u0000\u0018ftypmif1\u0000\u0000'))).toBe('heif')
    expect(sniff(s('\u0000\u0000\u0000\u0018ftypavif\u0000\u0000'))).toBe('avif')
    expect(sniff(s('\u0000\u0000\u0000\u0018ftypisom\u0000\u0000'))).toBeNull()
    expect(sniff(pad(b(0x50, 0x4b, 0x03, 0x04)))).toBe('zip')
    expect(sniff(s('﻿<?xml version="1.0"?>\n<!-- logo -->\n<svg xmlns="http://www.w3.org/2000/svg">'))).toBe('svg')
    expect(sniff(s('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x"><svg>'))).toBe('svg')
  })

  it('lo que no es nada conocido, o casi vacío, es null', () => {
    expect(sniff(s('Esto no es un archivo de verdad'))).toBeNull()
    expect(sniff(s('<html><body>no</body></html>'))).toBeNull()
    expect(sniff(b(1, 2))).toBeNull()
  })
})

describe('problema de un archivo', () => {
  it('vacío, no es PDF, no es imagen o sirve', () => {
    expect(problemOf(0, new Uint8Array(0), 'pdf')).toBe('empty')
    expect(problemOf(10, s('hola, mundo'), 'pdf')).toBe('notPdf')
    expect(problemOf(10, s('%PDF-1.7'), 'pdf')).toBeNull()
    expect(problemOf(10, s('%PDF-1.7'), 'image')).toBe('notImage')
    expect(problemOf(10, pad(b(0x89, 0x50, 0x4e, 0x47)), 'image')).toBeNull()
  })

  it('checkFile lee solo el comienzo del archivo', async () => {
    expect(await checkFile(new Blob([]), 'image')).toBe('empty')
    expect(await checkFile(new Blob([s('%PDF-1.4'), new Uint8Array(5_000_000)]), 'pdf')).toBeNull()
    expect(await checkFile(new Blob([s('no')]), 'image')).toBe('notImage')
  })

  it('cada problema tiene su mensaje', () => {
    expect(problemMessage('empty')).toMatch(/vacío/)
    expect(problemMessage('notPdf')).toMatch(/PDF/)
    expect(problemMessage('notImage')).toMatch(/imagen/)
  })
})

describe('qué revisar según el selector', () => {
  it('solo PDF, solo imágenes o nada (si mezcla tipos)', () => {
    expect(expectFromAccept('application/pdf')).toBe('pdf')
    expect(expectFromAccept('application/pdf,.pdf')).toBe('pdf')
    expect(expectFromAccept('image/*')).toBe('image')
    expect(expectFromAccept('image/jpeg,image/png,image/heic,.heic,image/svg+xml,.svg,.tif,.tiff')).toBe('image')
    expect(expectFromAccept('application/pdf,image/*')).toBe('pdfOrImage')
    expect(expectFromAccept('.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('any')
    expect(expectFromAccept('*/*')).toBeNull()
    expect(expectFromAccept('')).toBeNull()
  })

  it('PDF o imagen, y otros tipos (solo que no esté vacío)', async () => {
    expect(problemOf(5, s('%PDF-1.7'), 'pdfOrImage')).toBeNull()
    expect(problemOf(5, pad(b(0xff, 0xd8, 0xff)), 'pdfOrImage')).toBeNull()
    expect(problemOf(5, s('nada de nada'), 'pdfOrImage', 'scan.pdf')).toBe('notPdf')
    expect(problemOf(5, s('nada de nada'), 'pdfOrImage', 'foto.png')).toBe('notImage')
    expect(problemOf(0, new Uint8Array(0), 'any')).toBe('empty')
    expect(problemOf(5, s('lo que sea'), 'any')).toBeNull()
    expect(await checkFile(new Blob([s('hola')]), 'any')).toBeNull()
    expect(await checkFile(new File([s('nada')], 'scan.pdf'), 'pdfOrImage')).toBe('notPdf')
  })
})
