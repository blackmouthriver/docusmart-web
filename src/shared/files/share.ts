/**
 * Compartir un resultado con la hoja de compartir del sistema (Web Share API):
 * en el celular abre WhatsApp, Drive, Gmail, Telegram… sin subir el archivo a
 * ningún servidor de DocuSmart.
 */
import { zipSync } from 'fflate'
import { safeFilename, safeMimeType } from './files'
import { tr } from '../i18n/translate'
import type { Lang } from '../i18n/languages'
// Generado por scripts/generate-tool-pages.mjs: slug en español → slug en cada idioma.
import TOOL_PAGE_SLUGS from './toolPageSlugs.json'

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

/** "3 páginas · 1.2 MB" (en el idioma de la página). */
export function docSummary(pages: number, bytes: number, formatBytes: (n: number) => string): string {
  const p = pages === 1 ? tr('dp.page') : tr('dp.pages', { n: pages })
  return pages > 0 ? `${p} · ${formatBytes(bytes)}` : formatBytes(bytes)
}

/** Diferencia de peso entre el original y el resultado ("62% menos", "8% más"). */
export function sizeChange(before: number, after: number): string | null {
  if (!before || before === after) return null
  const pct = Math.round((Math.abs(before - after) / before) * 100)
  if (!pct) return null
  return after < before ? tr('common.lessPct', { n: pct }) : tr('common.morePct', { n: pct })
}

/* ───────────── Invitar a compartir DocuSmart ───────────── */

export const SITE_URL = 'https://docusmart.online'
/** Redes sociales de DocuSmart. */
export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61596626852763'
export const INSTAGRAM_URL = 'https://www.instagram.com/supportdocusmart/'
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.docsmart'
export const FEEDBACK_EMAIL = 'jblackmouthr@gmail.com'

export type AppShareLink = { id: 'whatsapp' | 'facebook' | 'x' | 'linkedin'; label: string; href: string }

/** Enlaces para recomendar DocuSmart (solo llevan la dirección del sitio, nunca datos del usuario). */
export function appShareLinks(url = SITE_URL, text = 'Uso DocuSmart para trabajar mis PDF gratis y sin subirlos a internet.'): AppShareLink[] {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(text)
  return [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { id: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ]
}

export const feedbackMailto = (tool: string) => `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(`Opinión sobre DocuSmart Web (${tool})`)}`

/** Página pública de cada herramienta (para recomendarla); las que no tienen, la app. */
export const TOOL_PAGES: Record<string, string> = {
  compress: 'comprimir-pdf',
  merge: 'unir-pdf',
  split: 'dividir-pdf',
  rotate: 'rotar-pdf',
  protect: 'proteger-pdf',
  unlock: 'desbloquear-pdf',
  repair: 'reparar-pdf',
  ocr: 'ocr-pdf',
  crop: 'recortar-pdf',
  sign: 'firmar-pdf',
  redact: 'censurar-pdf',
  edit: 'editar-pdf',
  form: 'llenar-formulario-pdf',
  pdfa: 'pdf-a-pdfa',
  'img-pdf': 'imagen-a-pdf',
  'pdf-img': 'pdf-a-jpg',
  'pdf-txt': 'pdf-a-texto',
  'pdf-word': 'pdf-a-word',
  'pdf-excel': 'pdf-a-excel',
  'word-pdf': 'word-a-pdf',
  'excel-pdf': 'excel-a-pdf',
  compress_image: 'comprimir-imagen',
  resize_image: 'redimensionar-imagen',
  rotate_image: 'rotar-imagen',
  crop_image: 'recortar-imagen',
  scan: 'escanear-documento',
  archive_create: 'comprimir-archivos',
  archive_extract: 'descomprimir-archivos',
  qr: 'crear-codigo-qr',
}
const SLUGS: Record<string, Partial<Record<Lang, string>>> = TOOL_PAGE_SLUGS

/** Página pública de la herramienta en el idioma del usuario; sin página, la app web. */
export function toolShareUrl(tool: string, lang: Lang = 'es'): string {
  const es = TOOL_PAGES[tool]
  if (!es) return `${SITE_URL}/app`
  const slug = lang === 'es' ? undefined : SLUGS[es]?.[lang]
  return slug ? `${SITE_URL}/${lang}/${slug}` : `${SITE_URL}/${es}`
}

/** Varios resultados en uno para guardar: el archivo tal cual si es uno solo, o un ZIP. */
export async function bundleFiles(files: File[], zipName: string): Promise<File | null> {
  if (!files.length) return null
  if (files.length === 1) return files[0]
  const entries: Record<string, Uint8Array> = {}
  for (const f of files) {
    let name = f.name
    for (let n = 2; name in entries; n++) name = f.name.replace(/(\.[^.]+)?$/, `-${n}$1`)
    entries[name] = new Uint8Array(await f.arrayBuffer())
  }
  return resultFile(zipSync(entries, { level: 0 }), zipName, 'application/zip')
}
