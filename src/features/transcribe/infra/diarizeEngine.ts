/**
 * Motor de hablantes (W-147.4): segmentación de pyannote y huellas de WeSpeaker con
 * onnxruntime-web. Recibe el módulo de onnxruntime como parámetro, así corre igual en el worker y
 * en las pruebas en Node. Excluido de la cobertura (necesita los modelos); se prueba de punta a punta.
 */
import type * as Ort from 'onnxruntime-web'
import {
  FBANK_BINS,
  LOCAL_SPEAKERS,
  buildTurns,
  clusterVoiceprints,
  frameCount,
  kaldiFbank,
  powersetToActivity,
  speakerSamples,
  windowAudio,
  windowStarts,
  type Turn,
  type Voiceprint,
  type WindowResult,
} from '../core/diarize'
import { SAMPLE_RATE } from '../core/whisper'

export type DiarizeEngine = { ort: typeof Ort; segmentation: Ort.InferenceSession; embedding: Ort.InferenceSession }

const aborted = () => new DOMException('aborted', 'AbortError')

/**
 * Turnos de cada hablante en un audio mono de 16 kHz. `count`: cuántas personas hablan (o
 * automático). `onProgress` recibe de 0 a 1.
 */
export async function diarize(e: DiarizeEngine, audio: Float32Array, count?: number, onProgress?: (fraction: number) => void, signal?: AbortSignal): Promise<Turn[]> {
  const starts = windowStarts(audio.length)
  const windows: WindowResult[] = []
  const prints: Voiceprint[] = []
  for (const [w, start] of starts.entries()) {
    if (signal?.aborted) throw aborted()
    const chunk = windowAudio(audio, start)
    const out = await e.segmentation.run({ input_values: new e.ort.Tensor('float32', chunk, [1, 1, chunk.length]) })
    const frames = out.logits.dims[1]
    const activity = powersetToActivity(out.logits.data as Float32Array, Math.min(frames, frameCount(chunk.length)))
    windows.push({ start, activity, frames, speakers: [-1, -1, -1] })
    for (let k = 0; k < LOCAL_SPEAKERS; k++) {
      const voice = speakerSamples(chunk, activity, frames, k)
      if (!voice.length) continue
      const fb = kaldiFbank(voice)
      const r = await e.embedding.run({ input_features: new e.ort.Tensor('float32', fb.data, [1, fb.frames, FBANK_BINS]) })
      prints.push({ window: w, local: k, vector: (r.last_hidden_state.data as Float32Array).slice(), seconds: voice.length / SAMPLE_RATE })
    }
    onProgress?.((w + 1) / starts.length)
  }
  const labels = clusterVoiceprints(prints, count)
  prints.forEach((p, i) => (windows[p.window].speakers[p.local] = labels[i]))
  return buildTurns(windows, audio.length)
}
