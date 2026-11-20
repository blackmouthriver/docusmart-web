// Las páginas de herramientas citan botones y opciones de la app ("Rotar PDF", "Alta"…).
// Si un botón cambia de nombre, la página queda diciendo algo que el usuario no encuentra:
// esta prueba exige que cada texto citado exista en los mensajes de la app de ese idioma.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pages } from '../../../../tools/pages.mjs'
import { LANGS, localized } from '../../../../tools/locales/index.mjs'

const root = resolve(__dirname, '../../../..')
const QUOTES = /"([^"]{2,60})"|“([^”]{2,60})”|«\s?([^»]{2,60}?)\s?»|„([^“]{2,60})“|「([^」]{2,60})」|『([^』]{2,60})』/g
const clean = (s: string) => s.replace(/[….\s]+$/, '').replace(/\s+/g, ' ').trim().toLowerCase()

/** Textos de la app en un idioma, con los marcadores ({n}) como "n" y también quitados. */
function appTexts(lang: string): string {
  const src = readFileSync(resolve(root, `src/shared/i18n/messages/${lang}.ts`), 'utf8')
  const values = [...src.matchAll(/^\s*'[^']+':\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`([^`]*)`)/gm)].map((m) =>
    (m[1] ?? m[2] ?? m[3]).replace(/\\"/g, '"').replace(/\\'/g, "'"),
  )
  return values.flatMap((v) => [clean(v.replace(/\{[^}]+\}/g, 'n')), clean(v.replace(/\{[^}]+\}/g, ''))]).join(' ‖ ')
}

describe('textos citados en las páginas de herramientas', () => {
  for (const loc of LANGS) {
    it(`${loc.lang}: cada botón u opción citado existe en la app`, () => {
      // También valen los nombres de otras herramientas ("PDF a JPG") y los ejemplos de formato ("2-4, 7").
      const hay = [appTexts(loc.lang), ...pages.map((p) => clean(localized(p, loc).h1))].join(' ‖ ')
      const missing: string[] = []
      for (const page of pages) {
        const p = localized(page, loc)
        for (const text of [...p.steps, ...p.faq.map(([, a]) => a)])
          for (const m of text.matchAll(QUOTES)) {
            const quote = m.slice(1).find(Boolean) as string
            const n = clean(quote)
            if (hay.includes(n) || /^[\d\s,./-]+$/.test(n)) continue
            missing.push(`${page.slug}: ${quote}`)
          }
      }
      expect(missing).toEqual([])
    })
  }
})
