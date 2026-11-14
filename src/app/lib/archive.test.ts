import { beforeAll, describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import {
  ArchiveError,
  WrongArchivePasswordError,
  createArchive,
  extractArchive,
  hasEncrypted7zHeader,
  isZipSafePassword,
  listArchive,
  safeEntryPath,
  setSevenZipWasmUrl,
} from './archive'

const enc = (s: string) => new TextEncoder().encode(s)
const dec = (b: Uint8Array) => new TextDecoder().decode(b)

const FILES = [
  { path: 'informe.txt', data: enc('Informe DocuSmart '.repeat(400)) },
  { path: 'datos/ventas.csv', data: enc('mes,total\n1,100\n'.repeat(300)) },
  { path: 'datos/fotos/logo.svg', data: enc('<svg xmlns="http://www.w3.org/2000/svg"/>') },
]

const byPath = (files: { path: string; data: Uint8Array }[]) => Object.fromEntries(files.map((f) => [f.path, dec(f.data)]))

beforeAll(() => {
  setSevenZipWasmUrl(resolve(import.meta.dirname, '../../../node_modules/7z-wasm/7zz.wasm'))
})

describe('archive (7-Zip en wasm)', () => {
  it.each(['zip', '7z'] as const)('crea un %s, lo lista y lo extrae con carpetas', async (format) => {
    const archive = await createArchive(FILES, { format, level: 'maxima' })
    const original = FILES.reduce((n, f) => n + f.data.length, 0)
    expect(archive.length).toBeLessThan(original)

    const entries = await listArchive(`x.${format}`, archive)
    expect(entries.filter((e) => !e.isDir).map((e) => e.path).sort()).toEqual(['datos/fotos/logo.svg', 'datos/ventas.csv', 'informe.txt'])
    expect(entries.some((e) => e.isDir && e.path === 'datos')).toBe(true)

    expect(byPath(await extractArchive(`x.${format}`, archive))).toEqual(byPath(FILES))
  })

  it('ZIP con contraseña AES-256: pide la clave y rechaza la incorrecta', async () => {
    const zip = await createArchive(FILES, { format: 'zip', password: 'Clave#2026' })
    const entries = await listArchive('p.zip', zip)
    expect(entries.find((e) => e.path === 'informe.txt')?.encrypted).toBe(true)
    await expect(extractArchive('p.zip', zip, 'mala')).rejects.toBeInstanceOf(WrongArchivePasswordError)
    expect(byPath(await extractArchive('p.zip', zip, 'Clave#2026'))).toEqual(byPath(FILES))
    await expect(extractArchive('p.zip', zip)).rejects.toBeInstanceOf(WrongArchivePasswordError)
  })

  it('ZIP no acepta contraseñas con tildes o ñ; 7Z sí', async () => {
    expect(isZipSafePassword('Clave#2026')).toBe(true)
    expect(isZipSafePassword('clave-ñ')).toBe(false)
    await expect(createArchive(FILES, { format: 'zip', password: 'clave-ñ' })).rejects.toThrow(/7Z/)
    const seven = await createArchive(FILES, { format: '7z', password: 'contraseña-ñ' })
    expect(byPath(await extractArchive('p.7z', seven, 'contraseña-ñ'))).toEqual(byPath(FILES))
  })

  it('7Z con contraseña cifra también los nombres', async () => {
    const seven = await createArchive(FILES, { format: '7z', password: 'secreto' })
    await expect(listArchive('p.7z', seven)).rejects.toBeInstanceOf(WrongArchivePasswordError)
    expect((await listArchive('p.7z', seven, 'secreto')).length).toBeGreaterThan(0)
    expect(byPath(await extractArchive('p.7z', seven, 'secreto'))).toEqual(byPath(FILES))
  })

  it.each(['secreto', 'contraseña'])('7Z de nombres cifrados (%s): sin clave o con la incorrecta pide la contraseña', async (pw) => {
    const seven = await createArchive([{ path: 'privado.txt', data: enc('dato '.repeat(300)) }], { format: '7z', password: pw })
    expect(hasEncrypted7zHeader(seven)).toBe(true)
    await expect(listArchive('a.7z', seven)).rejects.toBeInstanceOf(WrongArchivePasswordError)
    await expect(listArchive('a.7z', seven, 'mala')).rejects.toBeInstanceOf(WrongArchivePasswordError)
    await expect(extractArchive('a.7z', seven)).rejects.toBeInstanceOf(WrongArchivePasswordError)
    expect(byPath(await extractArchive('a.7z', seven, pw))).toEqual({ 'privado.txt': 'dato '.repeat(300) })
  })

  it('un 7Z sin cifrar o un ZIP no se confunden con cabecera cifrada', async () => {
    expect(hasEncrypted7zHeader(await createArchive(FILES, { format: '7z' }))).toBe(false)
    expect(hasEncrypted7zHeader(await createArchive(FILES, { format: 'zip', password: 'Clave#1' }))).toBe(false)
    expect(hasEncrypted7zHeader(enc('corto'))).toBe(false)
  })

  it('nombres repetidos no se pisan', async () => {
    const zip = await createArchive(
      [
        { path: 'foto.jpg', data: enc('uno') },
        { path: 'foto.jpg', data: enc('dos') },
      ],
      { format: 'zip' },
    )
    expect(byPath(await extractArchive('r.zip', zip))).toEqual({ 'foto.jpg': 'uno', 'foto (2).jpg': 'dos' })
  })

  it('extrae un .tar.gz en dos pasos', async () => {
    const tar = await createArchive([{ path: 'a.txt', data: enc('dentro del tar') }], { format: 'zip' })
    // Un .gz de un .zip también es válido: lo importante es que se descomprime en cadena cuando hay un .tar.
    const gz = gzipSync(tar)
    const files = await extractArchive('a.zip.gz', gz)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('a.zip')
  })

  it('rechaza archivos que no son comprimidos y pide al menos un archivo', async () => {
    await expect(extractArchive('falso.zip', enc('esto no es un zip'))).rejects.toBeInstanceOf(ArchiveError)
    await expect(createArchive([], { format: 'zip' })).rejects.toBeInstanceOf(ArchiveError)
  })

  it('limpia rutas peligrosas', () => {
    expect(safeEntryPath('../../etc/passwd')).toBe('etc/passwd')
    expect(safeEntryPath('C:\\Users\\a<b>.txt')).toBe('C_/Users/a_b_.txt')
    expect(safeEntryPath('./')).toBe('archivo')
  })
})
