// W-147.4: varios archivos a la vez (video a MP3) y unir videos de distinto tamaño en uno solo.
import { readFile } from 'node:fs/promises'
import { unzipSync } from 'fflate'
import { ALL_FORMATS, BufferSource, Input } from 'mediabunny'
import { expect, test } from './helpers'
import { recordVideo } from './mediaClips'

const nameOf = (type: string, base: string) => `${base}.${type === 'video/mp4' ? 'mp4' : 'webm'}`

test('unir dos videos de distinto tamaño: uno solo con la duración de ambos y con sonido', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/app/#/multimedia/unir')
  const a = await recordVideo(page, 2)
  const b = await recordVideo(page, 3, 12, 480, 480)
  await page.reload()
  await page.locator('main input[type=file]').first().setInputFiles([
    { name: nameOf(a.type, 'parte-1'), mimeType: a.type, buffer: a.buffer },
    { name: nameOf(b.type, 'parte-2'), mimeType: b.type, buffer: b.buffer },
  ])
  // Se puede cambiar el orden: el segundo pasa a primero y vuelve.
  await page.getByRole('button', { name: 'Subir' }).nth(1).click()
  await expect(page.locator('main .file-list li').first()).toContainText('parte-2')
  await page.getByRole('button', { name: 'Subir' }).nth(1).click()
  await expect(page.locator('main .file-list li').first()).toContainText('parte-1')
  await page.getByRole('button', { name: 'Unir videos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Listo' })).toBeVisible({ timeout: 200_000 })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click()
  const d = await wait
  expect(d.suggestedFilename()).toBe('parte-1-unido.mp4')
  const input = new Input({ formats: ALL_FORMATS, source: new BufferSource(new Uint8Array(await readFile((await d.path())!))) })
  const v = (await input.getPrimaryVideoTrack())!
  expect([v.displayWidth, v.displayHeight]).toEqual([640, 360])
  expect(await input.getPrimaryAudioTrack()).not.toBeNull()
  const duration = await input.computeDuration()
  expect(duration).toBeGreaterThan(4.4)
  expect(duration).toBeLessThan(5.8)
})

test('video a MP3 de varios archivos a la vez: uno por video y todos en un ZIP', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/app/#/multimedia/audio')
  const a = await recordVideo(page, 2)
  const b = await recordVideo(page, 2)
  await page.reload()
  await page.locator('main input[type=file]').first().setInputFiles([
    { name: nameOf(a.type, 'reunion'), mimeType: a.type, buffer: a.buffer },
    { name: nameOf(b.type, 'clase'), mimeType: b.type, buffer: b.buffer },
    { name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') },
  ])
  // El .txt no entra: se avisa y quedan los dos videos.
  await expect(page.getByText('1 archivos no son del tipo', { exact: false })).toBeVisible()
  await expect(page.locator('main .file-list li')).toHaveCount(2)
  await page.getByRole('button', { name: 'Extraer audio', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Listos 2 de 2' })).toBeVisible({ timeout: 200_000 })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).last().click()
  const d = await wait
  expect(d.suggestedFilename()).toMatch(/\.zip$/)
  const names = Object.keys(unzipSync(new Uint8Array(await readFile((await d.path())!)))).sort()
  expect(names).toHaveLength(2)
  expect(names.every((n) => n.endsWith('.mp3'))).toBe(true)
})
