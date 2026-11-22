/**
 * Más formatos de imagen (W-124): reconocer SVG y TIFF, medir un SVG y armar un ICO.
 * Partes puras, para poder probarlas; los decodificadores y codificadores están en infra/formatCodecs.ts.
 */
import { isHeic } from './heic'

/** Formatos que el navegador no abre solo y DocuSmart sabe abrir. */
export type SpecialImage = 'heic' | 'svg' | 'tiff'

/** ¿Es un TIFF? Empieza por "II*\0" (Intel) o "MM\0*" (Motorola). */
export function isTiff(head: Uint8Array): boolean {
  if (head.length < 4) return false
  const intel = head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2a && head[3] === 0x00
  const motorola = head[0] === 0x4d && head[1] === 0x4d && head[2] === 0x00 && head[3] === 0x2a
  return intel || motorola
}

/** ¿Es un SVG? Texto que, quitando la declaración XML, comentarios y DOCTYPE, empieza por <svg. */
export function isSvg(head: Uint8Array): boolean {
  let text = new TextDecoder().decode(head.subarray(0, 2048)).replace(/^﻿/, '')
  text = text.replace(/^\s*<\?xml[^>]*\?>/i, '')
  for (;;) {
    const t = text.replace(/^\s*<!--[\s\S]*?-->/, '').replace(/^\s*<!DOCTYPE[^>]*>/i, '')
    if (t === text) break
    text = t
  }
  return /^\s*<svg[\s>]/i.test(text)
}

/** Qué formato especial es (o null si es una imagen común o no se reconoce). */
export function specialImage(head: Uint8Array): SpecialImage | null {
  if (isHeic(head)) return 'heic'
  if (isTiff(head)) return 'tiff'
  if (isSvg(head)) return 'svg'
  return null
}

/** Por nombre o tipo, antes de leer el archivo: los que el navegador no muestra en un <img>. */
export const looksSpecial = (name: string, type: string) =>
  /\.(heic|heif|tiff?|svg)$/i.test(name) || /^image\/(hei[cf](-sequence)?|tiff|svg\+xml)$/i.test(type)

/** Un enlace a internet (o "//sitio"): el navegador no lo carga dentro de un SVG abierto como imagen. */
const EXTERNAL_REF = /^\s*(https?:)?\/\//i

/**
 * Prepara un SVG para dibujarlo como imagen (W-146.7): le agrega el `xmlns` que falta (los SVG
 * copiados de una página web no lo traen y el navegador no los abre) y quita las imágenes con
 * enlaces externos, que no se pueden cargar y salían como el ícono de "imagen rota".
 */
export function prepareSvg(svgText: string): string {
  const usesXlink = /\sxlink:/i.test(svgText)
  let text = svgText.replace(/<svg\b([^>]*)>/i, (_tag, attrs: string) => {
    let a = attrs
    if (!/\sxmlns\s*=/i.test(a)) a = ` xmlns="http://www.w3.org/2000/svg"${a}`
    if (usesXlink && !/\sxmlns:xlink\s*=/i.test(a)) a = ` xmlns:xlink="http://www.w3.org/1999/xlink"${a}`
    return `<svg${a}>`
  })
  const external = (attrs: string) => {
    const href = /\s(?:xlink:)?href\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1]
    return href !== undefined && EXTERNAL_REF.test(href)
  }
  text = text.replace(/<(image|feImage)\b([^>]*?)(\/>|>[\s\S]*?<\/\1\s*>)/gi, (whole: string, _tag: string, attrs: string) => (external(attrs) ? '' : whole))
  return text
}

/** Lado de dibujo de un SVG: si es pequeño se agranda (es vectorial, no pierde nitidez); nunca pasa de 4096. */
export const SVG_MIN_SIDE = 1024
export const SVG_MAX_SIDE = 4096

const length = (v: string | undefined) => {
  if (!v) return null
  const m = /^\s*([\d.]+)\s*(px)?\s*$/i.exec(v)
  const n = m ? Number(m[1]) : Number.NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Tamaño en pixeles con que se dibuja un SVG, según su width/height o su viewBox. */
export function svgRenderSize(svgText: string): { width: number; height: number } {
  const tag = /<svg\b[^>]*>/i.exec(svgText)?.[0] ?? ''
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(tag)?.[1]
  let w = length(attr('width'))
  let h = length(attr('height'))
  const vb = attr('viewBox')?.trim().split(/[\s,]+/).map(Number)
  const vw = vb && vb.length === 4 && vb[2] > 0 ? vb[2] : null
  const vh = vb && vb.length === 4 && vb[3] > 0 ? vb[3] : null
  if (w && !h) h = vw && vh ? (w * vh) / vw : w
  if (h && !w) w = vw && vh ? (h * vw) / vh : h
  if (!w || !h) {
    w = vw ?? 300
    h = vh ?? 150
  }
  const max = Math.max(w, h)
  const k = max < SVG_MIN_SIDE ? SVG_MIN_SIDE / max : max > SVG_MAX_SIDE ? SVG_MAX_SIDE / max : 1
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) }
}

/** Tamaños de un favicon .ico: los que piden navegadores, Windows y accesos directos. */
export const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const

/** Dónde va la imagen dentro de un cuadrado de `size` px, completa y centrada. */
export function containSquare(w: number, h: number, size: number): { x: number; y: number; width: number; height: number } {
  const k = size / Math.max(w, h)
  const width = Math.max(1, Math.round(w * k))
  const height = Math.max(1, Math.round(h * k))
  return { x: Math.floor((size - width) / 2), y: Math.floor((size - height) / 2), width, height }
}

/** Arma un .ico con varias imágenes PNG (una por tamaño), como lo admiten todos los sistemas desde Windows Vista. */
export function icoFromPngs(entries: ReadonlyArray<{ size: number; png: Uint8Array }>): Uint8Array {
  if (!entries.length) throw new Error('Sin imágenes para el ícono')
  const header = 6 + 16 * entries.length
  const total = header + entries.reduce((n, e) => n + e.png.length, 0)
  const out = new Uint8Array(total)
  const v = new DataView(out.buffer)
  v.setUint16(0, 0, true) // reservado
  v.setUint16(2, 1, true) // 1 = ícono
  v.setUint16(4, entries.length, true)
  let offset = header
  entries.forEach((e, i) => {
    if (e.size < 1 || e.size > 256) throw new Error('Tamaño de ícono fuera de rango')
    const at = 6 + 16 * i
    out[at] = e.size === 256 ? 0 : e.size // 0 significa 256
    out[at + 1] = e.size === 256 ? 0 : e.size
    out[at + 2] = 0 // sin paleta
    out[at + 3] = 0
    v.setUint16(at + 4, 1, true) // planos
    v.setUint16(at + 6, 32, true) // bits por pixel
    v.setUint32(at + 8, e.png.length, true)
    v.setUint32(at + 12, offset, true)
    out.set(e.png, offset)
    offset += e.png.length
  })
  return out
}
