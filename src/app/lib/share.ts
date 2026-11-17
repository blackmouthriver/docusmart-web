/**
 * Compartir un resultado con la hoja de compartir del sistema (Web Share API):
 * en el celular abre WhatsApp, Drive, Gmail, Telegram… sin subir el archivo a
 * ningún servidor de DocuSmart.
 */
import { safeFilename, safeMimeType } from './files'

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported'
type ShareNav = { share?: (data: ShareData) => Promise<void>; canShare?: (data: ShareData) => boolean }

/** El resultado como File, con nombre limpio y un tipo que el sitio genera a propósito. */
export function resultFile(data: Blob | Uint8Array, name: string, type = 'application/octet-stream'): File {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type })
  return new File([blob], safeFilename(name), { type: safeMimeType(blob.type || type) })
}

/** ¿El navegador puede compartir este archivo? (Chrome/Safari en celular, Edge/Chrome en Windows…) */
export function canShareFile(file: File, nav: ShareNav = navigator): boolean {
  try {
    return typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })
  } catch {
    return false
  }
}

export async function shareFile(file: File, nav: ShareNav = navigator): Promise<ShareOutcome> {
  if (!canShareFile(file, nav)) return 'unsupported'
  try {
    await nav.share!({ files: [file], title: file.name })
    return 'shared'
  } catch (e) {
    // El usuario cerró la hoja de compartir.
    if (e instanceof Error && e.name === 'AbortError') return 'cancelled'
    throw e
  }
}

/** "3 páginas · 1.2 MB" */
export function docSummary(pages: number, bytes: number, formatBytes: (n: number) => string): string {
  const p = pages === 1 ? '1 página' : `${pages} páginas`
  return pages > 0 ? `${p} · ${formatBytes(bytes)}` : formatBytes(bytes)
}

/** Diferencia de peso entre el original y el resultado ("62% menos", "8% más"). */
export function sizeChange(before: number, after: number): string | null {
  if (!before || before === after) return null
  const pct = Math.round((Math.abs(before - after) / before) * 100)
  if (!pct) return null
  return after < before ? `${pct}% menos` : `${pct}% más`
}
