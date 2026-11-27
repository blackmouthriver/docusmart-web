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
    expect(planFor(index, kb, 'pasa el pdf a jpg a 300 ppp')).toBeNull()
    expect(planFor(index, kb, 'es gratis?')).toBeNull()
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
