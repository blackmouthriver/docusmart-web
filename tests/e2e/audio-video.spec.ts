// Audio y video (W-132): video a MP3, convertir, recortar y comprimir con WebCodecs.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test } from './helpers'

/** Graba en el navegador un WebM de prueba (colores que cambian + un tono) de `seconds` segundos. */
async function makeWebm(page: Page, seconds: number): Promise<Buffer> {
  const b64 = await page.evaluate(async (secs) => {
    const c = document.createElement('canvas')
    c.width = 320
    c.height = 240
    const ctx = c.getContext('2d')!
    const stream = c.captureStream(30)
    const ac = new AudioContext()
    await ac.resume()
    const osc = ac.createOscillator()
    const dst = ac.createMediaStreamDestination()
    osc.connect(dst)
    osc.start()
    stream.addTrack(dst.stream.getAudioTracks()[0])
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
    const chunks: Blob[] = []
    rec.ondataavailable = (e) => chunks.push(e.data)
    rec.start(100)
    const t0 = performance.now()
    await new Promise<void>((done) => {
      const timer = setInterval(() => {
        const t = performance.now() - t0
        ctx.fillStyle = `hsl(${Math.round(t / 4) % 360}, 80%, 50%)`
        ctx.fillRect(0, 0, 320, 240)
        if (t >= secs * 1000) {
          clearInterval(timer)
          done()
        }
      }, 33)
    })
    rec.stop()
    await new Promise((r) => (rec.onstop = r))
    osc.stop()
    await ac.close()
    const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer())
    let s = ''
    for (const b of bytes) s += String.fromCharCode(b)
    return btoa(s)
  }, seconds)
  return Buffer.from(b64, 'base64')
}

async function pick(page: Page, name: string, buffer: Buffer, mimeType = 'video/webm') {
  await page.locator('#tool input[type=file]').first().setInputFiles({ name, mimeType, buffer })
}

async function downloadResult(page: Page) {
  const tool = page.locator('#tool')
  await expect(tool.getByRole('heading', { name: 'Listo' })).toBeVisible({ timeout: 60_000 })
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click()
  const file = await wait
  return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) }
}

/** Duración que reporta el reproductor del resultado. */
async function resultDuration(page: Page) {
  const player = page.locator('#tool').getByLabel('Resultado')
  await expect(player).toBeVisible()
  return player.evaluate(async (el: HTMLMediaElement) => {
    if (!Number.isFinite(el.duration) || el.readyState < 1) await new Promise((r) => el.addEventListener('loadedmetadata', r, { once: true }))
    // WebM sin duración en la cabecera: se busca el final para que el navegador la calcule.
    if (!Number.isFinite(el.duration)) {
      el.currentTime = 1e6
      await new Promise((r) => el.addEventListener('durationchange', r, { once: true }))
    }
    return el.duration
  })
}

test('video a MP3: extrae el audio', async ({ page }) => {
  await page.goto('/video-a-mp3')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Video a MP3: extraer el audio')
  const clip = await makeWebm(page, 2)
  await pick(page, 'clip.webm', clip)
  const tool = page.locator('#tool')
  await expect(tool.getByText(/0:0[12]/)).toBeVisible({ timeout: 15_000 })
  await expect(tool.getByRole('group', { name: 'Formato' }).getByRole('button', { name: 'MP3' })).toHaveAttribute('aria-pressed', 'true')
  await tool.getByRole('button', { name: 'Extraer audio' }).click()
  const out = await downloadResult(page)
  expect(out.name).toBe('clip-audio.mp3')
  // MP3: etiqueta ID3 o sincronía de cuadro (0xFFE).
  const head = out.bytes.subarray(0, 3)
  expect(head.toString('latin1') === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)).toBe(true)
  expect(await resultDuration(page)).toBeGreaterThan(1)
})

test('convertir video a MP4, sin sonido', async ({ page }) => {
  await page.goto('/convertir-video')
  const clip = await makeWebm(page, 2)
  await pick(page, 'clip.webm', clip)
  const tool = page.locator('#tool')
  await expect(tool.getByText(/320 × 240/)).toBeVisible({ timeout: 15_000 })
  await tool.getByLabel('Quitar el sonido').check()
  await tool.getByRole('button', { name: 'Convertir video' }).click()
  const out = await downloadResult(page)
  expect(out.name).toBe('clip-convertido.mp4')
  expect(out.bytes.subarray(4, 8).toString('latin1')).toBe('ftyp')
  // Sin pista de audio: no hay códec de audio en el MP4.
  expect(out.bytes.includes(Buffer.from('mp4a'))).toBe(false)
  expect(out.bytes.includes(Buffer.from('Opus'))).toBe(false)
})

test('recortar: valida los tiempos y deja solo el tramo elegido', async ({ page }) => {
  await page.goto('/recortar-audio-video')
  const clip = await makeWebm(page, 3)
  await pick(page, 'clip.webm', clip)
  const tool = page.locator('#tool')
  const start = tool.getByLabel('Inicio')
  const end = tool.getByLabel('Final')
  await expect(start).toHaveValue('0:00', { timeout: 15_000 })
  await end.fill('abc')
  await expect(tool.getByText('Escribe el tiempo como 1:23 o 1:23.5.')).toBeVisible()
  await expect(tool.getByRole('button', { name: 'Recortar', exact: true })).toBeDisabled()
  await start.fill('0:02')
  await end.fill('0:01')
  await expect(tool.getByText('El final tiene que ir después del inicio.')).toBeVisible()
  await start.fill('0:01')
  await end.fill('0:02')
  await expect(tool.getByText('Duración del recorte: 0:01')).toBeVisible()
  await tool.getByRole('button', { name: 'Recortar', exact: true }).click()
  const out = await downloadResult(page)
  expect(out.name).toBe('clip-recortado.webm')
  expect(out.bytes.subarray(0, 4).toString('hex')).toBe('1a45dfa3')
  const d = await resultDuration(page)
  expect(d).toBeGreaterThan(0.7)
  expect(d).toBeLessThan(1.5)
})

test('comprimir video y archivos que no son video', async ({ page }) => {
  await page.goto('/comprimir-video')
  const tool = page.locator('#tool')
  // Un texto no es un video.
  await pick(page, 'nota.txt', Buffer.from('hola'), 'text/plain')
  await expect(tool.getByRole('alert')).toContainText('Esta herramienta es para videos')

  const clip = await makeWebm(page, 2)
  await pick(page, 'clip.webm', clip)
  await expect(tool.getByText(/320 × 240/)).toBeVisible({ timeout: 15_000 })
  await tool.getByRole('group', { name: 'Compresión' }).getByRole('button', { name: 'Fuerte' }).click()
  await tool.getByRole('button', { name: 'Comprimir video' }).click()
  const out = await downloadResult(page)
  // Si no pesa menos, se entrega el original (clip.webm); si no, el MP4 comprimido.
  if (out.name.endsWith('.mp4')) {
    expect(out.name).toBe('clip-comprimido.mp4')
    expect(out.bytes.length).toBeLessThan(clip.length)
    await expect(tool.getByText(/% menos/)).toBeVisible()
  } else {
    expect(out.name).toBe('clip.webm')
    await expect(tool.getByText('Este video ya estaba bien comprimido, así que te dejamos el original.')).toBeVisible()
  }
})
