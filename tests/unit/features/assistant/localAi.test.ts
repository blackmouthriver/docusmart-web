import { describe, expect, it } from 'vitest'
import { AI_MAX_CHARS, aiLangSupported, aiSystemPrompt, aiUserPrompt, cleanAiOutput } from '../../../../src/features/assistant/core/localAi'

describe('IA del navegador: idiomas e instrucciones', () => {
  it('solo los idiomas que la Prompt API redacta', () => {
    expect(aiLangSupported('es')).toBe(true)
    expect(aiLangSupported('ja')).toBe(true)
    expect(aiLangSupported('de')).toBe(false)
  })
  it('las instrucciones fijan el idioma y prohíben inventar', () => {
    expect(aiSystemPrompt('es')).toContain('español')
    expect(aiSystemPrompt('xx')).toContain('English')
    expect(aiSystemPrompt('en')).toMatch(/ONLY facts from the reference/)
  })
  it('el mensaje lleva la pregunta (recortada) y la referencia', () => {
    const p = aiUserPrompt('  ¿cómo uno dos pdf?  ', 'Combina varios PDF en uno.')
    expect(p).toContain('USER QUESTION:\n¿cómo uno dos pdf?')
    expect(p).toContain('REFERENCE ANSWER:\nCombina varios PDF en uno.')
    expect(aiUserPrompt('x'.repeat(500), 'r')).toContain('x'.repeat(300) + '\n')
  })
})

describe('limpieza de la salida', () => {
  const ref = 'Escríbenos a supportdocusmart@docusmart.online o visita https://docusmart.online.'
  it('quita markdown y espacios de más', () => {
    expect(cleanAiOutput('## Título\n**Hola**   `mundo`\n\n\n\nfin', ref)).toBe('Título\nHola mundo\n\nfin')
  })
  it('descarta vacío o demasiado largo', () => {
    expect(cleanAiOutput('   ', ref)).toBeNull()
    expect(cleanAiOutput('a'.repeat(AI_MAX_CHARS + 1), ref)).toBeNull()
  })
  it('acepta correos y enlaces de la referencia, rechaza los inventados', () => {
    expect(cleanAiOutput('Escribe a supportdocusmart@docusmart.online.', ref)).toBe('Escribe a supportdocusmart@docusmart.online.')
    expect(cleanAiOutput('Mira https://docusmart.online, ahí está.', ref)).not.toBeNull()
    expect(cleanAiOutput('Escribe a otro@ejemplo.com', ref)).toBeNull()
    expect(cleanAiOutput('Visita https://otro.sitio', ref)).toBeNull()
  })
})
