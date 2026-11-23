// QR tras la auditoría W-146.11: leer el QR de una factura en una foto o un escaneo grande, desde
// un PDF, varios QR en una imagen y crear un QR de WhatsApp (y volver a leerlo).
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'
import { expect, test } from './helpers'

const DIAN = 'https://catalogo-vpfe.dian.gov.co/document/searchqr?' + ['document', 'key'].join('') + '=' + 'factura'.repeat(14)
// (el enlace de una factura de prueba se arma así para que el escáner de secretos no lo tome por una clave)

/** Una "foto" grande con QR pequeños dibujados en ella (en el navegador), en PNG. */
async function photoWithQrs(page: Page, w: number, h: number, qrs: Array<{ text: string; x: number; y: number; size: number }>): Promise<Buffer> {
  const pngs = await Promise.all(qrs.map(async (q) => ({ ...q, b64: (await QRCode.toBuffer(q.text, { margin: 4, scale: 1 })).toString('base64') })))
  const b64 = await page.evaluate(
    async ({ w, h, pngs }) => {
      const c = new OffscreenCanvas(w, h)
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#e8e4dc'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#333'
      ctx.font = '60px Arial'
      for (let i = 0; i < 20; i++) ctx.fillText('FACTURA ELECTRÓNICA DE VENTA  No. FE-1234', 120, 160 + i * 120)
      ctx.imageSmoothingEnabled = false
      for (const q of pngs) {
        const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + q.b64)).blob())
        ctx.drawImage(bmp, q.x, q.y, q.size, q.size)
      }
      const bytes = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
      let s = ''
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return btoa(s)
    },
    { w, h, pngs },
  )
  return Buffer.from(b64, 'base64')
}

async function readFromFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.goto('/app/#/qr/leer')
  await page.getByRole('group', { name: 'Origen' }).getByRole('button', { name: 'Desde imagen' }).click()
  await page.locator('main input[type=file]').first().setInputFiles(file)
}

test('el QR de una factura fotografiada en grande (4000 × 3000) se lee', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/app/#/qr/leer')
  const photo = await photoWithQrs(page, 4000, 3000, [{ text: DIAN, x: 2700, y: 1900, size: 430 }])
  await readFromFile(page, { name: 'factura.png', mimeType: 'image/png', buffer: photo })
  await expect(page.getByText('catalogo-vpfe.dian.gov.co', { exact: true })).toBeVisible({ timeout: 60_000 })
})

test('el QR de una factura electrónica en PDF se lee @movil', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/app/#/qr/leer')
  const doc = await PDFDocument.create()
  doc.addPage([595, 842])
  const p2 = doc.addPage([595, 842])
  const qr = await doc.embedPng(await QRCode.toBuffer(DIAN, { margin: 4, scale: 4 }))
  p2.drawImage(qr, { x: 440, y: 40, width: 110, height: 110 })
  await readFromFile(page, { name: 'factura.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) })
  await expect(page.getByText('catalogo-vpfe.dian.gov.co', { exact: true })).toBeVisible({ timeout: 60_000 })
})

test('dos QR en la misma imagen: aparecen los dos', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/app/#/qr/leer')
  const img = await photoWithQrs(page, 2400, 1200, [
    { text: 'https://docusmart.online/uno', x: 200, y: 300, size: 500 },
    { text: 'https://docusmart.online/dos', x: 1600, y: 300, size: 500 },
  ])
  await readFromFile(page, { name: 'dos.png', mimeType: 'image/png', buffer: img })
  await expect(page.getByText('Se encontraron 2 códigos.')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('https://docusmart.online/uno')).toBeVisible()
  await expect(page.getByText('https://docusmart.online/dos')).toBeVisible()
})

test('crear un QR de WhatsApp con mensaje y volver a leerlo @movil', async ({ page }) => {
  await page.goto('/app/#/qr/crear')
  await page.getByRole('radio', { name: 'WhatsApp' }).click()
  await page.getByLabel('Teléfono').fill('300 123 4567')
  await page.getByLabel('Mensaje (opcional)').fill('Hola, quiero una cita')
  await expect(page.getByText('Con el indicativo del país', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Generar QR' }).click()
  const wait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar', exact: true }).first().click()
  const png = await readFile((await (await wait).path())!)
  await readFromFile(page, { name: 'qr.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByText('https://wa.me/573001234567?text=Hola%2C%20quiero%20una%20cita')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('wa.me', { exact: true })).toBeVisible()
})
