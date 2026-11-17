/**
 * Port web de `QrCrypto.kt` (app Android). Mismo formato, así un QR
 * protegido creado en la web se abre en la app y viceversa:
 *
 *   "PROTECTED:" + Base64( salt[16] + iv[12] + ciphertext+tag[16] )
 *   AES-256-GCM, clave = PBKDF2-HMAC-SHA256(contraseña, salt, 100 000 iteraciones)
 */
export const PREFIX = 'PROTECTED:'

const ITERATIONS = 100_000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const TAG_LENGTH = 16

const toB64 = (bytes: Uint8Array) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

const fromB64 = (b64: string): Uint8Array | null => {
  try {
    const s = atob(b64.trim())
    const out = new Uint8Array(s.length)
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

async function deriveKey(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Devuelve el Base64 sin prefijo, igual que `QrCrypto.encrypt`. */
export async function encrypt(content: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: TAG_LENGTH * 8 }, key, new TextEncoder().encode(content)),
  )
  const combined = new Uint8Array(salt.length + iv.length + cipher.length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(cipher, salt.length + iv.length)
  return toB64(combined)
}

/** Igual que `QrCrypto.isProtectedPayload`: prefijo + Base64 válido + largo mínimo. */
export function isProtectedPayload(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith(PREFIX)) return false
  const decoded = fromB64(trimmed.slice(PREFIX.length))
  return decoded !== null && decoded.length >= SALT_LENGTH + IV_LENGTH + TAG_LENGTH
}

/** Contenido original, o null si la contraseña es incorrecta o los datos están corruptos. */
export async function decrypt(encoded: string, password: string): Promise<string | null> {
  const combined = fromB64(encoded)
  if (!combined || combined.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) return null
  try {
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const key = await deriveKey(password, salt)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: TAG_LENGTH * 8 },
      key,
      combined.slice(SALT_LENGTH + IV_LENGTH),
    )
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}
