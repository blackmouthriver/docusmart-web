// Sin conexión (W-16 y W-11): el service worker guarda la app y lo que ya se usó.
import { expect, PNG, test, upload } from './helpers'

// Sin red, el navegador informa las peticiones fallidas como errores: aquí se esperan.
test.use({ allowConsoleErrors: true })

test('la app y una herramienta ya visitada funcionan sin conexión', async ({ page, context }) => {
  await page.goto('/app/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // Visita con red: queda guardada (la página le pasa al service worker lo que descargó).
  await page.goto('/png-a-jpg')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    await new Promise((r) => setTimeout(r, 1500))
  })

  await context.setOffline(true)
  await page.goto('/app/')
  await expect(page.locator('.shell')).toBeVisible()

  await page.goto('/png-a-jpg')
  await upload(page, [{ name: 'logo.png', mimeType: 'image/png', buffer: PNG }])
  await page.getByRole('button', { name: 'Convertir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible()
  await context.setOffline(false)
})
