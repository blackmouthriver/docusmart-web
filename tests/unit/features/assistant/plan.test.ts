// Tarjeta «Hacer / Cambiar» (W-151.5): cuándo se ofrece, qué muestra y cómo pasan las opciones a la herramienta.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildIndex, type Kb } from '../../../../src/features/assistant/core/engine'
import { formatSize, planFor, planLines } from '../../../../src/features/assistant/core/plan'
import { TOOL_OPTIONS } from '../../../../src/features/assistant/core/actions'
import type { Lexicon } from '../../../../src/features/assistant/core/parser'
import { TOOLS_RECEIVING_OPTIONS, TOOL_OPTIONS_MAX_AGE_MS, setToolOptions, takeToolOptions } from '../../../../src/shared/files/toolOptions'

const MB = 1024 * 1024
const load = (lang: string) => {
  const kb = JSON.parse(readFileSync(join(process.cwd(), 'public', 'assistant', `${lang}.json`), 'utf-8')) as Kb & { parse?: Lexicon }
  return { kb, index: buildIndex(kb) }
}

describe('opciones del asistente para una herramienta (sin URL)', () => {
  // Las pruebas corren sin navegador: un sessionStorage y un window mínimos.
  let store: Record<string, string>
  beforeEach(() => {
    store = {}
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => (store[k] = v), removeItem: (k: string) => delete store[k] })
    vi.stubGlobal('window', { dispatchEvent: () => true })
    vi.stubGlobal('CustomEvent', class {})
  })
  afterEach(() => vi.unstubAllGlobals())

  it('se toman una sola vez y solo en la herramienta pedida', () => {
    setToolOptions('comprimir-pdf', { targetSize: 2 * MB })
    expect(takeToolOptions('dividir-pdf')).toBeNull()
    expect(takeToolOptions('comprimir-pdf')).toEqual({ targetSize: 2 * MB })
    expect(takeToolOptions('comprimir-pdf')).toBeNull()
  })

  it('vencen al minuto y nunca guardan la contraseña', () => {
    setToolOptions('comprimir-pdf', { grayscale: true }, 1000)
    expect(takeToolOptions('comprimir-pdf', 1000 + TOOL_OPTIONS_MAX_AGE_MS + 1)).toBeNull()
    setToolOptions('proteger-pdf', { password: 'Secreta123' })
    expect(store['ds-tool-options']).not.toContain('Secreta123')
  })

  it('cada herramienta que recibe opciones las tiene declaradas en el catálogo', () => {
    for (const tool of TOOLS_RECEIVING_OPTIONS) expect(TOOL_OPTIONS[tool], tool).toBeTruthy()
  })
})

describe('tarjeta «Hacer / Cambiar»', () => {
  it('se ofrece para un pedido con opciones en una herramienta que las recibe', () => {
    const { kb, index } = load('es')
    const plan = planFor(index, kb, 'comprime este pdf a menos de 2 megas')
    expect(plan?.action).toMatchObject({ tool: 'comprimir-pdf', options: { targetSize: 2 * MB }, useCurrentFile: true })
    expect(plan?.entry.id).toBe('tool:comprimir-pdf')
    expect(planLines(plan!.action, kb.ui, 'es')).toEqual(['Tamaño máximo: 2 MB'])
    const rotate = planFor(index, kb, 'gira las paginas 2 a 3 del pdf a la derecha')
    expect(planLines(rotate!.action, kb.ui, 'es')).toEqual(['Páginas: 2-3', 'Giro: 90°'])
  })

  it('no se ofrece sin opciones ni para herramientas que todavía no las reciben', () => {
    const { kb, index } = load('es')
    expect(planFor(index, kb, 'une estos pdf')).toBeNull()
    expect(planFor(index, kb, 'es gratis?')).toBeNull()
  })

  it('las herramientas conectadas después: PDF a JPG, OCR, marcas de agua, numerar, imagen', () => {
    const { kb, index } = load('es')
    const lines = (q: string) => {
      const p = planFor(index, kb, q)
      return p ? [p.action.tool, ...planLines(p.action, kb.ui, 'es')] : null
    }
    expect(lines('pasa el pdf a png a 300 ppp')).toEqual(['pdf-a-jpg', 'Formato: PNG', 'Resolución: 300 ppp'])
    expect(lines('reconoce el texto de este pdf escaneado en ingles')).toEqual(['ocr-pdf', 'Idioma: inglés'])
    expect(lines('marca de agua "Borrador" abajo a la derecha en el pdf')).toEqual(['marca-de-agua-pdf', 'Texto: "Borrador"', 'Posición: Abajo a la derecha'])
    expect(lines('numerar las paginas del pdf abajo al centro')).toEqual(['numerar-paginas-pdf', 'Posición: Abajo al centro'])
    expect(lines('comprime esta foto a calidad 70')).toEqual(['comprimir-imagen', 'Calidad: 70 %'])
    expect(lines('girar esta foto 180 grados')).toEqual(['rotar-imagen', 'Giro: 180°'])
    // La numeración no va al centro: esa posición se descarta y, sin opciones, no hay tarjeta.
    expect(lines('numerar las paginas del pdf en el centro')).toBeNull()
  })

  it('pedido de varios pasos (W-151.8): cada paso con su herramienta y sus opciones', () => {
    const { kb, index } = load('es')
    const plan = planFor(index, kb, 'une estos pdf y luego comprimelos a 1 mega')
    expect(plan?.steps?.map((s) => s.action.tool)).toEqual(['unir-pdf', 'comprimir-pdf'])
    expect(plan?.action.tool).toBe('unir-pdf')
    expect(planLines(plan!.steps![1].action, kb.ui, 'es')).toEqual(['Tamaño máximo: 1 MB'])
  })

  it('en inglés también, con el formato de números del idioma', () => {
    const { kb, index } = load('en')
    const plan = planFor(index, kb, 'resize the image to 1920x1080')
    expect(planLines(plan!.action, kb.ui, 'en')).toEqual(['Width: 1920 px', 'Height: 1080 px'])
    expect(formatSize(1.5 * MB, 'es')).toBe('1,5 MB')
    expect(formatSize(1.5 * MB, 'en')).toBe('1.5 MB')
    expect(formatSize(500 * 1024, 'en')).toBe('500 KB')
  })
})
