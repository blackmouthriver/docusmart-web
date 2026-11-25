// Barrido, fase A: las 66 herramientas en español y alemán (textos más largos), en escritorio y
// celular. Para cada una: la página sin archivo, con un archivo vacío, con uno dañado y con uno
// bueno. Anota (sin cortar el barrido) desbordes, textos cortados o en columnas muy angostas,
// textos rotos ("undefined", "{n}", claves sin traducir), errores en la consola y qué mensaje se
// muestra con los archivos malos. El informe queda en test-results/barrido/.
import { mkdirSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { LANGS, pagePath } from '../../tools/locales/index.mjs'
import { pages } from '../../tools/pages.mjs'
import { test } from '../e2e/helpers'
import { muestraMala, muestraPara } from './muestras'

test.use({ allowConsoleErrors: true })

const OUT = 'test-results/barrido'
mkdirSync(`${OUT}/capturas`, { recursive: true })

type Layout = { overflowX: number; cortados: string[]; fuera: string[]; angostos: string[]; rotos: string[] }

/** Revisa el diseño de #tool: desborde horizontal, textos cortados, fuera de su caja o en columnas angostas. */
async function revisar(page: Page): Promise<Layout> {
  return page.evaluate(() => {
    const txt = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
    const out = { overflowX: document.documentElement.scrollWidth - window.innerWidth, cortados: [] as string[], fuera: [] as string[], angostos: [] as string[], rotos: [] as string[] }
    const host = document.querySelector('#tool')
    if (!host) return out
    const hr = host.getBoundingClientRect()
    const seen = new Set<string>()
    const add = (list: string[], s: string) => {
      if (s && !seen.has(list.length + s) && list.length < 15) {
        seen.add(list.length + s)
        if (!list.includes(s)) list.push(s)
      }
    }
    for (const el of host.querySelectorAll('button, label, a, b, strong, small, span, h1, h2, h3, h4, p, td, th, li, legend, figcaption, summary')) {
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || el.closest('[aria-hidden="true"], [inert], .sr-only')) continue
      const text = txt(el)
      if (!text) continue
      // Texto que no entra: recortado por overflow o puntos suspensivos.
      if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis' || cs.overflowX !== 'visible')) add(out.cortados, text)
      // Se sale de la herramienta hacia los lados.
      if (r.right > hr.right + 2 || r.left < hr.left - 2) add(out.fuera, text)
      // Columnas tan angostas que el texto queda de a una palabra por renglón (como pasó en Unir).
      const words = text.split(' ').length
      if (r.width < 70 && words >= 3 && r.height > parseFloat(cs.lineHeight || '20') * 2.5 && !el.children.length) add(out.angostos, text)
    }
    const visible = (host as HTMLElement).innerText
    for (const m of visible.matchAll(/undefined|NaN|\[object Object\]|\{[a-z]+\}|\b[a-z]{2,}\.[a-z]{2,}[A-Za-z]*\.[a-zA-Z.]+\b/g)) {
      // Nombres de archivo y dominios no cuentan.
      if (/\.(pdf|png|jpg|jpeg|webp|zip|docx|xlsx|pptx|csv|txt|heic|svg|tif|webm|mp4|wav|mp3|gif|ico|avif|online|com)\b/i.test(m[0])) continue
      add(out.rotos, m[0])
    }
    return out
  })
}

/** Lo que muestra la herramienta después de un archivo malo: mensaje de error o nada. */
async function reaccion(page: Page): Promise<{ mensaje: string; archivoAceptado: boolean; ocupado: boolean }> {
  return page.evaluate(() => {
    const host = document.querySelector('#tool')!
    const notices = [...host.querySelectorAll('[role="alert"], .notice-error, .notice')].map((n) => (n as HTMLElement).innerText.trim()).filter(Boolean)
    const busy = !!host.querySelector('[aria-busy="true"], .is-busy, .spinner')
    return { mensaje: notices.join(' | ').slice(0, 300), archivoAceptado: !!host.querySelector('.file-item'), ocupado: busy }
  })
}

const LANGS_BARRIDO = LANGS.filter((l) => l.lang === 'es' || l.lang === 'de')

for (const loc of LANGS_BARRIDO) {
  for (const tool of pages) {
    test(`${loc.lang} · ${tool.slug}`, async ({ page, consoleErrors }, info) => {
      const url = pagePath(tool, loc)
      const result: Record<string, unknown> = { lang: loc.lang, slug: tool.slug, proyecto: info.project.name, url }
      const errs = (desde: number) => consoleErrors.slice(desde).filter((e) => !/favicon|ERR_FILE_NOT_FOUND/.test(e))

      await page.goto(url)
      await page.locator('#tool').waitFor()
      await page.waitForTimeout(1200)
      result.inicial = await revisar(page)
      result.erroresInicio = errs(0)

      const buenas = await muestraPara(tool.slug, page)
      const input = page.locator('#tool input[type=file]').first()
      const hasInput = (await input.count()) > 0
      result.recibeArchivos = !!buenas && hasInput
      if (buenas && hasInput) {
        // Archivos malos: primero vacío, después dañado (recargando entre uno y otro).
        for (const vacia of [true, false]) {
          await page.goto(url)
          const n = consoleErrors.length
          await page.locator('#tool input[type=file]').first().setInputFiles([muestraMala(buenas[0], vacia)])
          await page.waitForTimeout(2500)
          // Si la herramienta tiene botón principal activo, se intenta (debe fallar con un mensaje claro).
          const go = page.locator('#tool .btn-primary:not([disabled])').last()
          if (await go.count()) {
            await go.click({ timeout: 3000 }).catch(() => undefined)
            await page.waitForTimeout(3000)
          }
          result[vacia ? 'vacio' : 'danado'] = { ...(await reaccion(page)), errores: errs(n) }
        }
        // Archivo bueno.
        await page.goto(url)
        const n = consoleErrors.length
        await page.locator('#tool input[type=file]').first().setInputFiles(buenas)
        await page.waitForTimeout(3500)
        result.conArchivo = await revisar(page)
        result.erroresConArchivo = errs(n)
      }
      await page.locator('#tool').screenshot({ path: `${OUT}/capturas/${loc.lang}-${info.project.name}-${tool.slug}.png` }).catch(() => undefined)
      writeFileSync(`${OUT}/${info.project.name}-${loc.lang}-${tool.slug}.json`, JSON.stringify(result, null, 1))
    })
  }
}
