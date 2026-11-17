/**
 * Guardado de "Retomar lectura" (W-62) en este navegador: la lista de documentos en
 * localStorage y una copia de cada archivo en IndexedDB, para reabrirlo con un toque.
 * Nada sale del equipo. Si el navegador bloquea el almacenamiento, todo sigue
 * funcionando sin recordar (cada función atrapa sus errores).
 */
import { MAX_STORED_BYTES, filesToDrop, parseEntries, type ReadingEntry } from '../core/readingHistory'

const LIST_KEY = 'ds-study-history'
const DB_NAME = 'docusmart-study'
const STORE = 'files'

export function loadHistory(): ReadingEntry[] {
  try {
    return parseEntries(localStorage.getItem(LIST_KEY))
  } catch {
    return []
  }
}

export function saveHistory(list: readonly ReadingEntry[]): void {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list))
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

/** Guarda la copia del archivo (si no es demasiado grande). Devuelve si quedó guardado. */
export async function storeFile(id: string, file: File): Promise<boolean> {
  if (file.size > MAX_STORED_BYTES) return false
  try {
    await withStore('readwrite', (s) => s.put({ name: file.name, type: file.type, lastModified: file.lastModified, blob: file }, id))
    return true
  } catch {
    return false
  }
}

export async function loadFile(id: string): Promise<File | null> {
  try {
    const rec = await withStore<{ name: string; type: string; lastModified: number; blob: Blob } | undefined>('readonly', (s) => s.get(id))
    return rec ? new File([rec.blob], rec.name, { type: rec.type, lastModified: rec.lastModified }) : null
  } catch {
    return null
  }
}

/** Borra las copias que ya no están en la lista o pasan del máximo. */
export async function pruneFiles(list: readonly ReadingEntry[]): Promise<void> {
  try {
    const ids = (await withStore<IDBValidKey[]>('readonly', (s) => s.getAllKeys())).map(String)
    for (const id of filesToDrop(list, ids)) await withStore('readwrite', (s) => s.delete(id))
  } catch {
    /* sin IndexedDB no hay nada que limpiar */
  }
}
