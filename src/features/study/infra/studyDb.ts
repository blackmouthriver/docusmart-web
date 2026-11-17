/**
 * Base de datos del Modo Estudio en el navegador (IndexedDB), compartida por
 * "Retomar lectura" (copias de documentos) y las imágenes de las notas.
 * Nada sale del equipo.
 */
const DB_NAME = 'docusmart-study'
const VERSION = 2
export type StudyStore = 'files' | 'noteImages'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      // v1 tenía solo "files"; v2 agrega "noteImages".
      for (const name of ['files', 'noteImages'] as const) if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function withStore<T>(store: StudyStore, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(store, mode).objectStore(store))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}
