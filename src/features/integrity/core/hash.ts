/**
 * Hash e integridad de archivos (W-105): todo se calcula en el dispositivo.
 * SHA-1, SHA-256 y SHA-512 vienen del navegador (Web Crypto); MD5 no está en
 * Web Crypto y se calcula aquí (solo por compatibilidad con sumas publicadas,
 * no sirve como garantía de seguridad).
 */

export type HashAlgorithm = 'SHA-256' | 'SHA-512' | 'SHA-1' | 'MD5'

/** En el orden en que se ofrecen (el primero es el recomendado). */
export const ALGORITHMS: readonly HashAlgorithm[] = ['SHA-256', 'SHA-512', 'SHA-1', 'MD5']

/** Largo en caracteres hexadecimales de cada algoritmo. */
const HEX_LENGTH: Record<HashAlgorithm, number> = { MD5: 32, 'SHA-1': 40, 'SHA-256': 64, 'SHA-512': 128 }

export function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const b of bytes) out += b.toString(16).padStart(2, '0')
  return out
}

/** Hash en hexadecimal (minúsculas) de los bytes. */
export async function hashBytes(data: Uint8Array, algorithm: HashAlgorithm, subtle: SubtleCrypto = globalThis.crypto.subtle): Promise<string> {
  if (algorithm === 'MD5') return md5(data)
  const digest = await subtle.digest(algorithm, data as Uint8Array<ArrayBuffer>)
  return toHex(new Uint8Array(digest))
}

export async function hashFile(file: Blob, algorithm: HashAlgorithm): Promise<string> {
  return hashBytes(new Uint8Array(await file.arrayBuffer()), algorithm)
}

/**
 * Lo que pegó el usuario, listo para comparar: sin espacios, en minúsculas y sin
 * el nombre del archivo que traen las líneas de sha256sum ("<hash>  archivo.pdf")
 * ni prefijos como "sha256:".
 */
export function normalizeHash(input: string): string {
  const first = input.trim().split(/\s+/)[0] ?? ''
  return first.replace(/^(?:sha-?(?:1|256|512)|md5)[:=]/i, '').toLowerCase()
}

/** Algoritmo que corresponde al hash pegado según su largo, o null si no parece un hash. */
export function detectAlgorithm(input: string): HashAlgorithm | null {
  const h = normalizeHash(input)
  if (!/^[0-9a-f]+$/.test(h)) return null
  return ALGORITHMS.find((a) => HEX_LENGTH[a] === h.length) ?? null
}

/** ¿El hash calculado coincide con el pegado? (sin importar mayúsculas ni espacios). */
export function hashesMatch(computed: string, expected: string): boolean {
  return normalizeHash(computed) === normalizeHash(expected)
}

export type HashResult = { name: string; size: number; hash: string }

/**
 * Lista en el formato de sha256sum / md5sum ("<hash>  <nombre>"), que también
 * entienden `sha256sum -c` y la mayoría de verificadores.
 */
export function checksumText(results: readonly HashResult[]): string {
  return results.map((r) => `${r.hash}  ${r.name}`).join('\n') + '\n'
}

/** Nombre sugerido para la lista: "hashes.sha256", "hashes.md5"… */
export function checksumFileName(algorithm: HashAlgorithm): string {
  return `hashes.${algorithm.replace('-', '').toLowerCase()}`
}

// ── MD5 (RFC 1321) ─────────────────────────────────────────────────────
const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0)

export function md5(data: Uint8Array): string {
  // Relleno: 0x80, ceros y el largo en bits (64 bits, little-endian).
  const len = data.length
  const padded = new Uint8Array((((len + 8) >>> 6) + 1) << 6)
  padded.set(data)
  padded[len] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, (len << 3) >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(len / 0x20000000), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476
  const m = new Uint32Array(16)
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) m[i] = view.getUint32(off + i * 4, true)
    let a = a0
    let b = b0
    let c = c0
    let d = d0
    for (let i = 0; i < 64; i++) {
      let f: number
      let g: number
      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }
      const tmp = d
      d = c
      c = b
      const x = (a + f + K[i] + m[g]) >>> 0
      b = (b + ((x << S[i]) | (x >>> (32 - S[i])))) >>> 0
      a = tmp
    }
    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }
  const out = new Uint8Array(16)
  const ov = new DataView(out.buffer)
  ;[a0, b0, c0, d0].forEach((w, i) => ov.setUint32(i * 4, w, true))
  return toHex(out)
}
