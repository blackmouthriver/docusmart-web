// Auditoría W-146.10 (Archivos): ZIP de Windows con nombres en CP850, archivos en varias partes,
// carpetas vacías y crear dividido en partes.
import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import {
  EXTRACT_ACCEPT,
  createArchiveParts,
  decodeCp850,
  extractArchive,
  isFolderEntry,
  legacyZip,
  listArchive,
  setSevenZipWasmUrl,
  splitVolumes,
  zipDirectory,
} from '../../../../../src/features/archive/core/archive'

setSevenZipWasmUrl(resolve(process.cwd(), 'node_modules/7z-wasm/7zz.wasm'))

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (b: Uint8Array) => {
  let c = 0xffffffff
  for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** ZIP sin compresión con nombres en bytes crudos (para simular el Explorador de Windows). */
function rawZip(entries: Array<{ name: Uint8Array; data: Uint8Array; utf8?: boolean }>): Uint8Array {
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const e of entries) {
    const flag = e.utf8 ? 0x0800 : 0
    const crc = crc32(e.data)
    const lh = new Uint8Array(30 + e.name.length)
    const v = new DataView(lh.buffer)
    v.setUint32(0, 0x04034b50, true)
    v.setUint16(4, 20, true)
    v.setUint16(6, flag, true)
    v.setUint16(8, 0, true)
    v.setUint32(14, crc, true)
    v.setUint32(18, e.data.length, true)
    v.setUint32(22, e.data.length, true)
    v.setUint16(26, e.name.length, true)
    lh.set(e.name, 30)
    locals.push(lh, e.data)
    const ch = new Uint8Array(46 + e.name.length)
    const c = new DataView(ch.buffer)
    c.setUint32(0, 0x02014b50, true)
    c.setUint16(4, 20, true)
    c.setUint16(6, 20, true)
    c.setUint16(8, flag, true)
    c.setUint32(16, crc, true)
    c.setUint32(20, e.data.length, true)
    c.setUint32(24, e.data.length, true)
    c.setUint16(28, e.name.length, true)
    c.setUint32(42, offset, true)
    ch.set(e.name, 46)
    centrals.push(ch)
    offset += lh.length + e.data.length
  }
  const cdSize = centrals.reduce((s, x) => s + x.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, offset, true)
  const parts = [...locals, ...centrals, end]
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

// "Año 2026/Cotización Ñandú.txt" en CP850 (como lo guarda el Explorador de Windows en español).
const cp850: Record<string, number> = { ñ: 0xa4, Ñ: 0xa5, á: 0xa0, é: 0x82, í: 0xa1, ó: 0xa2, ú: 0xa3, ü: 0x81 }
const enc850 = (s: string) => Uint8Array.from([...s].map((ch) => cp850[ch] ?? ch.charCodeAt(0)))
const txt = (s: string) => new TextEncoder().encode(s)


describe('ZIP de Windows con nombres en CP850 (W-146.10)', () => {
  it('decodeCp850: la tabla completa y las letras del español', () => {
    expect(decodeCp850(Uint8Array.from(Array.from({ length: 128 }, (_, i) => 128 + i))).length).toBe(128)
    expect(decodeCp850(enc850('Año Cotización Ñandú áéíóú ü'))).toBe('Año Cotización Ñandú áéíóú ü')
    expect(decodeCp850(Uint8Array.from([0x80, 0xa8, 0xad, 0xff]))).toBe('Ç¿¡ ')
  })

  it('zipDirectory lee nombres, marca UTF-8, tamaños y carpetas; legacyZip solo cuando hace falta', () => {
    const win = rawZip([{ name: enc850('Año/Ñandú.txt'), data: txt('hola') }, { name: txt('vacia/'), data: new Uint8Array() }])
    const dir = zipDirectory(win)!
    expect(dir.map((e) => [e.path, e.utf8, e.size, e.isDir])).toEqual([['Año/Ñandú.txt', false, 4, false], ['vacia/', false, 0, true]])
    expect(legacyZip(win)).not.toBeNull()
    expect(legacyZip(rawZip([{ name: txt('Año/Ñandú.txt'), data: txt('x'), utf8: true }]))).toBeNull()
    expect(legacyZip(rawZip([{ name: txt('plain.txt'), data: txt('x') }]))).toBeNull()
    expect(zipDirectory(new Uint8Array([1, 2, 3]))).toBeNull()
    expect(zipDirectory(new Uint8Array(30).fill(0x50))).toBeNull()
  })

  it('se lista y se extrae con los nombres bien (y la carpeta vacía se conserva)', async () => {
    const win = rawZip([{ name: enc850('Año 2026/Cotización Ñandú.txt'), data: txt('hola') }, { name: txt('vacia/'), data: new Uint8Array() }])
    expect((await listArchive('win.zip', win)).map((e) => [e.path, e.isDir])).toEqual([['Año 2026/Cotización Ñandú.txt', false], ['vacia', true]])
    const out = await extractArchive('win.zip', win)
    expect(out.map((f) => f.path)).toEqual(['Año 2026/Cotización Ñandú.txt', 'vacia/'])
    expect(new TextDecoder().decode(out[0].data)).toBe('hola')
    expect(isFolderEntry(out[1])).toBe(true)
  })
})

describe('varias partes (W-146.10)', () => {
  it('splitVolumes reconoce los grupos y su parte principal', () => {
    expect(splitVolumes(['x.7z.002', 'x.7z.001'])).toEqual({ main: 'x.7z.001', others: ['x.7z.002'] })
    expect(splitVolumes(['f.z01', 'f.zip', 'f.z02'])).toEqual({ main: 'f.zip', others: ['f.z01', 'f.z02'] })
    expect(splitVolumes(['d.part2.rar', 'd.part1.rar'])).toEqual({ main: 'd.part1.rar', others: ['d.part2.rar'] })
    expect(splitVolumes(['v.r00', 'v.rar', 'v.r01'])).toEqual({ main: 'v.rar', others: ['v.r00', 'v.r01'] })
    expect(splitVolumes(['a.zip', 'b.zip'])).toBeNull()
    expect(splitVolumes(['a.zip'])).toBeNull()
    expect(splitVolumes(['x.7z.002', 'x.7z.003'])).toBeNull()
    expect(EXTRACT_ACCEPT).toContain('.001')
    expect(EXTRACT_ACCEPT).toContain('.iso')
    expect(EXTRACT_ACCEPT).toContain('.z01')
  })

  it('crear dividido en partes y volver a abrirlo con todas', async () => {
    // Datos que no se comprimen (getRandomValues admite como máximo 64 KB por llamada).
    const big = new Uint8Array(200_000)
    for (let i = 0; i < big.length; i += 65536) crypto.getRandomValues(big.subarray(i, i + 65536))
    const parts = await createArchiveParts([{ path: 'datos.bin', data: big }, { path: 'nota.txt', data: txt('hola') }], { format: '7z', level: 'rapida', volumeBytes: 80_000 })
    expect(parts.map((p) => p.name)).toEqual(['salida.7z.001', 'salida.7z.002', 'salida.7z.003'])
    expect(parts.every((p, i) => i === parts.length - 1 || p.data.length === 80_000)).toBe(true)
    const [main, ...others] = parts.map((p) => ({ name: p.name.replace('salida', 'copia'), data: p.data }))
    const out = await extractArchive(main.name, main.data, '', 0, others)
    expect(out.map((f) => f.path).sort()).toEqual(['datos.bin', 'nota.txt'])
    expect(out.find((f) => f.path === 'datos.bin')!.data).toEqual(big)
    // Con una parte de menos, el aviso es claro.
    await expect(extractArchive(main.name, main.data, '', 0, others.slice(0, 1))).rejects.toThrow('Falta una parte')
  })

  it('si todo entra en una parte, sale un archivo común', async () => {
    const one = await createArchiveParts([{ path: 'a.txt', data: txt('x') }], { format: 'zip', volumeBytes: 10 * 1024 * 1024 })
    expect(one.map((p) => p.name)).toEqual(['salida.zip'])
  })
})
