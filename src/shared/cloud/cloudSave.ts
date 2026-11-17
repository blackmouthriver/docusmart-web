/**
 * Guardar el resultado directamente en Google Drive o Dropbox, sin SDK (la CSP no
 * admite sus scripts): OAuth en una ventana emergente y subida con fetch. El archivo
 * va del navegador a la cuenta del usuario; los servidores de DocuSmart no lo ven.
 *
 * Permisos mínimos:
 * - Drive: `drive.file` (DocuSmart solo ve los archivos que él mismo crea).
 * - Dropbox: carpeta de la app (Aplicaciones/DocuSmart).
 */

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink'
export const DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token'
export const DROPBOX_UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload'

/** El permiso venció o se revocó: hay que volver a autorizar. */
export class CloudAuthError extends Error {
  constructor() {
    super('La autorización venció. Vuelve a intentarlo.')
    this.name = 'CloudAuthError'
  }
}

export function base64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Cadena aleatoria segura (state, verificador PKCE). */
export const randomToken = (bytes = 32) => base64url(crypto.getRandomValues(new Uint8Array(bytes)))

/** Desafío PKCE S256 del verificador. */
export async function pkceChallenge(verifier: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
}

export function googleAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'token', scope: DRIVE_SCOPE, state, include_granted_scopes: 'true' })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

export function dropboxAuthUrl(appKey: string, redirectUri: string, state: string, challenge: string): string {
  const q = new URLSearchParams({ client_id: appKey, redirect_uri: redirectUri, response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', state, token_access_type: 'online' })
  return `https://www.dropbox.com/oauth2/authorize?${q}`
}

export type OAuthCallback = { state?: string; accessToken?: string; expiresIn?: number; code?: string; error?: string }

/** Lo que vuelve a /oauth: Google en el fragmento (#), Dropbox en la consulta (?). */
export function parseCallback(href: string): OAuthCallback {
  const url = new URL(href)
  const p = new URLSearchParams(url.hash.slice(1) || url.search.slice(1))
  const expires = Number(p.get('expires_in'))
  return {
    state: p.get('state') ?? undefined,
    accessToken: p.get('access_token') ?? undefined,
    expiresIn: Number.isFinite(expires) && expires > 0 ? expires : undefined,
    code: p.get('code') ?? undefined,
    error: p.get('error') ?? undefined,
  }
}

/** Cuerpo multipart/related de Drive: metadatos JSON + el archivo. */
export function driveMultipart(file: File, boundary: string): Blob {
  const meta = JSON.stringify({ name: file.name, mimeType: file.type || 'application/octet-stream' })
  return new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ])
}

type Fetch = typeof fetch

async function check(res: Response, what: string) {
  if (res.status === 401) throw new CloudAuthError()
  if (!res.ok) throw new Error(`No se pudo guardar en ${what} (${res.status}).`)
}

export async function uploadToDrive(file: File, token: string, fetchFn: Fetch = fetch): Promise<{ id: string; name: string; link?: string }> {
  const boundary = `docusmart-${randomToken(12)}`
  const res = await fetchFn(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: driveMultipart(file, boundary),
  })
  await check(res, 'Google Drive')
  const j = (await res.json()) as { id: string; name: string; webViewLink?: string }
  return { id: j.id, name: j.name, link: j.webViewLink }
}

/** Dropbox-API-Arg va en una cabecera HTTP: solo ASCII, el resto como \uXXXX. */
export function dropboxApiArg(path: string): string {
  return JSON.stringify({ path, mode: 'add', autorename: true, mute: false }).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

export async function exchangeDropboxCode(o: { code: string; verifier: string; appKey: string; redirectUri: string }, fetchFn: Fetch = fetch): Promise<string> {
  const res = await fetchFn(DROPBOX_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: o.code, grant_type: 'authorization_code', code_verifier: o.verifier, client_id: o.appKey, redirect_uri: o.redirectUri }),
  })
  await check(res, 'Dropbox')
  return ((await res.json()) as { access_token: string }).access_token
}

export async function uploadToDropbox(file: File, token: string, fetchFn: Fetch = fetch): Promise<{ path: string }> {
  const res = await fetchFn(DROPBOX_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': dropboxApiArg(`/${file.name}`) },
    body: file,
  })
  await check(res, 'Dropbox')
  return { path: ((await res.json()) as { path_display: string }).path_display }
}
