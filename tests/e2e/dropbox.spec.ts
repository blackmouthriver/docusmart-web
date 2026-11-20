// Guardar en Dropbox: autorización con PKCE en una ventana emergente, intercambio del código y
// subida a la carpeta de la app (Aplicaciones › DocuSmart) con el nombre que eligió el usuario.
// Dropbox se simula: la prueba no sale a internet.
import { expect, makePdf, test, upload } from './helpers'

test('guarda en Dropbox con el nombre elegido y lo confirma', async ({ page, context }) => {
  const host = (h: string) => (u: URL) => u.protocol === 'https:' && u.hostname === h
  let authorize: URL | undefined
  await context.route(host('www.dropbox.com'), (route) => {
    authorize = new URL(route.request().url())
    const back = `${authorize.searchParams.get('redirect_uri')}?code=codigo&state=${authorize.searchParams.get('state')}`
    return route.fulfill({ contentType: 'text/html', body: `<script>location.replace(${JSON.stringify(back)})</script>` })
  })
  let tokenBody = ''
  await context.route(host('api.dropboxapi.com'), (route) => {
    tokenBody = route.request().postData() ?? ''
    return route.fulfill({ json: { access_token: 'tok', token_type: 'bearer' } })
  })
  let apiArg = ''
  await context.route(host('content.dropboxapi.com'), (route) => {
    apiArg = route.request().headers()['dropbox-api-arg'] ?? ''
    return route.fulfill({ json: { path_display: '/Contrato final.pdf' } })
  })

  await page.goto('/unir-pdf')
  await upload(page, [
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: makePdf(2) },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: makePdf(1) },
  ])
  await page.getByRole('button', { name: 'Unir 2 PDFs' }).click()
  await page.getByRole('textbox', { name: 'Nombre del archivo' }).fill('Contrato final')
  await page.getByRole('button', { name: 'Dropbox' }).click()
  await expect(page.getByText(/Guardado en tu Dropbox, en Aplicaciones › DocuSmart\/Contrato final\.pdf/)).toBeVisible()

  expect(authorize?.searchParams.get('client_id')).toBe('41ysmh5vbi68o2t')
  expect(authorize?.searchParams.get('code_challenge_method')).toBe('S256')
  expect(authorize?.searchParams.get('redirect_uri')).toMatch(/\/oauth$/)
  expect(new URLSearchParams(tokenBody).get('code')).toBe('codigo')
  expect(JSON.parse(apiArg).path).toBe('/Contrato final.pdf')
})
