import { describe, expect, it } from 'vitest'
import { PREFIX, decrypt, encrypt, isProtectedPayload } from './qrCrypto'

// Generado con la misma lógica JVM de QrCrypto.kt (javax.crypto, PBKDF2WithHmacSHA256, AES/GCM/NoPadding).
const ANDROID_PAYLOAD =
  '8YtLhWndL8vDiHjFARZMQOFXx+IfMTC9J2BNDVwtCbYYk2yI5WUAleR+c/sokj91NeQicBNbBUIh9zxfM0IP1ohfuIYSrsNLqwxsmlWddRY='
const ANDROID_PASSWORD = 'clave-ñ-123'
const ANDROID_TEXT = 'Hola desde Android — DocuSmart ✓'

describe('qrCrypto (compatible con la app Android)', () => {
  it('descifra un QR protegido creado por la app', async () => {
    expect(await decrypt(ANDROID_PAYLOAD, ANDROID_PASSWORD)).toBe(ANDROID_TEXT)
  })

  it('devuelve null con contraseña incorrecta', async () => {
    expect(await decrypt(ANDROID_PAYLOAD, 'otra')).toBeNull()
  })

  it('cifra y descifra ida y vuelta', async () => {
    const enc = await encrypt('https://docusmart.app', 'secreto')
    expect(await decrypt(enc, 'secreto')).toBe('https://docusmart.app')
  })

  it('detecta payloads protegidos reales y descarta texto de terceros', async () => {
    expect(isProtectedPayload(PREFIX + ANDROID_PAYLOAD)).toBe(true)
    expect(isProtectedPayload('PROTECTED: no pasar')).toBe(false)
    expect(isProtectedPayload('hola')).toBe(false)
  })

  it('devuelve null con datos corruptos', async () => {
    expect(await decrypt('no-es-base64!!', 'x')).toBeNull()
    expect(await decrypt('AAAA', 'x')).toBeNull()
  })
})
