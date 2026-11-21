import { describe, expect, it } from 'vitest'
import {
  MEDIA_ACCEPT,
  VIDEO_ACCEPT,
  acceptFor,
  accepts,
  checkTrim,
  compressQuality,
  failureFromDiscards,
  formatTime,
  isAudioFormat,
  keepSmaller,
  mediaFileName,
  mediaKind,
  mimeOf,
  parseTime,
  savedPercent,
  scaledSize,
  trimFormat,
} from '../../../../../src/features/media/core/media'

describe('mediaKind y accepts', () => {
  it('reconoce por tipo o por extensión', () => {
    expect(mediaKind('a.bin', 'video/mp4')).toBe('video')
    expect(mediaKind('a.bin', 'audio/ogg')).toBe('audio')
    expect(mediaKind('Clip.MOV', '')).toBe('video')
    expect(mediaKind('nota.opus', '')).toBe('audio')
    expect(mediaKind('doc.pdf', 'application/pdf')).toBeNull()
  })
  it('convertir y comprimir solo aceptan video; audio y recortar aceptan ambos', () => {
    expect(accepts('convertir', 'a.mp3', 'audio/mpeg')).toBe(false)
    expect(accepts('comprimir', 'a.mp4', 'video/mp4')).toBe(true)
    expect(accepts('audio', 'a.wav', '')).toBe(true)
    expect(accepts('recortar', 'a.mkv', '')).toBe(true)
    expect(accepts('recortar', 'a.txt', 'text/plain')).toBe(false)
    expect(acceptFor('convertir')).toBe(VIDEO_ACCEPT)
    expect(acceptFor('audio')).toBe(MEDIA_ACCEPT)
    expect(MEDIA_ACCEPT).toContain('.m4a')
    expect(VIDEO_ACCEPT).not.toContain('.mp3')
  })
})

describe('tiempos', () => {
  it('lee segundos, minutos, horas y décimas con punto o coma', () => {
    expect(parseTime('83')).toBe(83)
    expect(parseTime('1:23')).toBe(83)
    expect(parseTime(' 1:23,5 ')).toBe(83.5)
    expect(parseTime('1:02:03')).toBe(3723)
    expect(parseTime('0:00')).toBe(0)
  })
  it('rechaza lo que no es un tiempo', () => {
    expect(parseTime('')).toBeNull()
    expect(parseTime('abc')).toBeNull()
    expect(parseTime('1:75')).toBeNull()
    expect(parseTime('1:61:00')).toBeNull()
    expect(parseTime('-3')).toBeNull()
    expect(parseTime('1:2:3:4')).toBeNull()
  })
  it('escribe m:ss, h:mm:ss y décimas solo si hacen falta', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(83.4)).toBe('1:23.4')
    expect(formatTime(83.04)).toBe('1:23')
    expect(formatTime(3723)).toBe('1:02:03')
    expect(formatTime(-5)).toBe('0:00')
    expect(parseTime(formatTime(754.3))).toBe(754.3)
  })
})

describe('checkTrim', () => {
  it('acepta un recorte válido y ajusta el final a la duración', () => {
    expect(checkTrim('0:05', '0:10', 60)).toEqual({ ok: true, start: 5, end: 10 })
    expect(checkTrim('0', '1:00.05', 60)).toEqual({ ok: true, start: 0, end: 60 })
  })
  it('explica por qué no', () => {
    expect(checkTrim('x', '0:10', 60)).toEqual({ ok: false, reason: 'format' })
    expect(checkTrim('0:10', '0:10', 60)).toEqual({ ok: false, reason: 'order' })
    expect(checkTrim('0:20', '0:10', 60)).toEqual({ ok: false, reason: 'order' })
    expect(checkTrim('0:10', '2:00', 60)).toEqual({ ok: false, reason: 'beyond' })
    expect(checkTrim('1:00', '1:00.05', 60)).toEqual({ ok: false, reason: 'order' })
    expect(checkTrim('1:01', '1:02', 60)).toEqual({ ok: false, reason: 'beyond' })
  })
})

describe('formatos y nombres', () => {
  it('al recortar conserva el formato del original', () => {
    expect(trimFormat('a.mp3', '')).toBe('mp3')
    expect(trimFormat('a', 'audio/wav')).toBe('wav')
    expect(trimFormat('a.opus', '')).toBe('ogg')
    expect(trimFormat('a.m4a', '')).toBe('m4a')
    expect(trimFormat('a.flac', '')).toBe('wav')
    expect(trimFormat('a.webm', 'video/webm')).toBe('webm')
    expect(trimFormat('a.webm', 'audio/webm')).toBe('ogg')
    expect(trimFormat('a.mov', '')).toBe('mov')
    expect(trimFormat('a.mp4', 'video/mp4')).toBe('mp4')
    expect(trimFormat('a.mkv', '')).toBe('webm')
  })
  it('tipos y nombres de salida', () => {
    expect(mimeOf('mp3')).toBe('audio/mpeg')
    expect(mimeOf('mov')).toBe('video/quicktime')
    expect(isAudioFormat('m4a')).toBe(true)
    expect(isAudioFormat('mp4')).toBe(false)
    expect(mediaFileName('Mi video.MOV', 'comprimido', 'mp4')).toBe('Mi video-comprimido.mp4')
    expect(mediaFileName('.mp4', '', 'mp3')).toBe('media.mp3')
  })
})

describe('compresión', () => {
  it('reduce por el lado corto, en pares, y no agranda', () => {
    expect(scaledSize(1920, 1080, 720)).toEqual({ width: 1280, height: 720 })
    expect(scaledSize(1080, 1920, 720)).toEqual({ width: 720, height: 1280 })
    expect(scaledSize(1001, 563, 480)).toEqual({ width: 854, height: 480 })
    expect(scaledSize(640, 360, 720)).toBeNull()
    expect(scaledSize(1920, 1080, 0)).toBeNull()
    expect(scaledSize(0, 0, 720)).toBeNull()
  })
  it('calidad por nivel', () => {
    expect(compressQuality('ligera')).toEqual({ video: 'medium', audio: 'medium' })
    expect(compressQuality('media')).toEqual({ video: 'low', audio: 'low' })
    expect(compressQuality('fuerte')).toEqual({ video: 'very-low', audio: 'low' })
  })
  it('ahorro y si conviene quedarse con el original', () => {
    expect(savedPercent(1000, 250)).toBe(75)
    expect(savedPercent(1000, 1200)).toBe(0)
    expect(savedPercent(0, 0)).toBe(0)
    expect(keepSmaller(1000, 999)).toBe(true)
    expect(keepSmaller(1000, 1000)).toBe(false)
  })
})

describe('failureFromDiscards', () => {
  it('traduce las razones de Mediabunny', () => {
    expect(failureFromDiscards(['no_encodable_target_codec'], 'any')).toBe('no-codec')
    expect(failureFromDiscards(['undecodable_source_codec'], 'audio')).toBe('unsupported-file')
    expect(failureFromDiscards(['unknown_source_codec'], 'video')).toBe('unsupported-file')
    expect(failureFromDiscards([], 'audio')).toBe('no-audio')
    expect(failureFromDiscards(['discarded_by_user'], 'video')).toBe('no-video')
    expect(failureFromDiscards([], 'any')).toBe('failed')
  })
})
