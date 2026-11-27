// Videos de prueba grabados en el navegador (canvas + MediaRecorder), con audio de un oscilador.
import { Buffer } from 'node:buffer'
import type { Page } from '@playwright/test'
import { expect } from './helpers'

/**
 * Graba un MP4 (H.264) con fotogramas clave separados, como el de un celular. `noise`: grano
 * (con mucho grano ningún codificador baja de cierta tasa de bits).
 */
export async function recordVideo(page: Page, seconds: number, noise = 12, width = 640, height = 360): Promise<{ buffer: Buffer; type: string }> {
  for (let attempt = 1; ; attempt++) {
    await page.bringToFront()
    // En una Mac del CI el dispositivo de audio a veces no arranca a la primera ("Failed to start the audio device"):
    // se reintenta como cuando el video sale vacío.
    const out = await page.evaluate(async ({ secs, noise, w, h }) => {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
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
      const img = ctx.createImageData(w, h)
      await new Promise<void>((done) => {
        const timer = setInterval(() => {
          const t = performance.now() - t0
          for (let i = 0; i < img.data.length; i += 4) {
            const v = (Math.random() * noise) | 0
            img.data[i] = (((i / 4) % w) * 0.3 + t / 20 + v) % 256
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
    }, { secs: seconds, noise, w: width, h: height }).catch((e: Error) => {
      if (attempt < 5 && /audio device/i.test(e.message)) return null
      throw e
    })
    if (!out) {
      // Darle un respiro al audio de la Mac antes de volver a intentar.
      await page.waitForTimeout(1500)
      continue
    }
    const buffer = Buffer.from(out.b64, 'base64')
    if (buffer.length > 20_000 || attempt >= 3) {
      expect(buffer.length, 'el video de prueba salió vacío').toBeGreaterThan(20_000)
      return { buffer, type: out.type }
    }
  }
}
