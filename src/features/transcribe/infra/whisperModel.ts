// Descarga del modelo de "Audio a texto" (W-133): ~77 MB desde docusmart.online la primera vez,
// con progreso; se guarda en el navegador (Cache Storage) y se verifica su SHA-256, como el de
// Quitar fondo. Excluido de la cobertura como los demás adaptadores de red y navegador.
import { WHISPER_BYTES, WHISPER_MODEL } from '../core/whisper'
import { hashBytes } from '../../integrity/core/hash'
import { allCached, fetchCached, joinBytes, openModelCache } from './modelCache'

type Part = { file: string; bytes: number }

const allParts = (): Part[] => [...WHISPER_MODEL.encoder.parts, ...WHISPER_MODEL.decoder.parts, WHISPER_MODEL.tokens]

/** ¿El modelo ya está guardado en este navegador? (para avisar o no de la descarga). */
export const isWhisperCached = (): Promise<boolean> => allCached(allParts().map((p) => WHISPER_MODEL.base + p.file))

export type WhisperFiles = { encoder: Uint8Array; decoder: Uint8Array; vocab: string[] }

/** Los archivos del modelo, verificados. `onProgress` recibe de 0 a 1 mientras descarga. */
export async function loadWhisper(onProgress: (fraction: number) => void): Promise<WhisperFiles> {
  const cache = await openModelCache()
  let loaded = 0
  const fetchPart = (p: Part) =>
    fetchCached(cache, WHISPER_MODEL.base + p.file, p.bytes, (n) => {
      loaded += n
      onProgress(Math.min(1, loaded / WHISPER_BYTES))
    })
  const encoder = joinBytes(await Promise.all(WHISPER_MODEL.encoder.parts.map(fetchPart)))
  const decoder = joinBytes(await Promise.all(WHISPER_MODEL.decoder.parts.map(fetchPart)))
  const tokens = await fetchPart(WHISPER_MODEL.tokens)
  const [he, hd, ht] = await Promise.all([hashBytes(encoder, 'SHA-256'), hashBytes(decoder, 'SHA-256'), hashBytes(tokens, 'SHA-256')])
  if (he !== WHISPER_MODEL.encoder.sha256 || hd !== WHISPER_MODEL.decoder.sha256 || ht !== WHISPER_MODEL.tokens.sha256) {
    // Descarga incompleta o dañada: se borra para que la próxima vez se baje de nuevo.
    await Promise.all(allParts().map((p) => cache?.delete(WHISPER_MODEL.base + p.file)))
    throw new Error('El modelo descargado está incompleto')
  }
  return { encoder, decoder, vocab: JSON.parse(new TextDecoder().decode(tokens)) as string[] }
}
