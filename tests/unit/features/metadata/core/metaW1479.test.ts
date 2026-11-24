// W-147.9: quitar metadatos de TIFF, HEIC/AVIF y video (MP4/MOV) sin tocar la imagen ni el video.
import { describe, expect, it } from 'vitest'
import { HEIC_SQUARES } from '../../../../e2e/fixtures'
import { box, cat, enc, has, heicWithExif, mp4, tiff, u16, u32 } from '../../../../e2e/metaFixtures'
import { detectKind, readMetadata, stripMetadata } from '../../../../../src/features/metadata/core/metadata'
import { bmffKind, readVideo, stripVideo } from '../../../../../src/features/metadata/core/bmffMeta'
import { readTiff, stripTiff } from '../../../../../src/features/metadata/core/tiffMeta'

describe('TIFF', () => {
  it('lee cámara, programa, fechas, autor y GPS', () => {
    const b = tiff()
    expect(detectKind('foto.tif', b)).toBe('tiff')
    const keys = readTiff(b).map((f) => f.key)
    expect(keys).toEqual(expect.arrayContaining(['camera', 'software', 'dateTaken', 'author', 'serial', 'gps', 'orientation']))
  })

  it('los quita (también escondidos en el archivo) y deja la imagen y la orientación', async () => {
    const b = tiff()
    const r = await stripMetadata('foto.tif', b)
    expect(r.after).toEqual([{ key: 'orientation', value: '6' }])
    expect(r.bytes.length).toBe(b.length)
    for (const secret of ['Apple', 'iPhone', 'Ana P', 'SN-12345', '2026:11']) expect(has(r.bytes, secret)).toBe(false)
    expect([...r.bytes.subarray(900, 908)]).toEqual([10, 20, 30, 40, 50, 60, 70, 80])
    // Las entradas que quedan siguen en orden y apuntan a los mismos píxeles.
    const v = new DataView(r.bytes.buffer)
    const n = v.getUint16(8)
    const tags = Array.from({ length: n }, (_, i) => v.getUint16(10 + i * 12))
    expect(tags).toEqual([0x0100, 0x0101, 0x0102, 0x0103, 0x0106, 0x0111, 0x0112, 0x0116, 0x0117])
    expect(v.getUint32(10 + 5 * 12 + 8)).toBe(900)
    expect(v.getUint32(10 + n * 12)).toBe(0)
  })

  it('un TIFF sin datos queda igual y BigTIFF no es compatible', () => {
    const clean = stripTiff(tiff())
    expect(stripTiff(clean)).toEqual(clean)
    const big = new Uint8Array([0x49, 0x49, 43, 0, 8, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0])
    expect(() => readTiff(big)).toThrow('unsupported')
  })
})

/* ───────────── HEIC ───────────── */

describe('HEIC', () => {
  it('reconoce HEIC y AVIF como fotos, y MP4 o MOV como video', () => {
    expect(bmffKind(HEIC_SQUARES.subarray(0, 64))).toBe('heif')
    expect(bmffKind(box('ftyp', enc('avifmif1')))).toBe('heif')
    expect(bmffKind(box('ftyp', enc('isom'), u32(0), enc('mp41')))).toBe('video')
    expect(bmffKind(box('ftyp', enc('qt  ')))).toBe('video')
    expect(bmffKind(box('moov', new Uint8Array(8)))).toBe('video')
    expect(bmffKind(enc('hola, no soy un video'))).toBeNull()
  })

  it('lee el EXIF (GPS, cámara) y el XMP, y los pone en cero sin tocar la imagen', async () => {
    const { bytes, image } = heicWithExif()
    expect(detectKind('IMG_0001.HEIC', bytes)).toBe('heif')
    const before = await readMetadata('IMG_0001.HEIC', bytes)
    expect(before.map((f) => f.key)).toEqual(expect.arrayContaining(['gps', 'camera', 'author', 'xmp']))
    const r = await stripMetadata('IMG_0001.HEIC', bytes)
    expect(r.after).toEqual([])
    expect(r.bytes.length).toBe(bytes.length)
    expect(has(r.bytes, 'iPhone')).toBe(false)
    expect(has(r.bytes, 'Credit')).toBe(false)
    const [at, len] = image
    expect(r.bytes.subarray(at, at + len)).toEqual(bytes.subarray(at, at + len))
  })

  it('una foto HEIC sin EXIF no tiene datos ni cambia', async () => {
    expect(await readMetadata('a.heic', HEIC_SQUARES)).toEqual([])
    expect(new Uint8Array((await stripMetadata('a.heic', HEIC_SQUARES)).bytes)).toEqual(new Uint8Array(HEIC_SQUARES))
  })
})

/* ───────────── Video ───────────── */

describe('video', () => {
  it('lee GPS, cámara, programa y fecha de creación', async () => {
    const fields = await readVideo(new Blob([mp4()]))
    expect(fields).toEqual(
      expect.arrayContaining([
        { key: 'gps', value: '+04.6097-074.0817/' },
        { key: 'software', value: 'Lavf60.3.100' },
        { key: 'camera', value: 'Apple' },
        { key: 'created', value: '2026-11-20 15:30' },
      ]),
    )
  })

  it('los borra sin cambiar el tamaño ni el contenido del video', async () => {
    const src = mp4()
    const out = new Uint8Array(await (await stripVideo(new Blob([src]))).arrayBuffer())
    expect(out.length).toBe(src.length)
    expect(await readVideo(new Blob([out]))).toEqual([])
    for (const secret of ['+04.6097', 'Lavf', 'iPhone', 'com.apple']) expect(has(out, secret)).toBe(false)
    expect(has(out, 'free')).toBe(true)
    // mdat (el video) queda igual, byte por byte.
    expect(out.subarray(out.length - 64)).toEqual(src.subarray(src.length - 64))
  })

  it('también las cajas de metadatos fuera de moov y el XMP', async () => {
    const xmpUuid = Uint8Array.from('be7acfcb97a942e89c71999491e3afac'.match(/../g)!, (h) => parseInt(h, 16))
    const src = mp4([box('udta', cat(u32(16), new Uint8Array([0xa9]), enc('nam'), u16(4), u16(0), enc('Boda'))), box('uuid', xmpUuid, enc('<x:xmpmeta>Ana</x:xmpmeta>'))])
    const before = await readVideo(new Blob([src]))
    expect(before.map((f) => f.key)).toEqual(expect.arrayContaining(['title', 'xmp']))
    const r = await stripMetadata('video.mp4', src)
    expect(r.after).toEqual([])
    expect(has(r.bytes, 'Boda')).toBe(false)
    expect(has(r.bytes, 'xmpmeta')).toBe(false)
  })

  it('un archivo sin moov está dañado', async () => {
    await expect(readVideo(new Blob([box('ftyp', enc('isom'))]))).rejects.toThrow('damaged')
  })
})
