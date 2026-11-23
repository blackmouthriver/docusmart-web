/**
 * Audio y video (W-132): reglas puras de las herramientas de video a MP3, convertir,
 * recortar y comprimir. El trabajo pesado lo hace infra/mediaRun.ts con Mediabunny
 * (WebCodecs del navegador, con aceleración por hardware): aquí solo se decide qué pedir.
 */

/** Las herramientas (id de la página y de la ruta #/multimedia/<id>); girar y GIF desde W-146.9, unir desde W-147.4. */
export type MediaToolId = 'audio' | 'convertir' | 'recortar' | 'comprimir' | 'girar' | 'gif' | 'unir'
export const MEDIA_TOOLS: readonly MediaToolId[] = ['audio', 'convertir', 'recortar', 'comprimir', 'girar', 'gif', 'unir']
/** Las que solo trabajan con video. */
const VIDEO_ONLY: readonly MediaToolId[] = ['convertir', 'comprimir', 'girar', 'gif', 'unir']
export const isVideoOnly = (tool: MediaToolId) => VIDEO_ONLY.includes(tool)
/** Las que aceptan varios archivos a la vez y los procesan uno tras otro (W-147.4). */
const BATCH: readonly MediaToolId[] = ['audio', 'convertir', 'comprimir']
export const isBatchTool = (tool: MediaToolId) => BATCH.includes(tool)
/** Cuántos archivos a la vez: en lote, y al unir videos. */
export const MAX_BATCH = 30
export const MAX_MERGE = 20

/** Dónde empieza cada video al unirlos: la suma de las duraciones anteriores (en segundos). */
export function mergeOffsets(durations: readonly number[]): number[] {
  const out: number[] = []
  let at = 0
  for (const d of durations) {
    out.push(at)
    at += Math.max(0, d)
  }
  return out
}

/**
 * Tamaño del video unido: el del primero (los demás se ajustan sin deformarse, con bandas negras),
 * con el alto hasta 1080 y medidas pares, que piden los codificadores.
 */
export function mergeSize(width: number, height: number, maxHeight = 1080): { width: number; height: number } {
  const k = height > maxHeight ? maxHeight / height : 1
  const even = (n: number) => Math.max(2, Math.round(n * k / 2) * 2)
  return { width: even(width), height: even(height) }
}

/** Frecuencia y canales del audio unido: todos los tramos se pasan a esto para poder pegarlos. */
export const MERGE_SAMPLE_RATE = 48000
export const MERGE_CHANNELS = 2

export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'ogg'
export type VideoFormat = 'mp4' | 'webm'
/** Contenedores de salida posibles (recortar conserva el del archivo original). */
export type OutputFormat = AudioFormat | VideoFormat | 'mov'
export type CompressLevel = 'ligera' | 'media' | 'fuerte'
/** Alto máximo del video comprimido; 0 = conservar el tamaño. */
export type MaxHeight = 0 | 1080 | 720 | 480
export type QualityName = 'very-low' | 'low' | 'medium' | 'high'

export const AUDIO_FORMATS: readonly AudioFormat[] = ['mp3', 'm4a', 'wav', 'ogg']
export const VIDEO_FORMATS: readonly VideoFormat[] = ['mp4', 'webm']
export const MAX_HEIGHTS: readonly MaxHeight[] = [0, 1080, 720, 480]

const VIDEO_EXT = ['mp4', 'm4v', 'mov', 'webm', 'mkv', '3gp']
const AUDIO_EXT = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac']

// Por extensión también: en algunos sistemas el archivo llega sin tipo.
export const VIDEO_ACCEPT = 'video/*,' + VIDEO_EXT.map((e) => '.' + e).join(',')
export const MEDIA_ACCEPT = 'video/*,audio/*,' + [...VIDEO_EXT, ...AUDIO_EXT].map((e) => '.' + e).join(',')

/** Qué archivos acepta cada herramienta: convertir, comprimir, girar y GIF son solo de video. */
export const acceptFor = (tool: MediaToolId) => (isVideoOnly(tool) ? VIDEO_ACCEPT : MEDIA_ACCEPT)

const extOf = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '')

/** 'video', 'audio' o null si no parece un archivo multimedia. */
export function mediaKind(name: string, type: string): 'video' | 'audio' | null {
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  const ext = extOf(name)
  if (VIDEO_EXT.includes(ext)) return 'video'
  if (AUDIO_EXT.includes(ext)) return 'audio'
  return null
}

/** ¿La herramienta acepta este archivo? */
export function accepts(tool: MediaToolId, name: string, type: string): boolean {
  const kind = mediaKind(name, type)
  return isVideoOnly(tool) ? kind === 'video' : kind !== null
}

/**
 * Lee un tiempo escrito por la persona: "83", "1:23", "1:23.5", "1:23,5" o "1:02:03".
 * Devuelve segundos, o null si no se entiende.
 */
export function parseTime(text: string): number | null {
  const t = text.trim().replace(',', '.')
  if (!t) return null
  if (!/^\d+(:\d{1,2}){0,2}(\.\d+)?$/.test(t)) return null
  const parts = t.split(':')
  const last = Number(parts.pop())
  if (parts.length && last >= 60) return null
  let total = last
  let mult = 60
  for (let i = parts.length - 1; i >= 0; i--) {
    const n = Number(parts[i])
    // Solo la primera parte (horas o minutos) puede pasar de 59.
    if (i > 0 && n >= 60) return null
    total += n * mult
    mult *= 60
  }
  return total
}

/** 83.4 → "1:23.4"; 3723 → "1:02:03". Décimas solo si hacen falta. */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds * 10) / 10)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s - h * 3600 - m * 60
  const whole = Math.floor(sec)
  const tenth = Math.round((sec - whole) * 10)
  const ss = String(whole).padStart(2, '0') + (tenth ? '.' + tenth : '')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export type TrimCheck = { ok: true; start: number; end: number } | { ok: false; reason: 'format' | 'order' | 'beyond' }

/** Valida el recorte: inicio antes del final y dentro de la duración (con una décima de tolerancia). */
export function checkTrim(startText: string, endText: string, duration: number): TrimCheck {
  const start = parseTime(startText)
  const end = parseTime(endText)
  if (start === null || end === null) return { ok: false, reason: 'format' }
  if (end - start < 0.1) return { ok: false, reason: 'order' }
  if (start >= duration || end > duration + 0.1) return { ok: false, reason: 'beyond' }
  return { ok: true, start, end: Math.min(end, duration) }
}

/** Al recortar se conserva el formato del original (así se copia sin recomprimir cuando se puede). */
export function trimFormat(name: string, type: string): OutputFormat {
  const ext = extOf(name)
  if (ext === 'mp3' || type === 'audio/mpeg') return 'mp3'
  if (ext === 'wav' || type === 'audio/wav' || type === 'audio/x-wav') return 'wav'
  if (['ogg', 'oga', 'opus'].includes(ext) || type === 'audio/ogg') return 'ogg'
  if (['m4a', 'aac'].includes(ext) || type === 'audio/mp4' || type === 'audio/aac') return 'm4a'
  if (ext === 'flac') return 'wav'
  if (ext === 'webm' || ext === 'mkv' || type === 'video/webm' || type === 'audio/webm') return mediaKind(name, type) === 'audio' ? 'ogg' : 'webm'
  if (ext === 'mov' || type === 'video/quicktime') return 'mov'
  return 'mp4'
}

const MIME: Record<OutputFormat, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}
export const mimeOf = (f: OutputFormat) => MIME[f]
export const isAudioFormat = (f: OutputFormat): f is AudioFormat => (AUDIO_FORMATS as readonly string[]).includes(f)

/** "Mi video.MOV" + "comprimido" + mp4 → "Mi video-comprimido.mp4". */
export function mediaFileName(original: string, suffix: string, format: OutputFormat): string {
  const base = original.replace(/\.[^./\\]+$/, '').trim() || 'media'
  return `${base}${suffix ? '-' + suffix : ''}.${format}`
}

/** Tamaño reducido a un alto máximo, conservando la proporción y en números pares (los códecs lo piden). */
export function scaledSize(width: number, height: number, maxHeight: MaxHeight): { width: number; height: number } | null {
  if (!maxHeight || width <= 0 || height <= 0) return null
  // En videos verticales manda el lado corto (un "720p" vertical es 720 de ancho).
  const short = Math.min(width, height)
  if (short <= maxHeight) return null
  const k = maxHeight / short
  const even = (n: number) => Math.max(2, Math.round((n * k) / 2) * 2)
  return { width: even(width), height: even(height) }
}

/** Calidad de video y de audio para cada nivel de compresión. */
export function compressQuality(level: CompressLevel): { video: QualityName; audio: QualityName } {
  if (level === 'ligera') return { video: 'medium', audio: 'medium' }
  if (level === 'fuerte') return { video: 'very-low', audio: 'low' }
  return { video: 'low', audio: 'low' }
}

/** Ahorro en porcentaje (0 si no se ganó nada). */
export const savedPercent = (before: number, after: number) => (before > 0 && after < before ? Math.round((1 - after / before) * 100) : 0)

/** Por qué no se pudo: lo traduce la pantalla. */
export type MediaFailure = 'unsupported-browser' | 'unsupported-file' | 'no-codec' | 'no-audio' | 'no-video' | 'too-small' | 'canceled' | 'failed'

/** Razones de Mediabunny para descartar pistas → el motivo que se le explica a la persona. */
export function failureFromDiscards(reasons: string[], wanted: 'audio' | 'video' | 'any'): MediaFailure {
  if (reasons.some((r) => r === 'no_encodable_target_codec')) return 'no-codec'
  if (reasons.some((r) => r === 'undecodable_source_codec' || r === 'unknown_source_codec')) return 'unsupported-file'
  if (wanted === 'audio') return 'no-audio'
  if (wanted === 'video') return 'no-video'
  return 'failed'
}

/** Si la versión comprimida no es más liviana, se devuelve la original. */
export const keepSmaller = (before: number, after: number) => after < before

/* ───────────── W-146.9 ───────────── */

/**
 * Recortar sin dejar nada escondido: si el inicio no cae en un fotograma clave, copiar el video
 * arrastraría desde el clave anterior (con tiempos negativos, que no se ven pero siguen en el
 * archivo). En ese caso hay que recomprimir. `key`: el tiempo del clave anterior al inicio.
 */
export const trimNeedsReencode = (start: number, key: number | null) => start > 0.02 && (key === null || start - key > 0.02)

/** Tamaños máximos más pedidos, en MB (lo que acepta cada servicio para enviar un video). */
export const SIZE_TARGETS = [
  { id: 'discord', mb: 10 },
  { id: 'whatsapp', mb: 16 },
  { id: 'correo', mb: 25 },
] as const
export type SizeTargetId = (typeof SIZE_TARGETS)[number]['id']

export type BitratePlan = { videoBps: number; audioBps: number; maxHeight: MaxHeight }

/**
 * Cuántos bits por segundo dar al video y al audio para que el archivo entre en `targetBytes`
 * (con un 4 % de margen para el contenedor), y a qué alto bajarlo para que con esa tasa se vea
 * bien. null si ni así alcanza (menos de 100 kbit/s para el video).
 */
export function bitratePlan(targetBytes: number, duration: number, hasAudio: boolean): BitratePlan | null {
  if (!(duration > 0) || !(targetBytes > 0)) return null
  const total = (targetBytes * 8 * 0.96) / duration
  const audioBps = !hasAudio ? 0 : total >= 1_000_000 ? 128_000 : total >= 400_000 ? 96_000 : 48_000
  const videoBps = Math.floor(total - audioBps)
  if (videoBps < 100_000) return null
  const maxHeight: MaxHeight = videoBps < 700_000 ? 480 : videoBps < 1_600_000 ? 720 : videoBps < 4_000_000 ? 1080 : 0
  return { videoBps, audioBps, maxHeight }
}

/** Un tamaño achicado por `k`, en números pares (los códecs lo piden). */
export const shrinkSize = (w: number, h: number, k: number) => ({ width: Math.max(2, Math.round((w * k) / 2) * 2), height: Math.max(2, Math.round((h * k) / 2) * 2) })

/** Si el resultado se pasó del tamaño (los codificadores no son exactos), la tasa para reintentar. */
export const retryBitrate = (bps: number, got: number, target: number) => Math.max(50_000, Math.floor(bps * (target / got) * 0.92))

/* Girar video */
export type VideoRotation = 0 | 90 | 180 | 270
export const rotateVideo = (r: VideoRotation, deg: 90 | -90): VideoRotation => ((((r + deg) % 360) + 360) % 360) as VideoRotation

/* Video a GIF */
export const GIF_WIDTHS = [320, 480, 640] as const
export const GIF_FPS = [10, 15] as const
/** Duración máxima de un GIF (más pesaría demasiado). */
export const GIF_MAX_SECONDS = 30

/** Los instantes (en segundos) de cada cuadro del GIF entre `start` y `end`, a `fps` cuadros por segundo. */
export function gifFrameTimes(start: number, end: number, fps: number): number[] {
  const last = Math.min(end, start + GIF_MAX_SECONDS)
  const step = 1 / fps
  const out: number[] = []
  for (let t = start; t < last - 1e-6; t = Math.round((t + step) * 1000) / 1000) out.push(t)
  return out
}

/** Alto del GIF para un ancho dado, conservando la proporción (par, mínimo 2). */
export const gifHeight = (width: number, srcW: number, srcH: number) => Math.max(2, Math.round((width * srcH) / Math.max(1, srcW) / 2) * 2)
