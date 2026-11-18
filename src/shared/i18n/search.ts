/**
 * Búsqueda tolerante para listas cortas (W-78, buscador de herramientas): sin
 * mayúsculas ni tildes ("pdf a word" encuentra "PDF a Word", "imagenes" encuentra
 * "imágenes") y cada palabra buscada debe aparecer en algún lugar del texto.
 */

/** Minúsculas y sin marcas diacríticas, para comparar sin importar tildes ni mayúsculas. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Palabras de la búsqueda, ya normalizadas. */
export const queryTokens = (query: string): string[] => normalizeForSearch(query).split(' ').filter(Boolean)

/** true si todas las palabras de la búsqueda aparecen en el texto (una búsqueda vacía coincide con todo). */
export function matchesQuery(haystack: string, query: string): boolean {
  const text = normalizeForSearch(haystack)
  return queryTokens(query).every((t) => text.includes(t))
}

/** Ordena por nombre según el idioma (alfabético "de verdad": tildes, ñ, kana, hangul…). */
export function sortByName<T>(items: readonly T[], name: (item: T) => string, lang: string): T[] {
  const collator = new Intl.Collator(lang, { sensitivity: 'base', numeric: true })
  return [...items].sort((a, b) => collator.compare(name(a), name(b)))
}
