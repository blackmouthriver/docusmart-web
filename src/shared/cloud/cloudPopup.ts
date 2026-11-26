// Partes de "Guardar en Drive / Dropbox" que necesitan ventanas del navegador
// (excluidas de la cobertura, como ocrSources.ts).
//
// La autorización se abre en una ventana emergente que vuelve a /oauth. Como el
// sitio usa Cross-Origin-Opener-Policy: same-origin, al pasar por Google o Dropbox
// la ventana pierde el `opener`; por eso /oauth avisa con un BroadcastChannel
// (solo llega a pestañas del mismo origen). El token queda en memoria: se pierde al
// cerrar la pestaña y nunca se guarda en el navegador ni se envía a DocuSmart.
import { DROPBOX_APP_KEY, GOOGLE_CLIENT_ID } from './cloudConfig'
import {
  CloudAuthError,
  dropboxAuthUrl,
  exchangeDropboxCode,
  googleAuthUrl,
  parseCallback,
  pkceChallenge,
  randomToken,
  ensureDriveFolder,
  uploadToDrive,
  uploadToDropbox,
  type OAuthCallback,
} from './cloudSave'

export const driveEnabled = () => !!GOOGLE_CLIENT_ID
export const dropboxEnabled = () => !!DROPBOX_APP_KEY
const redirectUri = () => `${location.origin}/oauth`

/** El usuario cerró la ventana o no autorizó. */
export class CloudCancelled extends Error {
  constructor() {
    super('No se completó la autorización.')
    this.name = 'CloudCancelled'
  }
}

/** Abre la ventana ya (dentro del clic, para que no la bloqueen) y luego la lleva a `url`. */
/** El navegador bloqueó la ventana emergente. */
export class PopupBlockedError extends Error {
  constructor() {
    super('El navegador bloqueó la ventana de autorización.')
    this.name = 'PopupBlockedError'
  }
}

function openPopup(): Window {
  const w = 520
  const h = 680
  const popup = window.open('about:blank', 'docusmart-oauth', `popup=yes,width=${w},height=${h},left=${Math.max(0, (screen.width - w) / 2)},top=${Math.max(0, (screen.height - h) / 2)}`)
  if (!popup) throw new PopupBlockedError()
  return popup
}

/**
 * Espera la vuelta de la autorización por dos vías (la primera que llegue): el canal entre pestañas que publica
 * /oauth y el mensaje directo de la ventana emergente a esta (solo de nuestro origen). En Safari el canal a veces
 * no llega, por eso la segunda vía.
 */
function waitForCallback(state: string, signal?: AbortSignal): Promise<OAuthCallback> {
  return new Promise((resolve, reject) => {
    const channel = new BroadcastChannel('docusmart-oauth')
    let finished = false
    const done = () => {
      finished = true
      clearTimeout(timer)
      channel.close()
      window.removeEventListener('message', onWindowMessage)
    }
    const timer = setTimeout(() => {
      done()
      reject(new CloudCancelled())
    }, 5 * 60_000)
    signal?.addEventListener('abort', () => {
      done()
      reject(new CloudCancelled())
    })
    const handle = (href: unknown) => {
      if (finished || typeof href !== 'string') return
      const cb = parseCallback(href)
      if (cb.state !== state) return
      done()
      if (cb.error) reject(new CloudCancelled())
      else resolve(cb)
    }
    const onWindowMessage = (e: MessageEvent<{ type?: string; href?: string }>) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'docusmart-oauth') return
      handle(e.data.href)
    }
    channel.onmessage = (e: MessageEvent<{ href?: string }>) => handle(e.data?.href)
    window.addEventListener('message', onWindowMessage)
  })
}

let google: { token: string; until: number } | null = null
let dropbox: string | null = null

async function googleToken(signal?: AbortSignal): Promise<string> {
  if (google && google.until > Date.now() + 60_000) return google.token
  const popup = openPopup()
  const state = randomToken()
  popup.location.href = googleAuthUrl(GOOGLE_CLIENT_ID, redirectUri(), state)
  const cb = await waitForCallback(state, signal)
  if (!cb.accessToken) throw new CloudCancelled()
  google = { token: cb.accessToken, until: Date.now() + (cb.expiresIn ?? 3600) * 1000 }
  return google.token
}

async function dropboxToken(signal?: AbortSignal): Promise<string> {
  if (dropbox) return dropbox
  const popup = openPopup()
  const state = randomToken()
  const verifier = randomToken(48)
  popup.location.href = dropboxAuthUrl(DROPBOX_APP_KEY, redirectUri(), state, await pkceChallenge(verifier))
  const cb = await waitForCallback(state, signal)
  if (!cb.code) throw new CloudCancelled()
  dropbox = await exchangeDropboxCode({ code: cb.code, verifier, appKey: DROPBOX_APP_KEY, redirectUri: redirectUri() })
  return dropbox
}

/** ID de la carpeta "DocuSmart" ya encontrada en esta visita (solo en memoria). */
let driveFolder: string | undefined

export async function saveToDrive(file: File, signal?: AbortSignal) {
  try {
    const token = await googleToken(signal)
    // Los archivos van a la carpeta "DocuSmart"; si no se puede preparar, a la raíz (nunca se pierde el guardado).
    try {
      driveFolder = await ensureDriveFolder(token, driveFolder)
    } catch (e) {
      if (e instanceof CloudAuthError) throw e
      driveFolder = undefined
    }
    return await uploadToDrive(file, token, fetch, driveFolder)
  } catch (e) {
    if (e instanceof CloudAuthError) google = null
    throw e
  }
}

export async function saveToDropbox(file: File, signal?: AbortSignal) {
  try {
    return await uploadToDropbox(file, await dropboxToken(signal))
  } catch (e) {
    if (e instanceof CloudAuthError) dropbox = null
    throw e
  }
}
