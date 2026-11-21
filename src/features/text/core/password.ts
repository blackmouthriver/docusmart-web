/**
 * Generador de contraseñas (W-113) con el generador criptográfico del navegador
 * (crypto.getRandomValues), sin sesgo (rechazo de valores fuera de rango) y con al menos
 * un carácter de cada tipo elegido. Nada se guarda ni se envía.
 */

export type PasswordOptions = { length: number; lower: boolean; upper: boolean; digits: boolean; symbols: boolean; avoidAmbiguous: boolean }
export type Strength = 'weak' | 'fair' | 'strong' | 'veryStrong'
export type Rng = (buf: Uint32Array<ArrayBuffer>) => Uint32Array<ArrayBuffer>

export const MIN_LENGTH = 6
export const MAX_LENGTH = 64
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
  return (Object.keys(SETS) as Array<keyof typeof SETS>).filter((k) => o[k]).map((k) => (o.avoidAmbiguous ? SETS[k].replace(AMBIGUOUS, '') : SETS[k]))
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
