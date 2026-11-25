// Calidad de "Audio a texto": transcribe audios de texto conocido con el modelo real y mide el
// porcentaje de palabras erradas (WER). Los audios se sintetizan con las voces de Windows (sin datos
// reales) a partir de textos.json; se corre a mano:
//   powershell -File tests/calidad-audio/tts.ps1 -json tests/calidad-audio/textos.json -out <carpeta>
//   AUDIO_DIR=<carpeta> npx vitest run --config tests/calidad-audio/vitest.config.ts
// Ojo: el WER cuenta como error "12%" frente a "doce por ciento"; mirar también el texto.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { it } from 'vitest'
import * as ort from 'onnxruntime-web'
import { transcribe, type Engine } from '../../src/features/transcribe/infra/whisperEngine'
import { segmentsToText, type LanguageCode } from '../../src/features/transcribe/core/whisper'

const DIR = process.env.AUDIO_DIR ?? ''
const M = 'public/models/whisper-base/'
const LABEL = process.env.LABEL ?? 'actual'

function wav(path: string): Float32Array {
  const b = readFileSync(path)
  let off = 12
  while (b.toString('ascii', off, off + 4) !== 'data') off += 8 + b.readUInt32LE(off + 4)
  const n = b.readUInt32LE(off + 4) / 2
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = b.readInt16LE(off + 8 + i * 2) / 32768
  return out
}
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').split(/\s+/).filter(Boolean)
function wer(ref: string, hyp: string) {
  const r = norm(ref), h = norm(hyp)
  const d = Array.from({ length: r.length + 1 }, (_, i) => [i, ...Array(h.length).fill(0)])
  for (let j = 1; j <= h.length; j++) d[0][j] = j
  for (let i = 1; i <= r.length; i++) for (let j = 1; j <= h.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (r[i - 1] === h[j - 1] ? 0 : 1))
  return d[r.length][h.length] / r.length
}
// Ruido blanco con semilla fija (relación señal/ruido en dB).
function noisy(a: Float32Array, snr: number) {
  let p = 0
  for (const v of a) p += v * v
  const amp = Math.sqrt(p / a.length / 10 ** (snr / 10)) * Math.sqrt(3)
  let s = 1
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1
  return a.map((v) => v + rnd() * amp)
}
const join2 = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) (out.set(p, o), (o += p.length))
  return out
}

it('calidad de Audio a texto', async () => {
  ort.env.wasm.numThreads = 1
  ort.env.logLevel = 'error'
  const opts = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' as const }
  const decoder = Buffer.concat([readFileSync(M + 'decoder.v1.part0.bin'), readFileSync(M + 'decoder.v1.part1.bin')])
  const e: Engine = {
    ort: ort as never,
    encoder: await ort.InferenceSession.create(new Uint8Array(readFileSync(M + 'encoder.v1.bin')), opts),
    decoder: await ort.InferenceSession.create(new Uint8Array(decoder), opts),
    vocab: JSON.parse(readFileSync(M + 'tokens.v1.json', 'utf8')),
  }
  const t = JSON.parse(readFileSync(join(DIR, 'textos.json'), 'utf8')) as Record<string, string>
  const ref = (k: string) => t[k].replace(/\[PAUSA\]/g, ' ')
  const a = (k: string) => wav(join(DIR, `${k}.wav`))
  const quiet = new Float32Array(16000 * 8)
  const cases: Array<{ name: string; audio: Float32Array; ref: string; lang: LanguageCode | 'auto'; expect: LanguageCode }> = [
    { name: 'largo-es auto', audio: a('largo-es'), ref: ref('largo-es'), lang: 'auto', expect: 'es' },
    { name: 'largo-es es', audio: a('largo-es'), ref: ref('largo-es'), lang: 'es', expect: 'es' },
    { name: 'pausas-es auto', audio: a('pausas-es'), ref: ref('pausas-es'), lang: 'auto', expect: 'es' },
    { name: 'corto-es auto', audio: a('corto-es'), ref: ref('corto-es'), lang: 'auto', expect: 'es' },
    { name: 'ruido 10 dB auto', audio: noisy(a('largo-es'), 10), ref: ref('largo-es'), lang: 'auto', expect: 'es' },
    { name: 'ruido 5 dB auto', audio: noisy(a('corto-es'), 5), ref: ref('corto-es'), lang: 'auto', expect: 'es' },
    { name: '8 s de ruido al inicio auto', audio: join2(noisy(quiet.map(() => 0.001), 0).map((v, i) => (i % 2 ? v : -v) * 20), a('largo-es')), ref: ref('largo-es'), lang: 'auto', expect: 'es' },
    { name: '3 minutos es auto', audio: join2(a('largo-es'), a('pausas-es'), a('largo-es')), ref: ref('largo-es') + ' ' + ref('pausas-es') + ' ' + ref('largo-es'), lang: 'auto', expect: 'es' },
    { name: 'en auto', audio: a('en'), ref: ref('en'), lang: 'auto', expect: 'en' },
    { name: 'en forzado', audio: a('en'), ref: ref('en'), lang: 'en', expect: 'en' },
  ]
  const only = process.env.ONLY
  const rows: string[] = []
  for (const c of cases) {
    if (only && !c.name.includes(only)) continue
    const t0 = Date.now()
    const r = await transcribe(e, c.audio, { language: c.lang, translate: false, preferred: 'es' })
    const text = segmentsToText(r.segments)
    const w = wer(c.ref, text)
    const row = `${c.name}: WER ${(w * 100).toFixed(1)} %, idioma ${r.language}${r.language !== c.expect ? ' (MAL)' : ''}, ${((Date.now() - t0) / 1000).toFixed(0)} s\n   ${text}`
    console.log(row)
    rows.push(row)
  }
  writeFileSync(join(DIR, `resultado-${LABEL}.txt`), rows.join('\n\n'))
})
