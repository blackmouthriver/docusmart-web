// Traducción sin dependencias: diccionario del idioma con el español de respaldo
// y variables {así}. Los diccionarios que no son español se descargan bajo demanda.
import { es, type MessageKey, type Messages } from './messages/es'
import type { Lang } from './languages'

export type Dict = Partial<Messages>
export type Vars = Record<string, string | number>

export function translate(dict: Dict, key: MessageKey, vars?: Vars): string {
  const text = dict[key] ?? es[key] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text
}

const LOADERS: Record<Exclude<Lang, 'es'>, () => Promise<{ default: Dict }>> = {
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

/** Diccionario del idioma (el español ya viene incluido). */
export async function loadMessages(lang: Lang): Promise<Dict> {
  if (lang === 'es') return es
  try {
    return (await LOADERS[lang]()).default
  } catch {
    return es // sin conexión al cambiar de idioma: se sigue en español
  }
}
