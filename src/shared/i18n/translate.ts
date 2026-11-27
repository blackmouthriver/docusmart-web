// Traducción sin dependencias: diccionario del idioma y variables {así}. Todos los
// diccionarios (también el español) se descargan bajo demanda: cada página carga solo el
// de su idioma (antes el español iba siempre incluido, unos 90 KB de más fuera de español).
// Las pruebas exigen que cada idioma tenga todas las claves, así que no hace falta respaldo.
import type { MessageKey, Messages } from './messages/es'
import type { Lang } from './languages'

export type Dict = Partial<Messages>
export type Vars = Record<string, string | number>

/** Diccionario del idioma actual, para funciones que no son componentes (mensajes de error, resúmenes). */
let current: Dict = {}
export const setCurrentDict = (d: Dict) => {
  current = d
}
export const tr = (key: MessageKey, vars?: Vars) => translate(current, key, vars)

export function translate(dict: Dict, key: MessageKey, vars?: Vars): string {
  const text = dict[key] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text
}

const LOADERS: Record<Lang, () => Promise<{ default: Dict }>> = {
  es: () => import('./messages/es').then((m) => ({ default: m.es })),
  en: () => import('./messages/en'),
  pt: () => import('./messages/pt'),
  de: () => import('./messages/de'),
  ru: () => import('./messages/ru'),
  ja: () => import('./messages/ja'),
  ko: () => import('./messages/ko'),
  zh: () => import('./messages/zh'),
  it: () => import('./messages/it'),
  fr: () => import('./messages/fr'),
  ca: () => import('./messages/ca'),
  eu: () => import('./messages/eu'),
}

/** En Mac los atajos se escriben con ⌘ (W-150): "Ctrl+V" o "Strg+V" pasan a "⌘+V". El código ya acepta ⌘. */
export function withMacKeys(dict: Dict): Dict {
  const out: Dict = {}
  for (const [k, v] of Object.entries(dict) as Array<[MessageKey, string]>) out[k] = v.replace(/\b(?:Ctrl|Strg)(\s?\+\s?)/g, '⌘$1')
  return out
}

const isMac = () => typeof navigator !== 'undefined' && /Macintosh|Mac OS X/.test(navigator.userAgent) && !/iPhone|iPad/.test(navigator.userAgent)

/** Diccionario del idioma. Sin conexión al cambiar de idioma, se sigue con el actual. */
export async function loadMessages(lang: Lang): Promise<Dict> {
  try {
    const dict = (await LOADERS[lang]()).default
    return isMac() ? withMacKeys(dict) : dict
  } catch {
    return current
  }
}
