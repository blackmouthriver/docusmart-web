// Audio a texto (W-133): Whisper en el navegador con el modelo real (descarga, worker, CSP).
// La voz de prueba (tests/fixtures/audio/voz-es.wav) es sintetizada, sin datos personales.
import { readFile } from 'node:fs/promises'
import { expect, test } from './helpers'

test('transcribe una nota de voz en español y entrega texto y subtítulos', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto('/audio-a-texto')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Audio a texto (transcripción)')
  const tool = page.locator('#tool')
  await expect(tool.getByRole('button', { name: 'Grabar con el micrófono' })).toBeVisible()
  // La política del sitio permite el micrófono (para dictar) solo en el propio origen; lo demás sigue bloqueado.
  expect(await page.evaluate(() => (document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy?.allowsFeature('microphone') ?? true)).toBe(true)
  expect(await page.evaluate(() => (document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy?.allowsFeature('geolocation') ?? false)).toBe(false)
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'nota.wav', mimeType: 'audio/wav', buffer: await readFile('tests/fixtures/audio/voz-es.wav') })
  await tool.getByRole('button', { name: 'Transcribir', exact: true }).click()

  const box = tool.getByLabel('Puedes corregir el texto antes de copiarlo o descargarlo.')
  await expect(box).toBeVisible({ timeout: 280_000 })
  await expect(box).toHaveValue(/Buenos días/)
  await expect(box).toHaveValue(/reunión empieza el lunes/)
  await expect(tool.getByText('Idioma: Español')).toBeVisible()

  let wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: '.srt' }).click()
  let file = await wait
  expect(file.suggestedFilename()).toBe('nota.srt')
  const srt = (await readFile((await file.path())!)).toString('utf8')
  expect(srt).toMatch(/^1\n00:00:00,000 --> 00:00:0\d,\d{3}\n/)
  expect(srt).toContain('presupuesto')

  wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: '.vtt' }).click()
  file = await wait
  expect((await readFile((await file.path())!)).toString('utf8')).toMatch(/^WEBVTT\n\n00:00:00\.000 --> /)
})

test('distingue a dos personas en un diálogo y deja ponerles nombre (W-147.4)', async ({ page }) => {
  test.setTimeout(360_000)
  await page.goto('/audio-a-texto')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'reunion.wav', mimeType: 'audio/wav', buffer: await readFile('tests/fixtures/audio/dialogo.wav') })
  await tool.getByLabel('Distinguir quién habla').check()
  await expect(tool.getByLabel('Cuántas personas hablan')).toHaveValue('0')
  await expect(tool.getByText(/Para reconocer las voces se descargan 12[,.]\d MB más/)).toBeVisible()
  await tool.getByRole('button', { name: 'Transcribir', exact: true }).click()

  const box = tool.getByLabel('Puedes corregir el texto antes de copiarlo o descargarlo.')
  await expect(box).toBeVisible({ timeout: 340_000 })
  await expect(tool.getByText('Personas que hablan: 2. Ponles nombre:')).toBeVisible()
  await expect(box).toHaveValue(/^Hablante 1 \(00:00:00\): /)
  await expect(box).toHaveValue(/\n\nHablante 2 \(00:00:0\d\): /)
  // Seis intervenciones alternadas.
  expect(((await box.inputValue()).match(/^Hablante \d/gm) ?? []).join(',')).toBe('Hablante 1,Hablante 2,Hablante 1,Hablante 2,Hablante 1,Hablante 2')

  // Una corrección del usuario se conserva al cambiar un nombre.
  await box.fill((await box.inputValue()).replace('Buenos', 'Muy buenos'))
  const name1 = tool.getByLabel('Nombre del hablante 1')
  await name1.fill('Ana')
  await name1.press('Enter')
  await expect(box).toHaveValue(/^Ana \(00:00:00\): Muy buenos/)
  expect(((await box.inputValue()).match(/^Ana \(/gm) ?? []).length).toBe(3)

  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: '.vtt' }).click()
  const vtt = (await readFile((await (await wait).path())!)).toString('utf8')
  expect(vtt).toContain('<v Ana>')
  expect(vtt).toContain('<v Hablante 2>')
})

test('un audio dañado avisa enseguida, sin descargar el modelo', async ({ page }) => {
  const modelo: string[] = []
  page.on('request', (r) => r.url().includes('/models/') && modelo.push(r.url()))
  await page.goto('/audio-a-texto')
  const tool = page.locator('#tool')
  const basura = Buffer.from(Array.from({ length: 4000 }, (_, i) => (i * 37 + 11) % 256))
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'nota.mp3', mimeType: 'audio/mpeg', buffer: basura })
  await tool.getByRole('button', { name: 'Transcribir', exact: true }).click()
  await expect(tool.locator('.notice-error, [role="alert"]').first()).toContainText(/No se pudo (leer|transcribir)|no tiene sonido/, { timeout: 15_000 })
  expect(modelo).toEqual([])
  await expect(tool.getByRole('button', { name: 'Transcribir', exact: true })).toBeEnabled()
})
