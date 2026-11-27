/**
 * Opciones que el asistente deja puestas en una herramienta (W-151.5): «comprime este pdf a 2 MB» abre
 * Comprimir PDF con 2 MB ya elegido. Interfaz común para todas las herramientas, sin pasar por la URL:
 * nada queda en el historial ni en los registros del servidor.
 *
 * - Se guardan en sessionStorage (solo esta pestaña) por 60 segundos, para sobrevivir a la navegación
 *   de una página del sitio a la app.
 * - Si la herramienta ya está abierta en la misma página, se le avisa con un evento.
 * - La herramienta las toma una sola vez (`takeToolOptions` las borra).
 * - La contraseña nunca se guarda: la persona la escribe en la herramienta.
 */
import { useEffect, useRef } from 'react'
import type { Options } from '../../features/assistant/core/actions'

const KEY = 'ds-tool-options'
export const TOOL_OPTIONS_EVENT = 'ds-tool-options'
/** Tiempo máximo entre que se pulsa «Hacer» y que la herramienta se abre. */
export const TOOL_OPTIONS_MAX_AGE_MS = 60_000

/**
 * Herramientas que ya aplican opciones del asistente. Para las demás el asistente no muestra la tarjeta
 * «Hacer»: abre la herramienta como siempre (y nunca promete algo que no va a hacer).
 */
export const TOOLS_RECEIVING_OPTIONS: ReadonlySet<string> = new Set(['comprimir-pdf', 'dividir-pdf', 'rotar-pdf', 'redimensionar-imagen'])

type Stored = { tool: string; options: Options; at: number }

const storage = (): Storage | null => {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

/** Deja las opciones para una herramienta (sin la contraseña) y avisa por si ya está abierta. */
export function setToolOptions(tool: string, options: Options, now = Date.now()): void {
  const { password: _never, ...safe } = options
  const value: Stored = { tool, options: safe, at: now }
  try {
    storage()?.setItem(KEY, JSON.stringify(value))
  } catch {
    /* sin almacenamiento: la herramienta se abre sin opciones */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(TOOL_OPTIONS_EVENT, { detail: { tool } }))
}

/** Toma (y borra) las opciones de esa herramienta, si son recientes. */
export function takeToolOptions(tool: string, now = Date.now()): Options | null {
  const s = storage()
  let raw: string | null = null
  try {
    raw = s?.getItem(KEY) ?? null
  } catch {
    return null
  }
  if (!raw) return null
  let value: Stored
  try {
    value = JSON.parse(raw) as Stored
  } catch {
    s?.removeItem(KEY)
    return null
  }
  if (value.tool !== tool) return null
  s?.removeItem(KEY)
  return now - value.at <= TOOL_OPTIONS_MAX_AGE_MS ? value.options : null
}

/**
 * En una herramienta: aplica las opciones del asistente al abrirse y cada vez que llegan otras con la
 * herramienta ya abierta. `apply` recibe las opciones solo si hay alguna.
 */
export function useAssistantOptions(tool: string, apply: (options: Options) => void): void {
  const latest = useRef(apply)
  latest.current = apply
  useEffect(() => {
    const take = () => {
      const o = takeToolOptions(tool)
      if (o && Object.keys(o).length) latest.current(o)
    }
    take()
    const onEvent = (e: Event) => (e as CustomEvent<{ tool: string }>).detail?.tool === tool && take()
    window.addEventListener(TOOL_OPTIONS_EVENT, onEvent)
    return () => window.removeEventListener(TOOL_OPTIONS_EVENT, onEvent)
  }, [tool])
}
