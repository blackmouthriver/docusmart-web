import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildIndex, type Kb } from '../../../../src/features/assistant/core/engine'
import { answerFor, contextForRoute, kbLangFor, reply } from '../../../../src/features/assistant/core/reply'

const ES = buildIndex(JSON.parse(readFileSync(join(process.cwd(), 'public', 'assistant', 'es.json'), 'utf-8')) as Kb)

describe('idioma de la base', () => {
  it('los 12 idiomas tienen base propia; cualquier otro usa el inglés', () => {
    for (const l of ['es', 'en', 'pt', 'fr', 'it', 'de', 'ca', 'eu', 'ru', 'ja', 'ko', 'zh']) expect(kbLangFor(l)).toBe(l)
    expect(kbLangFor('nl')).toBe('en')
  })
})

describe('contexto de la pantalla', () => {
  it('reconoce la herramienta abierta', () => {
    expect(contextForRoute(ES, 'pdf', 'unir')).toBe('unir-pdf')
    expect(contextForRoute(ES, 'convertir', 'pdf-word')).toBe('pdf-a-word')
    expect(contextForRoute(ES, 'imagen', 'rotar')).toBe('rotar-imagen')
    expect(contextForRoute(ES, 'qr', 'leer')).toBe('crear-codigo-qr')
    expect(contextForRoute(ES, 'qr')).toBe('crear-codigo-qr')
    expect(contextForRoute(ES, 'hash', 'calcular')).toBe('calcular-hash')
    expect(contextForRoute(ES, 'hash', 'verificar')).toBe('calcular-hash')
  })
  it('sin herramienta en pantallas generales', () => {
    expect(contextForRoute(ES, '')).toBeUndefined()
    expect(contextForRoute(ES, 'estudio', 'lectura')).toBeUndefined()
    expect(contextForRoute(ES, 'pdf')).toBeUndefined()
  })
})

describe('respuesta', () => {
  it('responde con la entrada y sus relacionadas', () => {
    const r = reply(ES, 'como junto dos pdf')
    expect(r.kind).toBe('answer')
    if (r.kind !== 'answer') return
    expect(r.entry.tool).toBe('unir-pdf')
    expect(r.related.length).toBeGreaterThan(0)
    expect(r.related.length).toBeLessThanOrEqual(3)
    expect(r.related.map((e) => e.id)).not.toContain(r.entry.id)
  })
  it('sin confianza: sugerencias y contacto', () => {
    const r = reply(ES, 'receta de pizza', 'unir-pdf')
    expect(r.kind).toBe('fallback')
    if (r.kind !== 'fallback') return
    expect(r.suggestions).toHaveLength(3)
    expect(r.suggestions[0].tool).toBe('unir-pdf')
    expect(r.contact?.id).toBe('contacto')
  })
  it('una entrada elegida trae sus relacionadas sin repetir', () => {
    const privacy = ES.byId.get('privacidad')!
    const r = answerFor(ES, privacy, [privacy, ES.byId.get('analitica')!])
    expect(r.kind === 'answer' && r.related.map((e) => e.id)).toEqual(['analitica', 'sin-cuenta', 'datos-guardados'])
    const thanks = answerFor(ES, ES.byId.get('gracias')!)
    expect(thanks.kind === 'answer' && thanks.related).toEqual([])
  })
})
