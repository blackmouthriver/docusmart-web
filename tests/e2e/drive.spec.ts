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
