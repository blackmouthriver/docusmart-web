// W-147.1: escanear con la cámara en vivo. Chromium usa una cámara falsa que pasa un video .y4m
// hecho aquí: una hoja clara con renglones sobre una mesa oscura. La hoja se queda quieta, así que
// la foto se toma sola; el botón del obturador toma otra a mano.
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from './helpers'

// Playwright no puede simular una cámara en WebKit (sí en Chromium): estas pruebas corren en Chrome.
test.skip(({ browserName }) => browserName === 'webkit', 'WebKit no permite simular la cámara en Playwright')

const W = 640
const H = 480

/** Un cuadro YUV 4:2:0: la hoja (un cuadrilátero un poco girado) con renglones oscuros. */
function frame(): Buffer {
  const quad = [[150, 60], [500, 80], [480, 430], [130, 410]]
  const inside = (x: number, y: number) =>
    quad.every(([ax, ay], i) => {
      const [bx, by] = quad[(i + 1) % 4]
      return (bx - ax) * (y - ay) - (by - ay) * (x - ax) >= 0
    })
  const y = Buffer.alloc(W * H)
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++) {
      const paper = inside(c + 0.5, r + 0.5)
      const line = paper && r % 40 > 30 && r % 40 < 35 && c > 190 && c < 440
      y[r * W + c] = !paper ? 35 : line ? 60 : 225
    }
  return Buffer.concat([y, Buffer.alloc((W / 2) * (H / 2) * 2, 128)])
}

// En una carpeta temporal propia (no un nombre fijo en la carpeta temporal compartida).
const video = join(mkdtempSync(join(tmpdir(), 'docusmart-camara-')), 'hoja.y4m')
const f = frame()
writeFileSync(video, Buffer.concat([Buffer.from(`YUV4MPEG2 W${W} H${H} F15:1 Ip A1:1 C420jpeg\n`), ...Array.from({ length: 15 }, () => Buffer.concat([Buffer.from('FRAME\n'), f]))]))

test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${video}`] },
  permissions: ['camera'],
})

test('cámara en vivo: detecta la hoja, la toma sola y otra a mano @movil', async ({ page }) => {
  await page.goto('/app/#/pdf/escanear')
  await page.getByRole('button', { name: 'Tomar foto' }).first().click()
  const cam = page.getByRole('dialog', { name: 'Escanear con la cámara' })
  await expect(cam).toBeVisible()
  // La hoja se marca sobre el video y, quieta, se toma sola.
  await expect(cam.locator('.live-scan-quad polygon')).toBeVisible()
  await expect(cam.getByRole('button', { name: 'Listo (1)' })).toBeVisible({ timeout: 15_000 })
  await expect(cam.getByRole('status')).toHaveText('Página guardada. Pon la siguiente hoja.')
  // La misma hoja no se vuelve a tomar sola…
  await page.waitForTimeout(2000)
  await expect(cam.getByRole('button', { name: 'Listo (1)' })).toBeVisible()
  // …pero sí con el obturador.
  await cam.getByRole('button', { name: 'Tomar la foto' }).click()
  await cam.getByRole('button', { name: 'Listo (2)' }).click()
  await expect(cam).toBeHidden()

  // Las dos páginas llegan al editor con las esquinas de la hoja (no "toda la foto").
  await expect(page.getByRole('heading', { name: 'Página 1' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('heading', { name: '2 páginas' })).toBeVisible()
  const corner = page.getByRole('slider', { name: 'Esquina superior izquierda' })
  const [x, y] = (await corner.getAttribute('aria-valuetext'))!.split(',').map((v) => parseInt(v))
  // La esquina de la hoja está en (150, 60) de 640 × 480: 23 % y 13 %.
  expect(Math.abs(x - 23)).toBeLessThanOrEqual(3)
  expect(Math.abs(y - 13)).toBeLessThanOrEqual(3)
})

test('cámara en vivo: sin captura automática solo se toma con el obturador, y Esc la cierra', async ({ page }) => {
  await page.goto('/app/#/pdf/escanear')
  await page.getByRole('button', { name: 'Tomar foto' }).first().click()
  const cam = page.getByRole('dialog', { name: 'Escanear con la cámara' })
  await cam.getByRole('checkbox', { name: 'Captura automática' }).uncheck()
  await expect(cam.locator('.live-scan-quad polygon')).toBeVisible()
  await page.waitForTimeout(2500)
  await expect(cam.getByRole('button', { name: 'Listo', exact: true })).toBeVisible()
  await cam.getByRole('button', { name: 'Tomar la foto' }).click()
  await expect(cam.getByRole('button', { name: 'Listo (1)' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(cam).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Página 1' })).toBeVisible({ timeout: 20_000 })
  // La cámara se apagó al cerrar.
  expect(await page.evaluate(() => [...document.querySelectorAll('video')].some((v) => (v.srcObject as MediaStream | null)?.active))).toBe(false)
})
