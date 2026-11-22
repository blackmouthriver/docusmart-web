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

/** Diccionario del idioma. Sin conexión al cambiar de idioma, se sigue con el actual. */
export async function loadMessages(lang: Lang): Promise<Dict> {
  try {
    return (await LOADERS[lang]()).default
  } catch {
    return current
  }
}
