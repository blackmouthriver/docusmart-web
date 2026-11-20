// Utilidades de las pruebas de punta a punta (W-11).
import { Buffer } from 'node:buffer'
import { expect, test as base, type Page } from '@playwright/test'

/** PDF válido de N páginas (texto Helvetica), armado a mano para no depender de archivos. */
export function makePdf(pages = 2): Buffer {
  const objs: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  const kids: number[] = []
  for (let i = 0; i < pages; i++) {
    const text = `BT /F1 36 Tf 72 700 Td (Pagina ${i + 1}) Tj ET`
    objs.push(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`)
    const content = objs.length
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`)
    kids.push(objs.length)
  }
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${pages} >>`
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objs.forEach((o, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(out, 'latin1')
}

/** PNG de 48×32 con transparencia. */
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAADAAAAAgCAYAAABU1PscAAAAm0lEQVR42mNgGAWjYGQDRnQB1eTX/webI2/PFWXEJcc01GNg1AMDDVjoZVFkrchJdLHlzW/MB70HsDkcXY4SjzANlOPJUUdXD5DqKHI9wTQYHE+JvtFilJrpmRz9ozEw6oFRD1AZUNo8IFX/aAxQMxbI0UezGCDVMeR6mqZJiFhHUZJvaN6chjluyPYHqOnYYVkKjYJRMAqGOAAAlDw2g/t1WJsAAAAASUVORK5CYII=',
  'base64',
)

/**
 * `test` que falla si la página muestra errores en la consola o excepciones sin capturar
 * (incluye las violaciones de CSP y Trusted Types, que el navegador informa como errores).
 * Usa `allowConsoleErrors` en las pruebas que provocan errores a propósito (por ejemplo, sin red).
 */
export const test = base.extend<{ consoleErrors: string[]; allowConsoleErrors: boolean; presetConsent: 'denied' | 'none'; consentPreset: void }>({
  allowConsoleErrors: [false, { option: true }],
  /**
   * Con anuncios activos (W-90) el aviso de cookies aparece siempre y tapa los botones de abajo.
   * Por defecto las pruebas entran con la decisión "Rechazar" ya tomada; las que prueban el aviso
   * o los anuncios usan `presetConsent: 'none'` y deciden ellas.
   */
  presetConsent: ['denied', { option: true }],
  consentPreset: [
    async ({ page, presetConsent }, use) => {
      if (presetConsent === 'denied')
        await page.addInitScript(() => {
          if (localStorage.getItem('ds-consent') === null) {
            localStorage.setItem('ds-consent', 'denied')
            localStorage.setItem('ds-consent-scope', 'ads')
          }
        })
      await use()
    },
    { auto: true },
  ],
  consoleErrors: [
    async ({ page, allowConsoleErrors }, use) => {
      const errors: string[] = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
      await use(errors)
      if (!allowConsoleErrors) expect(errors, 'errores en la consola').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Sube archivos al primer selector de archivos de la pantalla. */
export async function upload(page: Page, files: Array<{ name: string; mimeType: string; buffer: Buffer }>) {
  await page.locator('input[type=file]').first().setInputFiles(files)
}
