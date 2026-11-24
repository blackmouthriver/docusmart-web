// Descarga de modelos de "Audio a texto" (W-133, W-147.4) desde docusmart.online, con progreso; se
// guardan en el navegador (Cache Storage) para no volver a bajarlos. Excluido de la cobertura.
const CACHE = 'ds-models-v1'

export async function openModelCache(): Promise<Cache | null> {
  try {
    return await caches.open(CACHE)
  } catch {
    return null
  }
}

/** ¿Están todos estos archivos guardados en este navegador? */
export async function allCached(urls: readonly string[]): Promise<boolean> {
  const cache = await openModelCache()
  if (!cache) return false
  const hits = await Promise.all(urls.map((u) => cache.match(u)))
  return hits.every(Boolean)
}

export function joinBytes(parts: Uint8Array[]): Uint8Array {
  if (parts.length === 1) return parts[0]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

/**
 * Un archivo del modelo: de la caché si ya está; si no, se descarga (avisando cada trozo con
 * `onBytes`) y se guarda.
 */
export async function fetchCached(cache: Cache | null, url: string, size: number, onBytes: (n: number) => void): Promise<Uint8Array> {
  const hit = await cache?.match(url)
  if (hit) {
    onBytes(size)
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
    onBytes(value.length)
  }
  const bytes = joinBytes(chunks)
  await cache?.put(url, new Response(bytes as Uint8Array<ArrayBuffer>, { headers: { 'Content-Type': 'application/octet-stream' } })).catch(() => undefined)
  return bytes
}
