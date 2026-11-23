/**
 * Generador de contraseñas (W-113) con el generador criptográfico del navegador
 * (crypto.getRandomValues), sin sesgo (rechazo de valores fuera de rango) y con al menos
 * un carácter de cada tipo elegido. Nada se guarda ni se envía.
 */

/** `exclude`: caracteres que un sitio no acepta (auditoría W-146.12). */
export type PasswordOptions = { length: number; lower: boolean; upper: boolean; digits: boolean; symbols: boolean; avoidAmbiguous: boolean; exclude?: string }
export type Strength = 'weak' | 'fair' | 'strong' | 'veryStrong'
export type Rng = (buf: Uint32Array<ArrayBuffer>) => Uint32Array<ArrayBuffer>

export const MIN_LENGTH = 6
// Como Bitwarden (antes 64).
export const MAX_LENGTH = 128
export const DEFAULT_PASSWORD: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false }

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%&*-_=+?.:;,~^()[]{}',
}
// Se confunden al leerlos o copiarlos a mano.
const AMBIGUOUS = /[Il1O0o]/g

export const clampLength = (n: number) => Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Number.isFinite(n) ? Math.round(n) : DEFAULT_PASSWORD.length))

/** Los grupos de caracteres elegidos (vacío si no se eligió ninguno). */
export function pools(o: PasswordOptions): string[] {
  const skip = new Set(Array.from(o.exclude ?? ''))
  return (Object.keys(SETS) as Array<keyof typeof SETS>)
    .filter((k) => o[k])
    .map((k) => Array.from(o.avoidAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]).filter((c) => !skip.has(c)).join(''))
    .filter(Boolean)
}

const cryptoRng: Rng = (buf) => crypto.getRandomValues(buf)

/** Entero uniforme en [0, max) sin sesgo de módulo. */
export function randomInt(max: number, rng: Rng = cryptoRng): number {
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  for (;;) {
    const v = rng(buf)[0]
    if (v < limit) return v % max
  }
}

export function generatePassword(o: PasswordOptions, rng: Rng = cryptoRng): string {
  const groups = pools(o)
  if (!groups.length) return ''
  const length = clampLength(o.length)
  const all = groups.join('')
  const chars = groups.map((g) => g[randomInt(g.length, rng)])
  while (chars.length < length) chars.push(all[randomInt(all.length, rng)])
  // Mezcla (Fisher–Yates) para que los obligatorios no queden siempre al principio.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.slice(0, length).join('')
}

/** Entropía en bits: largo × log₂(tamaño del alfabeto). */
export function entropyBits(o: PasswordOptions): number {
  const size = pools(o).join('').length
  return size ? Math.round(clampLength(o.length) * Math.log2(size)) : 0
}

export function strength(bits: number): Strength {
  if (bits < 45) return 'weak'
  if (bits < 65) return 'fair'
  if (bits < 90) return 'strong'
  return 'veryStrong'
}

/* ───────────── Frase de contraseña (auditoría W-146.12) ───────────── */

export type PassphraseOptions = { words: number; separator: string; capitalize: boolean; number: boolean }
export const MIN_WORDS = 3
export const MAX_WORDS = 12
export const DEFAULT_PASSPHRASE: PassphraseOptions = { words: 6, separator: '-', capitalize: true, number: true }
export const SEPARATORS = ['-', '.', '_', ' ', ','] as const

export const clampWords = (n: number) => Math.min(MAX_WORDS, Math.max(MIN_WORDS, Number.isFinite(n) ? Math.round(n) : DEFAULT_PASSPHRASE.words))

/**
 * Frase de palabras al azar de la lista (como Bitwarden y 1Password): más fácil de recordar y
 * de escribir que una contraseña con símbolos. Con `number`, una cifra pegada a una palabra al azar.
 */
export function generatePassphrase(o: PassphraseOptions, list: readonly string[], rng: Rng = cryptoRng): string {
  if (!list.length) return ''
  const words = Array.from({ length: clampWords(o.words) }, () => list[randomInt(list.length, rng)])
  const cased = o.capitalize ? words.map((w) => w.charAt(0).toLocaleUpperCase() + w.slice(1)) : words
  if (o.number) {
    const i = randomInt(cased.length, rng)
    cased[i] += String(randomInt(10, rng))
  }
  return cased.join(o.separator)
}

/** Entropía de la frase: palabras × log₂(tamaño de la lista), más la cifra y su posición. */
export function passphraseBits(o: PassphraseOptions, listSize: number): number {
  if (!listSize) return 0
  const n = clampWords(o.words)
  return Math.round(n * Math.log2(listSize) + (o.number ? Math.log2(10) + Math.log2(n) : 0))
}

/** Lista de palabras según el idioma: español para es, ca, eu; inglés para los demás. */
export const passphraseLang = (uiLang: string): 'es' | 'en' => (['es', 'ca', 'eu'].includes(uiLang) ? 'es' : 'en')
