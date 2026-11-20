// Guardar en Google Drive (W-45): el botón aparece en el resultado y abre la autorización de
// Google en una ventana emergente, con el ID de cliente, la vuelta a /oauth y solo drive.file.
// La página de Google se simula: la prueba no sale a internet.
import { expect, makePdf, test, upload } from './helpers'

test('el resultado ofrece Google Drive y pide solo el permiso drive.file', async ({ page, context }) => {
  const isGoogle = (u: URL) => u.protocol === 'https:' && u.hostname === 'accounts.google.com'
  await context.route(isGoogle, (route) => route.fulfill({ contentType: 'text/html', body: '<title>Google</title>' }))
  await page.goto('/unir-pdf')
  await upload(page, [
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: makePdf(2) },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: makePdf(1) },
  ])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  const drive = page.getByRole('button', { name: 'Google Drive' })
  await expect(drive).toBeVisible()

  const popupPromise = context.waitForEvent('page')
  await drive.click()
  const popup = await popupPromise
  await popup.waitForURL(isGoogle)
  const url = new URL(popup.url())
  expect(url.searchParams.get('client_id')).toBe('218283287852-big4u5cam8bg464ddtgs6s434ja4f7nj.apps.googleusercontent.com')
  expect(url.searchParams.get('redirect_uri')).toMatch(/\/oauth$/)
  expect(url.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/drive.file')
  expect(url.searchParams.get('response_type')).toBe('token')
  await popup.close()
})

test('guarda dentro de la carpeta DocuSmart (la crea si no existe) y lo confirma', async ({ page, context }) => {
  const isGoogle = (u: URL) => u.protocol === 'https:' && u.hostname === 'accounts.google.com'
  const isDriveApi = (u: URL) => u.protocol === 'https:' && u.hostname === 'www.googleapis.com'
  // "Google" autoriza al instante y vuelve a /oauth con un token de prueba.
  await context.route(isGoogle, (route) => {
    const u = new URL(route.request().url())
    const back = `${u.searchParams.get('redirect_uri')}#access_token=tok&expires_in=3600&state=${u.searchParams.get('state')}`
    return route.fulfill({ contentType: 'text/html', body: `<script>location.replace(${JSON.stringify(back)})</script>` })
  })
  let uploadBody = ''
  await context.route(isDriveApi, async (route) => {
    const req = route.request()
    const u = new URL(req.url())
    if (u.pathname === '/drive/v3/files' && req.method() === 'GET') return route.fulfill({ json: { files: [] } })
    if (u.pathname === '/drive/v3/files' && req.method() === 'POST') return route.fulfill({ json: { id: 'carpeta-docusmart' } })
    if (u.pathname === '/upload/drive/v3/files') {
      uploadBody = req.postDataBuffer()?.toString('latin1') ?? ''
      return route.fulfill({ json: { id: 'f1', name: 'unido.pdf', webViewLink: 'https://drive.google.com/file/d/f1/view' } })
    }
    return route.fulfill({ status: 404, json: {} })
  })
  await page.goto('/unir-pdf')
  await upload(page, [
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: makePdf(2) },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: makePdf(1) },
  ])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  await page.getByRole('button', { name: 'Google Drive' }).click()
  await expect(page.getByText(/en la carpeta DocuSmart/)).toBeVisible()
  expect(uploadBody).toContain('"parents":["carpeta-docusmart"]')
})
