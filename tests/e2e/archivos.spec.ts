// Archivos tras la auditoría W-146.10: ZIP del Explorador de Windows con tildes y eñes, elegir qué
// extraer y verlo antes, carpetas vacías y crear y abrir un archivo dividido en partes.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { unzipSync, zipSync } from 'fflate'
import { expect, test } from './helpers'

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



async function saveAll(page: Page) {
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click({ timeout: 60_000 })
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

test('un ZIP del Explorador de Windows con tildes y eñes se abre con los nombres bien, y la carpeta vacía se conserva', async ({ page }) => {
  await page.goto('/app/#/archivos/extraer')
  const zip = rawZip([
    { name: enc850('Año 2026/Cotización Ñandú.txt'), data: txt('hola') },
    { name: enc850('Año 2026/Señal.txt'), data: txt('chao') },
    { name: txt('vacia/'), data: new Uint8Array() },
  ])
  await page.locator('main input[type=file]').first().setInputFiles({ name: 'documentos.zip', mimeType: 'application/zip', buffer: Buffer.from(zip) })
  await expect(page.getByText('Año 2026/Cotización Ñandú.txt')).toBeVisible()
  await page.getByRole('button', { name: 'Extraer archivos' }).click()
  await expect(page.getByText('Carpeta vacía')).toBeVisible()
  const out = await saveAll(page)
  expect(Object.keys(unzipSync(out.bytes)).sort()).toEqual(['Año 2026/Cotización Ñandú.txt', 'Año 2026/Señal.txt', 'vacia/'])
})

test('elegir qué extraer y ver un archivo antes de bajarlo @movil', async ({ page }) => {
  await page.goto('/app/#/archivos/extraer')
  const zip = zipSync({ 'nota.txt': txt('Texto de la nota de prueba'), 'foto.bin': new Uint8Array(500), 'otro.txt': txt('no quiero este') })
  await page.locator('main input[type=file]').first().setInputFiles({ name: 'varios.zip', mimeType: 'application/zip', buffer: Buffer.from(zip) })
  await expect(page.getByText('3 de 3 elegidos')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Extraer otro.txt' }).uncheck()
  await page.getByRole('button', { name: 'Extraer 2 elegidos' }).click()
  await expect(page.getByRole('button', { name: 'Ver nota.txt' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descargar otro.txt' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver nota.txt' }).click()
  await expect(page.getByText('Texto de la nota de prueba')).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar vista previa' }).click()
  await expect(page.getByText('Texto de la nota de prueba')).toHaveCount(0)
})

test('crear un ZIP dividido en partes de 10 MB y volver a abrirlo eligiendo todas', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/app/#/archivos/crear')
  // 11 MB que no se comprimen: salen 2 partes.
  const big = Buffer.alloc(11 * 1024 * 1024)
  for (let i = 0; i < big.length; i += 4) big.writeUInt32LE((Math.imul(i + 1, 2654435761) ^ (i >>> 7)) >>> 0, i)
  await page.locator('main input[type=file]').first().setInputFiles({ name: 'video.bin', mimeType: 'application/octet-stream', buffer: big })
  await page.getByRole('group', { name: 'Dividir en partes' }).getByRole('button', { name: '10 MB' }).click()
  await expect(page.getByText('Útil para mandarlo en varios correos', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Crear ZIP' }).click()
  await expect(page.getByText('Listo: 2 partes', { exact: false })).toBeVisible({ timeout: 90_000 })
  const parts: Array<{ name: string; buffer: Buffer; mimeType: string }> = []
  for (const name of ['archivos.zip.001', 'archivos.zip.002']) {
    const wait = page.waitForEvent('download')
    await page.getByRole('button', { name: `Descargar ${name}` }).click()
    const d = await wait
    expect(d.suggestedFilename()).toBe(name)
    parts.push({ name, buffer: await readFile((await d.path())!), mimeType: 'application/octet-stream' })
  }
  expect(parts[0].buffer.length).toBe(10 * 1024 * 1024)

  await page.goto('/app/#/archivos/extraer')
  await expect(page.getByRole('button', { name: 'Descomprimir' })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('main input[type=file]').first().setInputFiles(parts.reverse())
  await expect(page.getByText('2 partes', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Extraer archivos' }).click()
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar video.bin' }).click()
  const back = await readFile((await (await wait).path())!)
  expect(back.length).toBe(big.length)
  expect(back.equals(big)).toBe(true)
})
