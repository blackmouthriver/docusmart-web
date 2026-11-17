/**
 * Identificadores públicos de las apps OAuth de DocuSmart (no son secretos: van en
 * la URL de autorización que ve cualquier usuario). Vacío = el botón no aparece.
 *
 * - Google Drive: ID de cliente OAuth tipo "Aplicación web" del proyecto de Firebase,
 *   con origen https://docusmart.online y URI de redirección https://docusmart.online/oauth.
 * - Dropbox: clave de app (App key) con acceso "App folder", permiso files.content.write
 *   y URI de redirección https://docusmart.online/oauth.
 */
export const GOOGLE_CLIENT_ID = ''
export const DROPBOX_APP_KEY = ''
