/**
 * Ejecuta las herramientas de audio y video (W-132) con Mediabunny: lee el archivo por
 * partes (BlobSource, sin cargarlo entero en memoria), decodifica y codifica con WebCodecs
 * del navegador (con aceleración por hardware) y, cuando se puede, copia sin recomprimir.
 * MP3 se codifica con @mediabunny/mp3-encoder (LAME en wasm) solo si el navegador no lo trae.
 * Excluido de la cobertura: necesita WebCodecs, se prueba en tests/e2e.
 */
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  CanvasSink,
  EncodedPacketSink,
  Conversion,
  ConversionCanceledError,
  Input,
  MovOutputFormat,
  Mp3OutputFormat,
  Mp4OutputFormat,
  OggOutputFormat,
  Output,
  QUALITY_HIGH,
  QUALITY_LOW,
  QUALITY_MEDIUM,
  QUALITY_VERY_LOW,
  UnsupportedInputFormatError,
  WavOutputFormat,
  WebMOutputFormat,
  canEncodeAudio,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
  type AudioCodec,
  type ConversionAudioOptions,
  type ConversionVideoOptions,
  type OutputFormat as BunnyFormat,
  type Quality,
  type VideoCodec,
} from 'mediabunny'
import {
  bitratePlan,
  compressQuality,
  gifFrameTimes,
  gifHeight,
  retryBitrate,
  shrinkSize,
  trimFormat,
  trimNeedsReencode,
  type VideoRotation,
  failureFromDiscards,
  isAudioFormat,
  mediaFileName,
  mimeOf,
  scaledSize,
  type AudioFormat,
  type CompressLevel,
  type MaxHeight,
  type MediaFailure,
  type OutputFormat,
  type QualityName,
  type VideoFormat,
} from '../core/media'

export class MediaError extends Error {
  constructor(readonly reason: MediaFailure) {
    super(reason)
  }
}

/** ¿El navegador tiene WebCodecs? Sin eso no hay nada que hacer (navegadores muy viejos). */
export const mediaSupported = () => typeof globalThis.VideoDecoder === 'function' && typeof globalThis.AudioDecoder === 'function'

export type MediaInfo = { duration: number; hasVideo: boolean; hasAudio: boolean; width: number; height: number }

function openInput(file: File) {
  return new Input({ formats: ALL_FORMATS, source: new BlobSource(file) })
}

/** Duración, pistas y tamaño del video. */
export async function probe(file: File): Promise<MediaInfo> {
  const input = openInput(file)
  try {
    const [video, audio] = await Promise.all([input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack()])
    const duration = await input.computeDuration()
    return { duration, hasVideo: !!video, hasAudio: !!audio, width: video?.displayWidth ?? 0, height: video?.displayHeight ?? 0 }
  } catch (e) {
    throw e instanceof UnsupportedInputFormatError ? new MediaError('unsupported-file') : e
  } finally {
    input.dispose()
  }
}

export type MediaJob =
  | { tool: 'audio'; format: AudioFormat; quality: 'medium' | 'high' }
  | { tool: 'convertir'; format: VideoFormat; mute: boolean }
  | { tool: 'recortar'; format: OutputFormat; start: number; end: number }
  | { tool: 'comprimir'; level: CompressLevel; maxHeight: MaxHeight; targetBytes?: number }
  | { tool: 'girar'; rotate: VideoRotation; flip: boolean }

const QUALITY: Record<QualityName, Quality> = { 'very-low': QUALITY_VERY_LOW, low: QUALITY_LOW, medium: QUALITY_MEDIUM, high: QUALITY_HIGH }

function container(format: OutputFormat): BunnyFormat {
  switch (format) {
    case 'mp3':
      return new Mp3OutputFormat()
    case 'wav':
      return new WavOutputFormat()
    case 'ogg':
      return new OggOutputFormat()
    case 'webm':
      return new WebMOutputFormat()
    case 'mov':
      return new MovOutputFormat({ fastStart: 'in-memory' })
    default:
      // MP4 y M4A: el índice al principio para que se pueda reproducir mientras se descarga.
      return new Mp4OutputFormat({ fastStart: 'in-memory' })
  }
}

// Preferencias de códec: en MP4 primero H.264/AAC, que abre cualquier equipo.
const VIDEO_PREF: Record<string, VideoCodec[]> = { mp4: ['avc', 'hevc', 'vp9', 'av1'], mov: ['avc', 'hevc'], webm: ['vp9', 'vp8', 'av1'] }
const AUDIO_PREF: Record<string, AudioCodec[]> = { mp4: ['aac', 'opus'], m4a: ['aac'], mov: ['aac'], webm: ['opus', 'vorbis'], ogg: ['opus', 'vorbis'], mp3: ['mp3'], wav: ['pcm-s16'] }

/** El codificador de MP3 en wasm solo se carga si el navegador no sabe codificar MP3. */
async function ensureMp3() {
  if (await canEncodeAudio('mp3')) return
  const { registerMp3Encoder } = await import('@mediabunny/mp3-encoder')
  registerMp3Encoder()
}

async function videoCodec(format: OutputFormat, size?: { width: number; height: number } | null) {
  return (await getFirstEncodableVideoCodec(VIDEO_PREF[format] ?? VIDEO_PREF.mp4, size ?? undefined)) ?? undefined
}
async function audioCodec(format: OutputFormat) {
  return (await getFirstEncodableAudioCodec(AUDIO_PREF[format] ?? ['aac'])) ?? undefined
}

/**
 * Hace el trabajo y devuelve el archivo resultante. `onProgress` recibe de 0 a 1.
 * `signal` permite cancelar. Lanza MediaError con el motivo si no se puede.
 */
export async function runMedia(file: File, job: MediaJob, names: Record<MediaJob['tool'], string>, onProgress: (p: number) => void, signal?: AbortSignal): Promise<File> {
  // Comprimir a un tamaño: los codificadores no siempre respetan la tasa de bits (sobre todo con
  // mucho detalle). Si se pasó, se reintenta con menos tasa y, después, también más chico.
  if (job.tool === 'comprimir' && job.targetBytes) {
    let best: File | null = null
    let bps: number | undefined
    for (const [i, shrink] of TARGET_ATTEMPTS.entries()) {
      const step = (p: number) => onProgress((i + p) / TARGET_ATTEMPTS.length)
      const r = await runOnce(file, job, names, step, signal, bps, shrink)
      if (!best || r.file.size < best.size) best = r.file
      if (r.file.size <= job.targetBytes || !r.bitrate) break
      bps = retryBitrate(r.bitrate, r.file.size, job.targetBytes)
    }
    onProgress(1)
    return best!
  }
  return (await runOnce(file, job, names, onProgress, signal)).file
}

/** Intentos al comprimir a un tamaño: el factor de tamaño de cada uno (el primero, el del plan). */
const TARGET_ATTEMPTS = [1, 1, 0.7, 0.5]

async function runOnce(file: File, job: MediaJob, names: Record<MediaJob['tool'], string>, onProgress: (p: number) => void, signal?: AbortSignal, videoBps?: number, shrink = 1): Promise<{ file: File; bitrate?: number }> {
  const input = openInput(file)
  let bitrate: number | undefined
  try {
    const format: OutputFormat =
      job.tool === 'audio' || job.tool === 'convertir' || job.tool === 'recortar' ? job.format : job.tool === 'girar' ? trimFormat(file.name, file.type) : 'mp4'
    const audioOnly = isAudioFormat(format)
    if (format === 'mp3') await ensureMp3()

    let video: ConversionVideoOptions = audioOnly ? { discard: true } : {}
    let audio: ConversionAudioOptions = {}
    let trim: { start: number; end: number } | undefined

    if (job.tool === 'audio') {
      audio = { codec: await audioCodec(format), quality: QUALITY[job.quality] }
    } else if (job.tool === 'convertir') {
      video = { codec: await videoCodec(format) }
      audio = job.mute ? { discard: true } : { codec: await audioCodec(format) }
    } else if (job.tool === 'recortar') {
      trim = { start: job.start, end: job.end }
      if (!audioOnly) {
        // Si el inicio no cae en un fotograma clave, se recomprime: copiar dejaría escondido lo
        // anterior al corte, desde el clave previo (W-146.9).
        const track = await input.getPrimaryVideoTrack()
        const key = track ? await new EncodedPacketSink(track).getKeyPacket(job.start) : null
        video = { codec: await videoCodec(format), ...(track && trimNeedsReencode(job.start, key?.timestamp ?? null) && { forceTranscode: true }) }
      }
      audio = { codec: await audioCodec(format) }
    } else if (job.tool === 'girar') {
      // Girar y voltear: con los metadatos del archivo cuando se puede (sin recomprimir).
      video = { codec: await videoCodec(format), rotate: job.rotate, flip: job.flip }
      audio = { codec: await audioCodec(format) }
    } else if (job.targetBytes) {
      const track = await input.getPrimaryVideoTrack()
      if (!track) throw new MediaError('no-video')
      const hasAudio = !!(await input.getPrimaryAudioTrack())
      const plan = bitratePlan(job.targetBytes, await input.computeDuration(), hasAudio)
      if (!plan) throw new MediaError('too-small')
      const planned = scaledSize(track.displayWidth, track.displayHeight, plan.maxHeight)
      const size = shrink < 1 ? shrinkSize(planned?.width ?? track.displayWidth, planned?.height ?? track.displayHeight, shrink) : planned
      bitrate = videoBps ?? plan.videoBps
      video = { codec: await videoCodec('mp4', size ?? { width: track.displayWidth, height: track.displayHeight }), bitrate, forceTranscode: true, ...(size && { width: size.width, height: size.height, fit: 'contain' as const }) }
      audio = hasAudio ? { codec: await audioCodec('mp4'), bitrate: plan.audioBps, forceTranscode: true } : {}
    } else {
      const track = await input.getPrimaryVideoTrack()
      if (!track) throw new MediaError('no-video')
      const size = scaledSize(track.displayWidth, track.displayHeight, job.maxHeight)
      const q = compressQuality(job.level)
      video = { codec: await videoCodec('mp4', size ?? { width: track.displayWidth, height: track.displayHeight }), quality: QUALITY[q.video], forceTranscode: true, ...(size && { width: size.width, height: size.height, fit: 'contain' as const }) }
      audio = { codec: await audioCodec('mp4'), quality: QUALITY[q.audio], forceTranscode: true }
    }

    const output = new Output({ format: container(format), target: new BufferTarget() })
    const conversion = await Conversion.init({ input, output, tracks: 'primary', video, audio, ...(trim && { trim }) })
    const wanted = audioOnly ? 'audio' : job.tool === 'comprimir' || job.tool === 'convertir' ? 'video' : 'any'
    const kept = conversion.utilizedTracks
    const missing = audioOnly ? !kept.some((t) => t.type === 'audio') : !kept.some((t) => t.type === 'video') && wanted === 'video'
    if (!conversion.isValid || missing) throw new MediaError(failureFromDiscards(conversion.discardedTracks.map((d) => d.reason), wanted))

    const stop = () => void conversion.cancel()
    signal?.addEventListener('abort', stop, { once: true })
    conversion.onProgress = (p) => onProgress(p)
    try {
      await conversion.execute()
    } finally {
      signal?.removeEventListener('abort', stop)
    }
    const buffer = output.target.buffer
    if (!buffer) throw new MediaError('failed')
    return { file: new File([buffer], mediaFileName(file.name, names[job.tool], format), { type: mimeOf(format) }), bitrate }
  } catch (e) {
    if (e instanceof MediaError) throw e
    if (e instanceof ConversionCanceledError || signal?.aborted) throw new MediaError('canceled')
    if (e instanceof UnsupportedInputFormatError) throw new MediaError('unsupported-file')
    throw e
  } finally {
    input.dispose()
  }
}

/**
 * Video a GIF (W-146.9): los cuadros entre `start` y `end`, a `fps` cuadros por segundo y `width`
 * de ancho, cada uno con su paleta de 256 colores (gifenc). Se repite sin fin.
 */
export async function runGif(file: File, o: { start: number; end: number; width: number; fps: number }, name: string, onProgress: (p: number) => void, signal?: AbortSignal): Promise<File> {
  const input = openInput(file)
  try {
    const track = await input.getPrimaryVideoTrack()
    if (!track) throw new MediaError('no-video')
    if (!(await track.canDecode())) throw new MediaError('unsupported-file')
    const w = Math.min(o.width, track.displayWidth)
    const width = Math.max(2, w - (w % 2))
    const height = gifHeight(width, track.displayWidth, track.displayHeight)
    const times = gifFrameTimes(o.start, o.end, o.fps)
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
    const gif = GIFEncoder()
    const sink = new CanvasSink(track, { width, height, fit: 'fill', poolSize: 2 })
    const delay = Math.round(1000 / o.fps)
    let n = 0
    for await (const wrapped of sink.canvasesAtTimestamps(times)) {
      if (signal?.aborted) throw new MediaError('canceled')
      if (!wrapped) continue
      const ctx = wrapped.canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
      const { data } = ctx.getImageData(0, 0, width, height)
      const palette = quantize(data, 256, { format: 'rgb565' })
      gif.writeFrame(applyPalette(data, palette, 'rgb565'), width, height, { palette, delay, ...(n === 0 && { repeat: 0 }) })
      onProgress(++n / times.length)
    }
    if (!n) throw new MediaError('failed')
    gif.finish()
    const base = file.name.replace(/\.[^./\\]+$/, '').trim() || 'video'
    return new File([gif.bytes() as Uint8Array<ArrayBuffer>], `${base}-${name}.gif`, { type: 'image/gif' })
  } catch (e) {
    if (e instanceof MediaError) throw e
    if (signal?.aborted) throw new MediaError('canceled')
    if (e instanceof UnsupportedInputFormatError) throw new MediaError('unsupported-file')
    throw e
  } finally {
    input.dispose()
  }
}
