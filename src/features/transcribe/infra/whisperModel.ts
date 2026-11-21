// Descarga del modelo de "Audio a texto" (W-133): ~77 MB desde docusmart.online la primera vez,
// con progreso; se guarda en el navegador (Cache Storage) y se verifica su SHA-256, como el de
// Quitar fondo. Excluido de la cobertura como los demás adaptadores de red y navegador.
import { WHISPER_BYTES, WHISPER_MODEL } from '../core/whisper'
import { hashBytes } from '../../integrity/core/hash'

const CACHE = 'ds-models-v1'
type Part = { file: string; bytes: number }

async function openCache(): Promise<Cache | null> {
  try {
    return await caches.open(CACHE)
  } catch {
    return null
  }
}

const allParts = (): Part[] => [...WHISPER_MODEL.encoder.parts, ...WHISPER_MODEL.decoder.parts, WHISPER_MODEL.tokens]

/** ¿El modelo ya está guardado en este navegador? (para avisar o no de la descarga). */
export async function isWhisperCached(): Promise<boolean> {
  const cache = await openCache()
  if (!cache) return false
  const hits = await Promise.all(allParts().map((p) => cache.match(WHISPER_MODEL.base + p.file)))
  return hits.every(Boolean)
}

function join(parts: Uint8Array[]): Uint8Array {
  if (parts.length === 1) return parts[0]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

export type WhisperFiles = { encoder: Uint8Array; decoder: Uint8Array; vocab: string[] }

/** Los archivos del modelo, verificados. `onProgress` recibe de 0 a 1 mientras descarga. */
export async function loadWhisper(onProgress: (fraction: number) => void): Promise<WhisperFiles> {
  const cache = await openCache()
  let loaded = 0
  const fetchPart = async (p: Part): Promise<Uint8Array> => {
    const url = WHISPER_MODEL.base + p.file
    const hit = await cache?.match(url)
    if (hit) {
      loaded += p.bytes
      onProgress(Math.min(1, loaded / WHISPER_BYTES))
      return new Uint8Array(await hit.arrayBuffer())
    }
    const res = await fetch(url)
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      onProgress(Math.min(1, loaded / WHISPER_BYTES))
    }
    const bytes = join(chunks)
    await cache?.put(url, new Response(bytes as Uint8Array<ArrayBuffer>, { headers: { 'Content-Type': 'application/octet-stream' } })).catch(() => undefined)
    return bytes
  }
  const encoder = join(await Promise.all(WHISPER_MODEL.encoder.parts.map(fetchPart)))
  const decoder = join(await Promise.all(WHISPER_MODEL.decoder.parts.map(fetchPart)))
  const tokens = await fetchPart(WHISPER_MODEL.tokens)
  const [he, hd, ht] = await Promise.all([hashBytes(encoder, 'SHA-256'), hashBytes(decoder, 'SHA-256'), hashBytes(tokens, 'SHA-256')])
  if (he !== WHISPER_MODEL.encoder.sha256 || hd !== WHISPER_MODEL.decoder.sha256 || ht !== WHISPER_MODEL.tokens.sha256) {
    // Descarga incompleta o dañada: se borra para que la próxima vez se baje de nuevo.
    await Promise.all(allParts().map((p) => cache?.delete(WHISPER_MODEL.base + p.file)))
    throw new Error('El modelo descargado está incompleto')
  }
  return { encoder, decoder, vocab: JSON.parse(new TextDecoder().decode(tokens)) as string[] }
}
