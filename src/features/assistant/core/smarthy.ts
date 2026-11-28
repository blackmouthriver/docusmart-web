/**
 * Smarthy, el asistente animado (W-153, prototipo con poses): qué pose mostrar según lo que pasa en la
 * pantalla. Lógica pura (sin DOM): el botón flotante y el panel solo pintan la pose que sale de aquí.
 *
 * Las poses son imágenes WebP transparentes en `public/smarthy/`. Cuando llegue el `.riv` de Rive, estas
 * mismas señales pasarán a ser los inputs de su máquina de estados (ver docs/SMARTHY_RIVE.md).
 */

export const SMARTHY_POSES = [
  'idle', 'curious', 'wave', 'scan', 'success', 'error', 'convert', 'sign', 'idea', 'talk', 'listen', 'point', 'laugh',
] as const
export type Pose = (typeof SMARTHY_POSES)[number]

/** Ruta pública de una pose (las páginas viven en distintas carpetas: siempre desde la raíz). */
export const smarthySrc = (pose: Pose): string => `/smarthy/${pose}.webp`

/** Cuánto dura cada pose pasajera antes de volver a la de fondo. */
export const FLASH_MS = { success: 1800, error: 2500, wave: 1500, curious: 1100 } as const
export type FlashPose = keyof typeof FLASH_MS

/** Cada cuánto, en reposo, guiña un ojo (entre MIN y MIN + SPREAD). */
export const IDLE_BLINK_MIN_MS = 6000
export const IDLE_BLINK_SPREAD_MS = 5000

/**
 * Pose de «trabajando» según la herramienta (slug de la página o ruta de la app). Por palabras, en español
 * e inglés, porque llegan tanto `firmar-pdf` como `sign-pdf` o `#/pdf/firmar`.
 */
export function busyPoseFor(tool = ''): Pose {
  const t = tool.toLowerCase()
  if (/firm|sign|edit|censur|redact|formul|fill|llenar/.test(t)) return 'sign'
  if (/ocr|estudi|study|resum|summar|leer|read|texto|text|audio/.test(t)) return 'idea'
  if (/conver|word|excel|ppt|docx|xlsx|jpg|png|webp|heic|a-pdf|to-pdf|pdf-a-|pdf-to/.test(t)) return 'convert'
  return 'scan'
}

import type { MoodSignal } from '../../../shared/platform/mood'

export type FabState = {
  /** Cuántos procesos siguen en marcha (botones ocupados, barras de progreso). */
  busy: number
  /** Pose pasajera y hasta cuándo dura. */
  flash: { pose: FlashPose; until: number } | null
}

export const initialFab: FabState = { busy: 0, flash: null }

export function flash(state: FabState, pose: FlashPose, now: number): FabState {
  return { ...state, flash: { pose, until: now + FLASH_MS[pose] } }
}

export function fabReduce(state: FabState, signal: MoodSignal, now: number): FabState {
  switch (signal) {
    case 'busy-start':
      return { ...state, busy: state.busy + 1 }
    case 'busy-end':
      return { ...state, busy: Math.max(0, state.busy - 1) }
    case 'success':
      return flash(state, 'success', now)
    case 'error':
      return flash(state, 'error', now)
  }
}

/**
 * Pose del botón. Prioridad: éxito/error > trabajando > saludo (mouse encima) > guiño > reposo.
 * El error y el éxito ganan a «trabajando» porque suelen llegar justo cuando el proceso termina.
 */
export function fabPose(state: FabState, opts: { now: number; hover?: boolean; tool?: string }): Pose {
  const live = state.flash && state.flash.until > opts.now ? state.flash.pose : null
  if (live === 'success' || live === 'error') return live
  if (state.busy > 0) return busyPoseFor(opts.tool)
  if (opts.hover || live === 'wave') return 'wave'
  if (live === 'curious') return 'curious'
  return 'idle'
}

/** Cuánto «habla» una respuesta: según su largo, entre 1,2 y 4,5 s. */
export function talkDuration(chars: number): number {
  return Math.min(4500, Math.max(1200, chars * 28))
}

/** Mientras habla alterna gestos para que no se vea quieto: explica, señala, explica, ríe… */
const TALK_CYCLE: readonly Pose[] = ['talk', 'point', 'talk', 'idea']
export const TALK_STEP_MS = 650
export function talkPose(elapsed: number): Pose {
  return TALK_CYCLE[Math.floor(Math.max(0, elapsed) / TALK_STEP_MS) % TALK_CYCLE.length]
}

/**
 * Pose del avatar del panel. Prioridad: hablando (respuesta nueva) > pensando (escribiendo…) >
 * escuchando (la persona escribe) > error en pantalla > reposo.
 */
export function panelPose(opts: {
  now: number
  /** Desde cuándo y hasta cuándo habla (respuesta recién llegada). */
  talk?: { from: number; until: number } | null
  thinking?: boolean
  listening?: boolean
  greeting?: boolean
  error?: boolean
}): Pose {
  if (opts.talk && opts.now < opts.talk.until) return talkPose(opts.now - opts.talk.from)
  if (opts.thinking) return 'idea'
  if (opts.listening) return 'listen'
  if (opts.error) return 'error'
  if (opts.greeting) return 'wave'
  return 'idle'
}
