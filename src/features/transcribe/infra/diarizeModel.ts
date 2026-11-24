// Descarga de los modelos de hablantes (W-147.4): ~12,7 MB desde docusmart.online la primera vez,
// con progreso; se guardan en el navegador y se verifica su SHA-256. Excluido de la cobertura.
import { DIARIZE_BYTES, DIARIZE_MODEL } from '../core/diarize'
import { hashBytes } from '../../integrity/core/hash'
import { allCached, fetchCached, openModelCache } from './modelCache'

const files = [DIARIZE_MODEL.segmentation, DIARIZE_MODEL.embedding]

export const isDiarizeCached = (): Promise<boolean> => allCached(files.map((f) => DIARIZE_MODEL.base + f.file))

export type DiarizeFiles = { segmentation: Uint8Array; embedding: Uint8Array }

/** Los dos modelos, verificados. `onProgress` recibe de 0 a 1 mientras descarga. */
export async function loadDiarize(onProgress: (fraction: number) => void): Promise<DiarizeFiles> {
  const cache = await openModelCache()
  let loaded = 0
  const [segmentation, embedding] = await Promise.all(
    files.map((f) =>
      fetchCached(cache, DIARIZE_MODEL.base + f.file, f.bytes, (n) => {
        loaded += n
        onProgress(Math.min(1, loaded / DIARIZE_BYTES))
      }),
    ),
  )
  const hashes = await Promise.all([hashBytes(segmentation, 'SHA-256'), hashBytes(embedding, 'SHA-256')])
  if (hashes[0] !== DIARIZE_MODEL.segmentation.sha256 || hashes[1] !== DIARIZE_MODEL.embedding.sha256) {
    await Promise.all(files.map((f) => cache?.delete(DIARIZE_MODEL.base + f.file)))
    throw new Error('El modelo descargado está incompleto')
  }
  return { segmentation, embedding }
}
