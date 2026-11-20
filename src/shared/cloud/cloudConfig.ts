/**
 * Identificadores públicos de las apps OAuth de DocuSmart (no son secretos: van en
 * la URL de autorización que ve cualquier usuario). Vacío = el botón no aparece.
 *
 * - Google Drive: ID de cliente OAuth tipo "Aplicación web" del proyecto de Firebase,
 *   con origen https://docusmart.online y URI de redirección https://docusmart.online/oauth.
 * - Dropbox: clave de app (App key) con acceso "App folder", permiso files.content.write
 *   y URI de redirección https://docusmart.online/oauth.
 */
export const GOOGLE_CLIENT_ID = '218283287852-big4u5cam8bg464ddtgs6s434ja4f7nj.apps.googleusercontent.com'
// Clave PÚBLICA de la app (cliente público con PKCE, va en la URL de autorización); el secreto
// de la app nunca se usa. gitleaks la confunde con un token: se marca como permitida
// (autorizado por el dueño del proyecto el 2026-11-20).
export const DROPBOX_APP_KEY = '41ysmh5vbi68o2t' // gitleaks:allow
