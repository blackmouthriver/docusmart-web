import { tr } from '../i18n/translate'

/**
 * Qué es un archivo según sus primeros bytes (la "firma" del formato), sin abrirlo entero: así se
 * avisa apenas se elige un archivo vacío, dañado o que no es lo que dice su extensión, en vez de
 * fallar después de procesarlo (barrido de herramientas, 2026-11-25).
 */
export type Sniffed = 'pdf' | 'jpeg' | 'png' | 'gif' | 'webp' | 'bmp' | 'tiff' | 'heif' | 'avif' | 'svg' | 'zip' | null

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v)
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to))

/** Formato reconocido en los primeros bytes (con 1 KB alcanza), o null. */
export function sniff(head: Uint8Array): Sniffed {
  if (head.length < 4) return null
  // %PDF- puede venir tras algo de basura al inicio (los lectores lo aceptan en el primer KB).
  if (ascii(head, 0, Math.min(head.length, 1024)).includes('%PDF-')) return 'pdf'
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47])) return 'png'
  if (startsWith(head, [0x47, 0x49, 0x46, 0x38])) return 'gif'
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') return 'webp'
  if (startsWith(head, [0x42, 0x4d])) return 'bmp'
  if (startsWith(head, [0x49, 0x49, 0x2a, 0x00]) || startsWith(head, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff'
  if (ascii(head, 4, 8) === 'ftyp') {
    const brand = ascii(head, 8, 12)
    if (brand === 'avif' || brand === 'avis') return 'avif'
    if (/^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(brand)) return 'heif'
  }
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04]) || startsWith(head, [0x50, 0x4b, 0x05, 0x06])) return 'zip'
  // SVG: texto que empieza (tras BOM, espacios, <?xml…?> o comentarios) con una etiqueta <svg.
  const text = new TextDecoder('utf-8', { fatal: false }).decode(head).replace(/^﻿/, '')
  return isSvgText(text) ? 'svg' : null
}

/** ¿Empieza con <svg, tras la declaración XML, comentarios y DOCTYPE? (recorrido lineal, sin regex que se trabe) */
function isSvgText(text: string): boolean {
  let t = text.trimStart()
  for (;;) {
    const end = t.startsWith('<?xml') ? t.indexOf('>') + 1 : t.startsWith('<!--') ? t.indexOf('-->', 4) + 3 : /^<!doctype/i.test(t) ? t.indexOf('>') + 1 : -1
    if (end === -1) break
    // Un prólogo sin cerrar: no se sabe qué sigue.
    if (end <= 2) return false
    t = t.slice(end).trimStart()
  }
  return /^<svg[\s>]/i.test(t)
}

const IMAGE: ReadonlySet<Sniffed> = new Set(['jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heif', 'avif', 'svg'])

/** Problema de un archivo para lo que se espera de él: vacío, no es de ese tipo, o null si sirve. */
export type FileProblem = 'empty' | 'notPdf' | 'notImage'
/** Qué se espera: PDF, imagen, cualquiera de los dos, o cualquier archivo de los tipos aceptados (solo se revisa que no esté vacío). */
export type Expect = 'pdf' | 'image' | 'pdfOrImage' | 'any'

export function problemOf(size: number, head: Uint8Array, expect: Expect, name = ''): FileProblem | null {
  if (size === 0) return 'empty'
  if (expect === 'any') return null
  const kind = sniff(head)
  if (expect === 'pdf') return kind === 'pdf' ? null : 'notPdf'
  if (expect === 'image') return IMAGE.has(kind) ? null : 'notImage'
  if (kind === 'pdf' || IMAGE.has(kind)) return null
  return /\.pdf$/i.test(name) ? 'notPdf' : 'notImage'
}

/** Lo mismo leyendo solo el primer KB del archivo. */
export async function checkFile(file: Blob & { name?: string }, expect: Expect): Promise<FileProblem | null> {
  if (file.size === 0) return 'empty'
  if (expect === 'any') return null
  return problemOf(file.size, new Uint8Array(await file.slice(0, 1024).arrayBuffer()), expect, file.name)
}

/** El mensaje para mostrar de cada problema. */
export function problemMessage(p: FileProblem): string {
  if (p === 'empty') return tr('err.emptyFile')
  return p === 'notPdf' ? tr('err.invalidPdf') : tr('libErr.imageOpen')
}

const IMAGE_EXT = /^\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif|avif|svg)$/i

/**
 * Qué se espera de un selector según su "accept": solo PDF, solo imágenes, PDF o imágenes, otros
 * tipos (solo se rechazan los vacíos) o nada que revisar (si acepta cualquier archivo).
 */
export function expectFromAccept(accept: string): Expect | null {
  const items = accept.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
  if (!items.length || items.includes('*/*') || items.includes('*')) return null
  const isPdf = (x: string) => x === 'application/pdf' || x === '.pdf'
  const isImage = (x: string) => x.startsWith('image/') || IMAGE_EXT.test(x)
  if (items.every(isPdf)) return 'pdf'
  if (items.every(isImage)) return 'image'
  if (items.every((x) => isPdf(x) || isImage(x))) return 'pdfOrImage'
  return 'any'
}
