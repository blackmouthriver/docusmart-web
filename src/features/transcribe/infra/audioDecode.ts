/**
 * Audio de un archivo (de audio o de video) a mono de 16 kHz, el formato de Whisper (W-133).
 * Mediabunny lee el archivo por partes y WebCodecs decodifica; cada parte se mezcla a mono y se
 * remuestrea en el momento, así nunca se guarda el audio original completo en memoria.
 * Excluido de la cobertura (WebCodecs); se prueba de punta a punta.
 */
import { ALL_FORMATS, AudioSampleSink, BlobSource, Input, UnsupportedInputFormatError } from 'mediabunny'
import { SAMPLE_RATE, StreamResampler, toMono } from '../core/whisper'

export class AudioReadError extends Error {
  constructor(readonly reason: 'unsupported' | 'no-audio' | 'too-long') {
    super(reason)
    this.name = 'AudioReadError'
  }
}

/** Duración máxima: 16 kHz mono en Float32 son ~230 MB por hora. */
export const MAX_SECONDS = 2 * 60 * 60

export async function decodeAudio(file: File, onProgress?: (fraction: number) => void): Promise<{ audio: Float32Array; duration: number }> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) })
  try {
    const track = await input.getPrimaryAudioTrack().catch((e: unknown) => {
      throw e instanceof UnsupportedInputFormatError ? new AudioReadError('unsupported') : e
    })
    if (!track) throw new AudioReadError('no-audio')
    if (!(await track.canDecode())) throw new AudioReadError('unsupported')
    const duration = await track.computeDuration()
    if (duration > MAX_SECONDS) throw new AudioReadError('too-long')
    const chunks: Float32Array[] = []
    let total = 0
    let resampler: StreamResampler | null = null
    for await (const sample of new AudioSampleSink(track).samples()) {
      try {
        const channels = Array.from({ length: sample.numberOfChannels }, (_, c) => {
          const plane = new Float32Array(sample.numberOfFrames)
          sample.copyTo(plane, { planeIndex: c, format: 'f32-planar' })
          return plane
        })
        resampler ??= new StreamResampler(sample.sampleRate, SAMPLE_RATE)
        const mono = resampler.push(toMono(channels))
        chunks.push(mono)
        total += mono.length
        if (duration) onProgress?.(Math.min(1, sample.timestamp / duration))
      } finally {
        sample.close()
      }
    }
    const audio = new Float32Array(total)
    let at = 0
    for (const c of chunks) {
      audio.set(c, at)
      at += c.length
    }
    return { audio, duration: total / SAMPLE_RATE }
  } finally {
    input.dispose()
  }
}
