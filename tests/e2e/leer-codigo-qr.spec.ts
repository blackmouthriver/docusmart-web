// Lector de QR con página propia (W-109): solo el lector, y lee un QR desde una imagen.
import QRCode from 'qrcode'
import { expect, test } from './helpers'

test('la página del lector lee un QR desde una imagen y muestra el enlace', async ({ page }) => {
  await page.goto('/leer-codigo-qr')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Leer código QR')
  const tool = page.locator('#tool')
  // Solo el lector: el generador vive en su propia página.
  await expect(tool.getByRole('button', { name: 'Abrir cámara' })).toBeVisible()
  await expect(tool.getByRole('button', { name: 'Generar QR' })).toHaveCount(0)

  await tool.getByRole('button', { name: 'Desde imagen' }).click()
  const png = await QRCode.toBuffer('https://docusmart.online/herramientas', { width: 400, margin: 2 })
  await tool.locator('input[type=file]').setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer: png })
  await expect(tool.getByText('https://docusmart.online/herramientas')).toBeVisible()
  await expect(tool.getByRole('link', { name: 'Abrir enlace' })).toHaveAttribute('href', 'https://docusmart.online/herramientas')
})

test('la página del generador sigue teniendo las dos herramientas', async ({ page }) => {
  await page.goto('/crear-codigo-qr')
  const tool = page.locator('#tool')
  await expect(tool.getByRole('button', { name: 'Generar QR' })).toBeVisible()
  await expect(tool.getByRole('button', { name: 'Abrir cámara' })).toBeVisible()
})
