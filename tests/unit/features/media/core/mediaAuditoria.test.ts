// Auditoría W-146.9 (Audio y video): recorte exacto, comprimir a un tamaño, girar y video a GIF.
import { describe, expect, it } from 'vitest'
import {
  GIF_MAX_SECONDS,
  MEDIA_TOOLS,
  SIZE_TARGETS,
  VIDEO_ACCEPT,
  acceptFor,
  accepts,
  bitratePlan,
  gifFrameTimes,
  gifHeight,
  isVideoOnly,
  retryBitrate,
  rotateVideo,
  shrinkSize,
  trimNeedsReencode,
} from '../../../../../src/features/media/core/media'

describe('herramientas nuevas (W-146.9)', () => {
  it('girar y GIF son solo de video', () => {
    expect(MEDIA_TOOLS).toEqual(['audio', 'convertir', 'recortar', 'comprimir', 'girar', 'gif', 'unir'])
    expect(['girar', 'gif', 'convertir', 'comprimir'].every((t) => isVideoOnly(t as never))).toBe(true)
    expect(isVideoOnly('audio')).toBe(false)
    expect(acceptFor('gif')).toBe(VIDEO_ACCEPT)
    expect(accepts('girar', 'clip.mp4', '')).toBe(true)
    expect(accepts('girar', 'nota.mp3', 'audio/mpeg')).toBe(false)
    expect(accepts('recortar', 'nota.mp3', 'audio/mpeg')).toBe(true)
  })
})

describe('recorte exacto (W-146.9)', () => {
  it('se recomprime si el inicio no cae en un fotograma clave', () => {
    expect(trimNeedsReencode(5, 0)).toBe(true)
    expect(trimNeedsReencode(5, 5.01)).toBe(false)
    expect(trimNeedsReencode(5, 4.99)).toBe(false)
    expect(trimNeedsReencode(5, null)).toBe(true)
    // Desde el principio se puede copiar siempre.
    expect(trimNeedsReencode(0, null)).toBe(false)
    expect(trimNeedsReencode(0.01, 0)).toBe(false)
  })
})

describe('comprimir a un tamaño (W-146.9)', () => {
  it('reparte la tasa de bits entre video y audio y baja el alto si hace falta', () => {
    expect(SIZE_TARGETS.map((t) => t.mb)).toEqual([10, 16, 25])
    // 16 MB en 60 s: unos 2,1 Mbit/s en total.
    const wa = bitratePlan(16 * 1024 * 1024, 60, true)!
    expect(wa.audioBps).toBe(128_000)
    expect(wa.videoBps + wa.audioBps).toBeLessThanOrEqual((16 * 1024 * 1024 * 8) / 60)
    expect(wa.maxHeight).toBe(1080)
    // 10 MB en 3 minutos: poca tasa, 480p y audio liviano.
    const low = bitratePlan(10 * 1024 * 1024, 180, true)!
    expect(low.maxHeight).toBe(480)
    expect(low.audioBps).toBe(96_000)
    const mid = bitratePlan(10 * 1024 * 1024, 70, true)!
    expect(mid.maxHeight).toBe(720)
    // Mucho espacio: se conserva el tamaño.
    expect(bitratePlan(500 * 1024 * 1024, 30, true)!.maxHeight).toBe(0)
    // Sin audio, todo para el video.
    const mute = bitratePlan(1024 * 1024, 20, false)!
    expect(mute.audioBps).toBe(0)
    expect(bitratePlan(2 * 1024 * 1024, 60, true)!.audioBps).toBe(48_000)
    // Imposible: menos de 100 kbit/s para el video.
    expect(bitratePlan(1024 * 1024, 600, true)).toBeNull()
    expect(bitratePlan(1024, 0, true)).toBeNull()
  })

  it('shrinkSize achica en números pares', () => {
    expect(shrinkSize(640, 360, 0.7)).toEqual({ width: 448, height: 252 })
    expect(shrinkSize(3, 3, 0.1)).toEqual({ width: 2, height: 2 })
  })

  it('al pasarse, reintenta con una tasa proporcional y un margen', () => {
    expect(retryBitrate(1_000_000, 2_200_000, 2_000_000)).toBe(836_363)
    expect(retryBitrate(60_000, 10_000_000, 1_000_000)).toBe(50_000)
  })
})

describe('girar y GIF (W-146.9)', () => {
  it('rotateVideo da la vuelta completa', () => {
    expect(rotateVideo(0, 90)).toBe(90)
    expect(rotateVideo(0, -90)).toBe(270)
    expect(rotateVideo(270, 90)).toBe(0)
  })

  it('cuadros del GIF: a los cuadros por segundo pedidos y como máximo 30 s', () => {
    expect(gifFrameTimes(2, 3, 10)).toEqual([2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9])
    expect(gifFrameTimes(0, 1, 15)).toHaveLength(15)
    expect(gifFrameTimes(0, 100, 10)).toHaveLength(GIF_MAX_SECONDS * 10)
    expect(gifFrameTimes(5, 5, 10)).toEqual([])
    expect(gifHeight(480, 1280, 720)).toBe(270)
    expect(gifHeight(320, 720, 1280)).toBe(568)
    expect(gifHeight(480, 0, 10)).toBe(4800)
  })
})

describe('varios archivos y unir videos (W-147.4)', () => {
  it('en lote: video a MP3, convertir y comprimir; unir es solo de video', async () => {
    const { isBatchTool, MAX_BATCH, MAX_MERGE } = await import('../../../../../src/features/media/core/media')
    expect(['audio', 'convertir', 'comprimir'].every((t) => isBatchTool(t as never))).toBe(true)
    expect(['recortar', 'girar', 'gif', 'unir'].some((t) => isBatchTool(t as never))).toBe(false)
    expect(isVideoOnly('unir')).toBe(true)
    expect(accepts('unir', 'nota.mp3', 'audio/mpeg')).toBe(false)
    expect([MAX_BATCH, MAX_MERGE]).toEqual([30, 20])
  })

  it('cada video empieza donde termina el anterior', async () => {
    const { mergeOffsets } = await import('../../../../../src/features/media/core/media')
    expect(mergeOffsets([10, 5.5, 3])).toEqual([0, 10, 15.5])
    expect(mergeOffsets([-1, 4])).toEqual([0, 0])
    expect(mergeOffsets([])).toEqual([])
  })

  it('el tamaño del unido es el del primero, hasta 1080 de alto y con medidas pares', async () => {
    const { mergeSize } = await import('../../../../../src/features/media/core/media')
    expect(mergeSize(1280, 720)).toEqual({ width: 1280, height: 720 })
    expect(mergeSize(3840, 2160)).toEqual({ width: 1920, height: 1080 })
    expect(mergeSize(1081, 1921)).toEqual({ width: 608, height: 1080 })
    expect(mergeSize(641, 359)).toEqual({ width: 642, height: 360 })
  })
})
