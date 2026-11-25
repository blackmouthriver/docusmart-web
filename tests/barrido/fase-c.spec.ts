// Barrido, fase C: un PDF largo (120 páginas) en las herramientas que muestran todas las páginas o
// las recorren, y el diseño de la pantalla ya con el resultado (desbordes y textos cortados), en
// escritorio y celular. Informe en test-results/barrido-c/.
import { mkdirSync, writeFileSync } from 'node:fs'
import { test } from '../e2e/helpers'
import { pdfLargo } from './muestras'

test.use({ allowConsoleErrors: true })
const OUT = 'test-results/barrido-c'
mkdirSync(OUT, { recursive: true })

const LARGO: Record<string, (host: import('@playwright/test').Locator) => Promise<void>> = {
  'unir-pdf': async () => undefined,
  'dividir-pdf': async (h) => h.getByRole('button', { name: 'Cada página por separado' }).click(),
  'rotar-pdf': async (h) => h.getByRole('button', { name: 'Todas a la derecha' }).click(),
  'ordenar-paginas-pdf': async (h) => h.locator('.thumb').first().locator('.thumb-actions button').nth(1).click(),
  'numerar-paginas-pdf': async () => undefined,
  'marca-de-agua-pdf': async () => undefined,
  'comprimir-pdf': async () => undefined,
  'pdf-a-texto': async () => undefined,
  'pdf-a-jpg': async () => undefined,
}

for (const [slug, prep] of Object.entries(LARGO)) {
  test(`C · ${slug}`, async ({ page, consoleErrors }, info) => {
    test.setTimeout(300_000)
    const r: Record<string, unknown> = { slug, proyecto: info.project.name }
    await page.goto(`/${slug}`)
    const host = page.locator('#tool')
    const big = await pdfLargo(120)
    const files = slug === 'unir-pdf' ? [{ name: 'largo.pdf', mimeType: 'application/pdf', buffer: big }, { name: 'largo-2.pdf', mimeType: 'application/pdf', buffer: big }] : [{ name: 'largo.pdf', mimeType: 'application/pdf', buffer: big }]
    const t0 = Date.now()
    await host.locator('input[type=file]').first().setInputFiles(files)
    // La primera miniatura o la vista previa: cuánto tarda en mostrarse algo.
    await host.locator('img').first().waitFor({ timeout: 60_000 }).catch(() => undefined)
    r.mostrarSeg = Math.round((Date.now() - t0) / 100) / 10
    await page.waitForTimeout(1500)
    await prep(host)
    const t1 = Date.now()
    try {
      await host.locator('.btn-primary:not([disabled])').last().click({ timeout: 20_000 })
      const dl = host.getByRole('button', { name: /^Descargar/ }).first()
      await dl.waitFor({ timeout: 240_000 })
      r.procesarSeg = Math.round((Date.now() - t1) / 100) / 10
      r.ok = true
    } catch (e) {
      r.ok = false
      r.fallo = e instanceof Error ? e.message.split('\n')[0] : String(e)
    }
    // Diseño con el resultado a la vista.
    r.diseno = await page.evaluate(() => {
      const host = document.querySelector('#tool')!
      const hr = host.getBoundingClientRect()
      const out = { overflowX: document.documentElement.scrollWidth - window.innerWidth, cortados: [] as string[], fuera: [] as string[] }
      for (const el of host.querySelectorAll('button, label, b, small, span, h3, p, li')) {
        const rr = el.getBoundingClientRect()
        if (rr.width < 1 || el.closest('[aria-hidden="true"], .sr-only')) continue
        const cs = getComputedStyle(el)
        const t = (el.textContent ?? '').trim().slice(0, 50)
        if (!t) continue
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && out.cortados.length < 10) out.cortados.push(t)
        if ((rr.right > hr.right + 2 || rr.left < hr.left - 2) && out.fuera.length < 10) out.fuera.push(t)
      }
      return out
    })
    r.errores = consoleErrors
    writeFileSync(`${OUT}/${info.project.name}-${slug}.json`, JSON.stringify(r, null, 1))
  })
}
