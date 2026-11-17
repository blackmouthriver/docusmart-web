import { describe, expect, it, vi } from 'vitest'
import {
  CloudAuthError,
  DRIVE_UPLOAD_URL,
  DROPBOX_TOKEN_URL,
  DROPBOX_UPLOAD_URL,
  base64url,
  driveMultipart,
  dropboxApiArg,
  dropboxAuthUrl,
  exchangeDropboxCode,
  googleAuthUrl,
  parseCallback,
  pkceChallenge,
  randomToken,
  uploadToDrive,
  uploadToDropbox,
} from '../../../../src/shared/cloud/cloudSave'

const file = new File([new Uint8Array([37, 80, 68, 70])], 'Año 2026.pdf', { type: 'application/pdf' })
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('OAuth', () => {
  it('base64url, tokens aleatorios y PKCE (ejemplo del RFC 7636)', async () => {
    expect(base64url(new Uint8Array([251, 255, 254]))).toBe('-__-')
    expect(randomToken()).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(randomToken()).not.toBe(randomToken())
    expect(await pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('URLs de autorización con el permiso mínimo', () => {
    const g = new URL(googleAuthUrl('cliente', 'https://docusmart.online/oauth', 'st'))
    expect(g.origin + g.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(Object.fromEntries(g.searchParams)).toMatchObject({ client_id: 'cliente', response_type: 'token', scope: 'https://www.googleapis.com/auth/drive.file', state: 'st', redirect_uri: 'https://docusmart.online/oauth' })
    const d = new URL(dropboxAuthUrl('clave', 'https://docusmart.online/oauth', 'st', 'desafio'))
    expect(d.origin + d.pathname).toBe('https://www.dropbox.com/oauth2/authorize')
    expect(Object.fromEntries(d.searchParams)).toMatchObject({ client_id: 'clave', response_type: 'code', code_challenge: 'desafio', code_challenge_method: 'S256', state: 'st' })
  })

  it('lee la vuelta de Google (#) y de Dropbox (?)', () => {
    expect(parseCallback('https://docusmart.online/oauth#access_token=abc&expires_in=3599&state=s1')).toEqual({ state: 's1', accessToken: 'abc', expiresIn: 3599, code: undefined, error: undefined })
    expect(parseCallback('https://docusmart.online/oauth?code=xyz&state=s2')).toMatchObject({ state: 's2', code: 'xyz', accessToken: undefined, expiresIn: undefined })
    expect(parseCallback('https://docusmart.online/oauth?error=access_denied&state=s3').error).toBe('access_denied')
  })
})

describe('Google Drive', () => {
  it('arma el multipart con metadatos y archivo', async () => {
    const text = await driveMultipart(file, 'B').text()
    expect(text).toContain('--B\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{"name":"Año 2026.pdf","mimeType":"application/pdf"}')
    expect(text).toContain('--B\r\nContent-Type: application/pdf\r\n\r\n%PDF\r\n--B--')
  })

  it('sube con el token y devuelve el enlace', async () => {
    const fetchFn = vi.fn(async () => json({ id: '1', name: 'Año 2026.pdf', webViewLink: 'https://drive.google.com/file/d/1/view' }))
    expect(await uploadToDrive(file, 'tok', fetchFn as typeof fetch)).toEqual({ id: '1', name: 'Año 2026.pdf', link: 'https://drive.google.com/file/d/1/view' })
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(DRIVE_UPLOAD_URL)
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect((init.headers as Record<string, string>)['Content-Type']).toMatch(/^multipart\/related; boundary=docusmart-/)
  })

  it('token vencido y otros errores', async () => {
    await expect(uploadToDrive(file, 't', (async () => json({}, 401)) as typeof fetch)).rejects.toBeInstanceOf(CloudAuthError)
    await expect(uploadToDrive(file, 't', (async () => json({}, 500)) as typeof fetch)).rejects.toThrow('No se pudo guardar en Google Drive (500).')
  })
})

describe('Dropbox', () => {
  it('la cabecera Dropbox-API-Arg queda en ASCII', () => {
    const arg = dropboxApiArg('/Año ✓.pdf')
    expect(arg).toBe('{"path":"/A\\u00f1o \\u2713.pdf","mode":"add","autorename":true,"mute":false}')
    expect(JSON.parse(arg).path).toBe('/Año ✓.pdf')
    // eslint-disable-next-line no-control-regex
    expect(/^[\x00-\x7f]*$/.test(arg)).toBe(true)
  })

  it('cambia el código por un token (PKCE) y sube a la carpeta de la app', async () => {
    const fetchFn = vi.fn(async (url: string) => (url === DROPBOX_TOKEN_URL ? json({ access_token: 'dbx' }) : json({ path_display: '/Año 2026.pdf' })))
    const token = await exchangeDropboxCode({ code: 'c', verifier: 'v', appKey: 'k', redirectUri: 'https://docusmart.online/oauth' }, fetchFn as unknown as typeof fetch)
    expect(token).toBe('dbx')
    const body = (fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1].body as URLSearchParams
    expect(Object.fromEntries(body)).toEqual({ code: 'c', grant_type: 'authorization_code', code_verifier: 'v', client_id: 'k', redirect_uri: 'https://docusmart.online/oauth' })
    expect(await uploadToDropbox(file, token, fetchFn as unknown as typeof fetch)).toEqual({ path: '/Año 2026.pdf' })
    const [url, init] = fetchFn.mock.calls[1] as unknown as [string, RequestInit]
    expect(url).toBe(DROPBOX_UPLOAD_URL)
    expect((init.headers as Record<string, string>)['Dropbox-API-Arg']).toContain('A\\u00f1o 2026.pdf')
    await expect(uploadToDropbox(file, 't', (async () => json({}, 401)) as typeof fetch)).rejects.toBeInstanceOf(CloudAuthError)
  })
})
