// Medición del asistente (W-151.1). Para cada idioma: acierto (la primera respuesta es correcta y
// con confianza), acierto entre las 3 primeras, sin respuesta (no está seguro) y equivocada (responde
// con confianza algo que no es). El acierto no puede bajar de baseline.json.
//
// Al mejorar el asistente, actualiza la línea base y el informe de docs/CHATBOT.md con:
//   UPDATE_ASSISTANT_BASELINE=1 npx vitest run tests/unit/features/assistant/eval
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildIndex, search, type Kb } from '../../../../../src/features/assistant/core/engine'
import { CONTROL_EN, CONTROL_ES, CONTROL_OTHER, EVAL_EN, EVAL_ES, type Category, type EvalCase } from './cases'
import { EVAL_OTHER } from './cases-otros'

const root = process.cwd()
const BASELINE_FILE = join(root, 'tests/unit/features/assistant/eval/baseline.json')
const REPORT_FILE = join(root, 'docs/CHATBOT.md')
const update = Boolean(process.env.UPDATE_ASSISTANT_BASELINE)

type Metrics = { n: number; top1: number; top3: number; none: number; wrong: number }
type Result = Metrics & { byCategory: Partial<Record<Category, Metrics>>; misses: string[] }

const load = (lang: string): Kb => JSON.parse(readFileSync(join(root, 'public', 'assistant', `${lang}.json`), 'utf-8')) as Kb
const pct = (x: number) => Math.round(x * 1000) / 10

function measure(lang: string, cases: EvalCase[]): Result {
  const index = buildIndex(load(lang))
  const tally = () => ({ n: 0, top1: 0, top3: 0, none: 0, wrong: 0 })
  const all = tally()
  const byCategory: Partial<Record<Category, ReturnType<typeof tally>>> = {}
  const misses: string[] = []
  for (const [q, accepted, cat] of cases) {
    const out = search(index, q, { limit: 3 })
    const ids = out.results.map((r) => r.entry.id)
    const c = (byCategory[cat] ??= tally())
    const add = (k: keyof Metrics) => ((all[k] += 1), (c[k] += 1))
    add('n')
    if (!accepted.length) {
      // Fuera de tema: acierta si no responde con confianza.
      if (out.confident) (add('wrong'), misses.push(`[${cat}] ${q} → ${ids[0]} (no debía responder)`))
      else (add('top1'), add('top3'))
      continue
    }
    const first = out.confident && accepted.includes(ids[0])
    if (first) add('top1')
    if (ids.some((id) => accepted.includes(id))) add('top3')
    if (!out.confident) add('none')
    else if (!first) add('wrong')
    if (!first) misses.push(`[${cat}] ${q} → ${ids[0] ?? '∅'}${out.confident ? '' : ' (sin confianza)'}`)
  }
  const rates = (m: ReturnType<typeof tally>): Metrics => ({ n: m.n, top1: pct(m.top1 / m.n), top3: pct(m.top3 / m.n), none: pct(m.none / m.n), wrong: pct(m.wrong / m.n) })
  return { ...rates(all), byCategory: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, rates(v)])), misses }
}

const SETS: Record<string, EvalCase[]> = { es: EVAL_ES, en: EVAL_EN, ...EVAL_OTHER, 'control-es': CONTROL_ES, 'control-en': CONTROL_EN, ...Object.fromEntries(Object.entries(CONTROL_OTHER).map(([l, c]) => [`control-${l}`, c])) }
/** Idioma de la base para cada conjunto (los de control usan la de su idioma). */
const langOf = (set: string) => set.replace(/^control-/, '')
const results: Record<string, Result> = {}
const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8')) as Record<string, Metrics>

describe('conjunto de evaluación del asistente (W-151.1)', () => {
  it('cada respuesta aceptada existe en la base de su idioma', () => {
    for (const [lang, cases] of Object.entries(SETS)) {
      const ids = new Set(load(langOf(lang)).entries.map((e) => e.id))
      for (const [q, accepted] of cases) expect(accepted.some((id) => ids.has(id)) || !accepted.length, `${lang}: ${q}`).toBe(true)
    }
  })

  it('hay preguntas de todas las categorías en cada idioma', () => {
    for (const [lang, cases] of Object.entries(SETS)) {
      if (lang.startsWith('control-')) continue
      expect(cases.length, lang).toBeGreaterThanOrEqual(lang === 'es' || lang === 'en' ? 60 : 30)
      expect(new Set(cases.map((c) => c[2])).size, lang).toBe(6)
    }
  })

  for (const [lang, cases] of Object.entries(SETS)) {
    it(`${lang}: el acierto no baja de la línea base`, () => {
      const r = (results[lang] = measure(langOf(lang), cases))
      if (update) return
      const base = baseline[lang]
      expect(base, `${lang}: falta en baseline.json (corre con UPDATE_ASSISTANT_BASELINE=1)`).toBeTruthy()
      expect(r.top1, `${lang}: ${r.top1} % < ${base.top1} %\n${r.misses.join('\n')}`).toBeGreaterThanOrEqual(base.top1)
    })
  }

  afterAll(() => {
    if (!update) return
    const langs = Object.keys(SETS).filter((l) => results[l])
    const out = Object.fromEntries(langs.map((l) => [l, { n: results[l].n, top1: results[l].top1, top3: results[l].top3, none: results[l].none, wrong: results[l].wrong }]))
    writeFileSync(BASELINE_FILE, JSON.stringify(out, null, 2) + '\n')
    writeReport(langs)
  })
})

const CATS: Array<[Category, string]> = [
  ['herramienta', 'Herramientas'],
  ['tramite', 'Trámites'],
  ['error', 'Errores'],
  ['nueva', 'Herramientas nuevas'],
  ['general', 'Sobre DocuSmart'],
  ['fuera', 'Fuera de tema'],
]

function writeReport(langs: string[]) {
  const src = readFileSync(REPORT_FILE, 'utf-8')
  const start = '<!-- medicion:inicio -->'
  const end = '<!-- medicion:fin -->'
  // El total es de los 12 idiomas; los grupos de control van aparte.
  const main = langs.filter((l) => !l.startsWith('control-'))
  const total = (k: keyof Metrics) => pct(main.reduce((s, l) => s + (results[l][k] * results[l].n) / 100, 0) / main.reduce((s, l) => s + results[l].n, 0))
  const lines = [
    start,
    '',
    '| Idioma | Preguntas | Acierto | Entre las 3 primeras | Sin respuesta | Equivocada |',
    '|---|---:|---:|---:|---:|---:|',
    ...langs.map((l) => `| ${l} | ${results[l].n} | ${results[l].top1} % | ${results[l].top3} % | ${results[l].none} % | ${results[l].wrong} % |`),
    `| **Total** | ${main.reduce((s, l) => s + results[l].n, 0)} | **${total('top1')} %** | ${total('top3')} % | ${total('none')} % | ${total('wrong')} % |`,
    '',
    'Acierto por categoría (español e inglés):',
    '',
    '| Categoría | es | en |',
    '|---|---:|---:|',
    ...CATS.map(([c, name]) => `| ${name} | ${results.es?.byCategory[c]?.top1 ?? '–'} % | ${results.en?.byCategory[c]?.top1 ?? '–'} % |`),
    '',
    '<details><summary>Preguntas que hoy fallan (español e inglés)</summary>',
    '',
    ...['es', 'en'].flatMap((l) => [`**${l}**`, '', ...(results[l]?.misses ?? []).map((m) => `- ${m}`), '']),
    '</details>',
    '',
    end,
  ]
  const i = src.indexOf(start)
  const j = src.indexOf(end)
  const next = i >= 0 && j > i ? src.slice(0, i) + lines.join('\n') + src.slice(j + end.length) : `${src.trimEnd()}\n\n${lines.join('\n')}\n`
  writeFileSync(REPORT_FILE, next)
}
