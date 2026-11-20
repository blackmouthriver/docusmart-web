// Descarga del modelo de "Quitar fondo" (W-121): ~90 MB desde docusmart.online la primera
// vez, con progreso; se guarda en el navegador (Cache Storage) y se verifica su SHA-256.
// Excluido de la cobertura como los demás adaptadores que usan red y APIs del navegador.
import { MODEL, joinParts } from '../core/background'
import { hashBytes } from '../../integrity/core/hash'

const CACHE = 'ds-models-v1'

async function openCache(): Promise<Cache | null> {
  try {
    return await caches.open(CACHE)
  } catch {
    // Navegación privada o almacenamiento bloqueado: se descarga sin guardar.
    return null
  }
}

/** ¿El modelo ya está guardado en este navegador? (para avisar o no de la descarga). */
export async function isModelCached(): Promise<boolean> {
  const cache = await openCache()
  if (!cache) return false
  const hits = await Promise.all(MODEL.parts.map((p) => cache.match(MODEL.base + p.file)))
  return hits.every(Boolean)
}

async function readWithProgress(res: Response, onBytes: (n: number) => void): Promise<Uint8Array> {
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer())
    onBytes(buf.length)
    return buf
  }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    onBytes(value.length)
  }
  return joinParts(chunks)
}

/** El modelo completo, verificado. `onProgress` recibe de 0 a 1 mientras descarga. */
export async function loadBackgroundModel(onProgress: (fraction: number) => void): Promise<Uint8Array> {
  const cache = await openCache()
  let loaded = 0
  const parts: Uint8Array[] = []
  for (const part of MODEL.parts) {
    const url = MODEL.base + part.file
    const hit = await cache?.match(url)
    if (hit) {
      parts.push(new Uint8Array(await hit.arrayBuffer()))
      loaded += part.bytes
      onProgress(loaded / MODEL.bytes)
      continue
    }
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const bytes = await readWithProgress(res, (n) => {
      loaded += n
      onProgress(Math.min(1, loaded / MODEL.bytes))
    })
    parts.push(bytes)
    await cache?.put(url, new Response(bytes as Uint8Array<ArrayBuffer>, { headers: { 'Content-Type': 'application/octet-stream' } })).catch(() => undefined)
  }
  const model = joinParts(parts)
  if ((await hashBytes(model, 'SHA-256')) !== MODEL.sha256) {
    // Descarga incompleta o dañada: se borra para que la próxima vez se baje de nuevo.
    await caches.delete(CACHE).catch(() => undefined)
    throw new Error('El modelo descargado está incompleto')
  }
  return model
}
