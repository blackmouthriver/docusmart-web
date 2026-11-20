// Quitar fondo (W-121): el modelo real (IS-Net) corre en el navegador, con la CSP de producción.
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { expect, test, upload } from './helpers'

// 200 × 200: una "manzana" roja con tallo sobre fondo claro.
const APPLE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACyElEQVR42u3dPVICURCFUegichHmBOSsysW4KnICcldAMsYuwLLEKhnovueLCea9OdMz/Fhul+W6kf67sgUCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAksCS2Bpbjtb8FPn/fGWlx0uJ3v1va1/IPBXSZyBtZ4nwsC6Oym8cmGtQCqcVxyslUnF8gqC9UBSgbwiYD0JqSheRZWjAmvU+Ztta+ytsNFpG3lbLKocLVhjz9M8W0WVIwdr+LmZZKuosgqwIq71GWspZ8KKwAr6mLH7usruWx1YAssFnb3GsuNWCpbAchFnr7fsslWDJbBcuNlrN7EUDyt5XLXbARNL2bCMq177YGIpGJZx1W43TCyBJbDcB8P3xMRSJCzjqunOmFgCS2AJLI8RHrNMLJlYAkuKgeUBq/UumVgCS2AJLAksgeUtYfJemVgCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLGk0rMPl5Ny03isTS2AJLIElgSWwvDFM3iUTS2AJLIHlAcIDloklE0tgSWGwPGY13RkTS6mwDK2Oe2JiCSyB5W4YvhsmlrJhGVq99sHEUjwsQ6vRDphYAit7aPVau4klsIKHVrtVl122XrAElos4e6Vlx60RLIHlgs5eXdl96wIrxdaAFZUzYS1gzT8fY66Qcgdx/GBNPjfDnhTL+ynHfI+2y3Id+Xb9vD/e8rL318/7HcPbx0vsJya7zWbyp4s38jKo3ArnnLnZXxuU73EdlVvhhNtiyA9+ImA9Ca+oH74GwXogr8Df6cfBWplX7N+rlT8spgosgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYmt7YfyAgE0tgSWAJLIElgSWwBJb0W1905uns+XOssQAAAABJRU5ErkJggg==', 'base64')

test('quita el fondo con IA: descarga el modelo una vez y devuelve un PNG transparente', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/quitar-fondo')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quitar fondo de una imagen')
  await expect(page.locator('#tool').getByText(/La primera vez se descarga el modelo de IA/)).toBeVisible()
  await upload(page, [{ name: 'manzana.png', mimeType: 'image/png', buffer: APPLE }])
  await page.locator('#tool').getByRole('button', { name: 'Quitar fondo' }).click()
  await expect(page.getByRole('button', { name: 'Descargar' })).toBeVisible({ timeout: 200_000 })

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('manzana-sin-fondo.png')
  const png = await readFile((await file.path())!)
  // La esquina queda transparente y el centro (la manzana) opaco.
  const alpha = await page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob())
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = c.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    return { size: [bmp.width, bmp.height], corner: ctx.getImageData(5, 5, 1, 1).data[3], center: ctx.getImageData(100, 100, 1, 1).data[3] }
  }, png.toString('base64'))
  expect(alpha.size).toEqual([200, 200])
  expect(alpha.corner).toBeLessThan(20)
  expect(alpha.center).toBeGreaterThan(230)

  // El modelo quedó guardado: al volver ya no avisa de la descarga.
  await page.reload()
  await expect(page.locator('#tool').getByRole('button', { name: 'Quitar fondo' })).toBeVisible()
  await expect(page.locator('#tool').getByText(/La primera vez se descarga el modelo de IA/)).toHaveCount(0)
})
