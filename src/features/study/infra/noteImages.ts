/**
 * Imágenes adjuntas a las notas (W-65): se achican (máx. 1600 px, JPEG) y se guardan
 * en IndexedDB de este navegador. Si el almacenamiento está bloqueado, se avisa al guardar.
 */
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { withStore } from './studyDb'

const MAX_SIDE = 1600

/** Achica la imagen y la guarda; devuelve su id. */
export async function saveNoteImage(file: Blob): Promise<string> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * k)
  canvas.height = Math.round(bmp.height * k)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff' // las transparencias quedan sobre blanco, como en papel
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85)
  canvas.width = canvas.height = 0
  const id = crypto.randomUUID()
  await withStore('noteImages', 'readwrite', (s) => s.put(blob, id))
  return id
}

export async function loadNoteImage(id: string): Promise<Blob | null> {
  try {
    return (await withStore<Blob | undefined>('noteImages', 'readonly', (s) => s.get(id))) ?? null
  } catch {
    return null
  }
}

export async function storedNoteImageIds(): Promise<string[]> {
  try {
    return (await withStore<IDBValidKey[]>('noteImages', 'readonly', (s) => s.getAllKeys())).map(String)
  } catch {
    return []
  }
}

export async function deleteNoteImages(ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    try {
      await withStore('noteImages', 'readwrite', (s) => s.delete(id))
    } catch {
      /* ya no estaba */
    }
  }
}
