// Audio y video tras la auditoría W-146.9: recorte exacto (sin nada escondido), comprimir a un
// tamaño, girar sin recomprimir y video a GIF. Los resultados se revisan con Mediabunny.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { ALL_FORMATS, BufferSource, EncodedPacketSink, Input } from 'mediabunny'
import { expect, test } from './helpers'

/**
 * Graba un MP4 (H.264) con fotogramas clave separados, como el de un celular. `noise`: grano
 * (con mucho grano ningún codificador baja de cierta tasa de bits).
 */
async function recordVideo(page: Page, seconds: number, noise = 12): Promise<{ buffer: Buffer; type: string }> {
  for (let attempt = 1; ; attempt++) {
    await page.bringToFront()
    const out = await page.evaluate(async ({ secs, noise }) => {
      const c = document.createElement('canvas')
      c.width = 640
      c.height = 360
      const ctx = c.getContext('2d')!
      const stream = c.captureStream(30)
      const ac = new AudioContext()
      await ac.resume()
      const osc = ac.createOscillator()
      const dst = ac.createMediaStreamDestination()
      osc.connect(dst)
      osc.start()
      stream.addTrack(dst.stream.getAudioTracks()[0])
      const type = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2') ? 'video/mp4;codecs=avc1,mp4a.40.2' : 'video/webm;codecs=vp8,opus'
      const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 3_000_000 })
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => chunks.push(e.data)
      rec.start(250)
      const t0 = performance.now()
      const img = ctx.createImageData(640, 360)
      await new Promise<void>((done) => {
        const timer = setInterval(() => {
          const t = performance.now() - t0
          for (let i = 0; i < img.data.length; i += 4) {
            const v = (Math.random() * noise) | 0
            img.data[i] = (((i / 4) % 640) * 0.3 + t / 20 + v) % 256
            img.data[i + 1] = 90 + v
            img.data[i + 2] = 180 - v
            img.data[i + 3] = 255
          }
          ctx.putImageData(img, 0, 0)
          if (t >= secs * 1000) {
            clearInterval(timer)
            done()
          }
        }, 33)
      })
      rec.requestData()
      rec.stop()
      await new Promise((r) => (rec.onstop = r))
      osc.stop()
      await ac.close()
      const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer())
      let s = ''
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return { type: type.split(';')[0], b64: btoa(s) }
    }, { secs: seconds, noise })
    const buffer = Buffer.from(out.b64, 'base64')
    if (buffer.length > 20_000 || attempt === 3) {
      expect(buffer.length, 'el video de prueba salió vacío').toBeGreaterThan(20_000)
      return { buffer, type: out.type }
    }
  }
}

async function run(page: Page, tool: string, clip: { buffer: Buffer; type: string }, setup: () => Promise<void>, button: string) {
  await page.goto(`/app/#/multimedia/${tool}`)
  await page.reload()
  await page.locator('main input[type=file]').first().setInputFiles({ name: clip.type === 'video/mp4' ? 'clip.mp4' : 'clip.webm', mimeType: clip.type, buffer: clip.buffer })
  await expect(page.locator('main').getByText('0:0', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await setup()
  await page.getByRole('button', { name: button, exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Listo' })).toBeVisible({ timeout: 120_000 })
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click()
  const d = await wait
  return { name: d.suggestedFilename(), bytes: new Uint8Array(await readFile((await d.path())!)) }
}

/** Cuántas imágenes tiene un GIF: recorre sus bloques (extensiones e imágenes) hasta el final. */
function gifFrames(b: Uint8Array): number {
  const skipSubBlocks = (i: number) => {
    while (b[i]) i += b[i] + 1
    return i + 1
  }
  let i = 13 + (b[10] & 0x80 ? 3 * 2 ** ((b[10] & 7) + 1) : 0)
  let frames = 0
  while (i < b.length && b[i] !== 0x3b) {
    if (b[i] === 0x21) i = skipSubBlocks(i + 2)
    else if (b[i] === 0x2c) {
      frames++
      const flags = b[i + 9]
      i += 10 + (flags & 0x80 ? 3 * 2 ** ((flags & 7) + 1) : 0)
      i = skipSubBlocks(i + 1)
    } else break
  }
  return frames
}

async function inspect(bytes: Uint8Array) {
  const input = new Input({ formats: ALL_FORMATS, source: new BufferSource(bytes) })
  const v = (await input.getPrimaryVideoTrack())!
  let first: number | null = null
  for await (const p of new EncodedPacketSink(v).packets()) {
    first = p.timestamp
    break
  }
  return { first, duration: await input.computeDuration(), width: v.displayWidth, height: v.displayHeight, coded: [v.codedWidth, v.codedHeight], rotation: v.rotation }
}

test('recortar deja solo el tramo elegido: nada escondido antes del inicio', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/app/#/multimedia/recortar')
  const clip = await recordVideo(page, 7)
  const out = await run(page, 'recortar', clip, async () => {
    const inputs = page.locator('main .media-trim input')
    await inputs.nth(0).fill('2.5')
    await inputs.nth(1).fill('5')
  }, 'Recortar')
  const r = await inspect(out.bytes)
  // Antes, el primer paquete era de antes del inicio (con tiempo negativo).
  expect(r.first).toBeGreaterThanOrEqual(-0.01)
  expect(r.duration).toBeGreaterThan(2.3)
  expect(r.duration).toBeLessThan(2.8)
})

test('comprimir a un tamaño: queda bajo la mitad del original @movil', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/app/#/multimedia/comprimir')
  const clip = await recordVideo(page, 8, 5)
  const targetMb = Math.round((clip.buffer.length / 2 / 1024 / 1024) * 100) / 100
  const out = await run(page, 'comprimir', clip, async () => {
    await page.getByRole('group', { name: 'Tamaño máximo' }).getByRole('button', { name: 'Otro' }).click()
    await page.getByLabel('Tamaño en MB').fill(String(targetMb))
    await expect(page.getByText('Se calcula la calidad', { exact: false })).toBeVisible()
  }, 'Comprimir video')
  expect(out.name).toBe('clip-comprimido.mp4')
  expect(out.bytes.length).toBeLessThanOrEqual(targetMb * 1024 * 1024)
  await expect(page.getByText('No se pudo bajar de', { exact: false })).toHaveCount(0)
  // Los servicios de la lista están a mano.
  await expect(page.getByRole('group', { name: 'Tamaño máximo' }).getByRole('button', { name: 'WhatsApp (16 MB)' })).toBeVisible()
})

test('girar video: 90° a la derecha sin recomprimir', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/app/#/multimedia/girar')
  const clip = await recordVideo(page, 4)
  const out = await run(page, 'girar', clip, async () => {
    await page.getByRole('button', { name: 'Derecha' }).click()
  }, 'Girar video')
  const r = await inspect(out.bytes)
  expect([r.width, r.height]).toEqual([360, 640])
  if (clip.type === 'video/mp4') {
    // MP4: solo cambia la orientación guardada; los cuadros quedan como estaban.
    expect(r.rotation).toBe(90)
    expect(r.coded).toEqual([640, 360])
  }
})

test('video a GIF: un tramo, a 480 px y 10 cuadros por segundo @movil', async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto('/app/#/multimedia/gif')
  const clip = await recordVideo(page, 5)
  const out = await run(page, 'gif', clip, async () => {
    const inputs = page.locator('main .media-trim input')
    await inputs.nth(0).fill('1')
    await inputs.nth(1).fill('3')
    await expect(page.getByRole('group', { name: 'Ancho del GIF' }).getByRole('button', { name: '480 px' })).toHaveAttribute('aria-pressed', 'true')
  }, 'Crear GIF')
  expect(out.name).toBe(`clip-animado.gif`)
  expect(Buffer.from(out.bytes.subarray(0, 6)).toString('latin1')).toBe('GIF89a')
  const dv = new DataView(out.bytes.buffer, out.bytes.byteOffset)
  expect([dv.getUint16(6, true), dv.getUint16(8, true)]).toEqual([480, 270])
  // 2 s a 10 cuadros por segundo: 20 cuadros.
  expect(gifFrames(out.bytes)).toBe(20)
})
