import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { heicOutputName, isHeic, jpegQuality, looksLikeHeic } from '../../../../../src/features/convert/core/heic'
import { HEIC_SQUARES } from '../../../../e2e/fixtures'

/** Una caja ftyp con su marca principal y las compatibles. */
function ftyp(major: string, compatible: string[] = []): Uint8Array {
  const text = ['ftyp', major, '\0\0\0\0', ...compatible].join('')
  const out = new Uint8Array(4 + text.length)
  new DataView(out.buffer).setUint32(0, out.length)
  for (let i = 0; i < text.length; i++) out[4 + i] = text.charCodeAt(i)
  return out
}

describe('reconocer fotos HEIC', () => {
  it('una foto HEIC real', () => {
    expect(isHeic(HEIC_SQUARES.subarray(0, 64))).toBe(true)
  })

  it('por la marca principal o, si es genérica, por las compatibles', () => {
    expect(isHeic(ftyp('heic', ['mif1', 'heic']))).toBe(true)
    expect(isHeic(ftyp('heix'))).toBe(true)
    expect(isHeic(ftyp('mif1', ['mif1', 'heic']))).toBe(true)
    expect(isHeic(ftyp('msf1', ['msf1', 'hevc']))).toBe(true)
  })

  it('AVIF, JPG, PNG o archivos cortos no son HEIC', () => {
    expect(isHeic(ftyp('avif', ['mif1', 'miaf']))).toBe(false)
    expect(isHeic(ftyp('mif1', ['mif1', 'avif']))).toBe(false)
    expect(isHeic(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1]))).toBe(false)
    expect(isHeic(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false)
    expect(isHeic(new Uint8Array())).toBe(false)
  })

  it('no busca marcas fuera de la caja ftyp', () => {
    const box = ftyp('mif1', ['mif1'])
    const after = new TextEncoder().encode('heic')
    const head = new Uint8Array(box.length + after.length)
    head.set(box)
    head.set(after, box.length)
    expect(isHeic(head)).toBe(false)
  })

  it('por nombre o tipo, antes de leer el archivo', () => {
    expect(looksLikeHeic('IMG_0001.HEIC', '')).toBe(true)
    expect(looksLikeHeic('foto.heif', '')).toBe(true)
    expect(looksLikeHeic('foto', 'image/heic')).toBe(true)
    expect(looksLikeHeic('foto', 'image/heif-sequence')).toBe(true)
    expect(looksLikeHeic('foto.jpg', 'image/jpeg')).toBe(false)
  })
})

describe('resultado', () => {
  it('nombre con la nueva extensión', () => {
    expect(heicOutputName('IMG_0001.HEIC', 'jpg')).toBe('IMG_0001.jpg')
    expect(heicOutputName('viaje.2024.heif', 'png')).toBe('viaje.2024.png')
    expect(heicOutputName('.heic', 'jpg')).toBe('foto.jpg')
  })

  it('calidad del JPG entre 50 y 100 %', () => {
    expect(jpegQuality(90)).toBe(0.9)
    expect(jpegQuality(10)).toBe(0.5)
    expect(jpegQuality(120)).toBe(1)
    expect(jpegQuality(Number.NaN)).toBe(0.9)
  })
})

describe('libheif (el decodificador que se publica en /heic/)', () => {
  it('abre la foto de prueba con sus colores en su lugar', async () => {
    const require = createRequire(import.meta.url)
    const dir = resolve(__dirname, '../../../../../node_modules/libheif-js/libheif-wasm')
    const factory = require(resolve(dir, 'libheif.js')) as (o: { wasmBinary: Uint8Array }) => Promise<{
      HeifDecoder: new () => { decode(d: Uint8Array): Array<{ get_width(): number; get_height(): number; is_primary(): boolean; display(t: { data: Uint8ClampedArray; width: number; height: number }, cb: (r: unknown) => void): void }> }
    }>
    const heif = await factory({ wasmBinary: readFileSync(resolve(dir, 'libheif.wasm')) })
    const [image] = new heif.HeifDecoder().decode(new Uint8Array(HEIC_SQUARES))
    expect(image.is_primary()).toBe(true)
    const width = image.get_width()
    const height = image.get_height()
    expect([width, height]).toEqual([64, 48])
    const data = new Uint8ClampedArray(width * height * 4)
    await new Promise<void>((ok, fail) => image.display({ data, width, height }, (r) => (r ? ok() : fail(new Error('no decodificó')))))
    const at = (x: number, y: number) => Array.from(data.slice((y * width + x) * 4, (y * width + x) * 4 + 3))
    const near = (got: number[], want: number[]) => got.every((v, i) => Math.abs(v - want[i]) < 30)
    expect(near(at(8, 8), [220, 30, 30])).toBe(true)
    expect(near(at(56, 8), [30, 200, 60])).toBe(true)
    expect(near(at(8, 40), [30, 60, 220])).toBe(true)
    expect(near(at(56, 40), [240, 220, 40])).toBe(true)
  })
})
