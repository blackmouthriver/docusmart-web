import { describe, expect, it } from 'vitest'
import { VOICE_PERSONAS, guessFeminine, personaAvatar, personasForVoices, voicesForLanguage } from '../../../../../src/features/study/core/voicePersonas'

describe('guessFeminine', () => {
  it('reconoce voces conocidas de Windows, Edge, Chrome y Safari', () => {
    expect(guessFeminine('Microsoft Sabina - Spanish (Mexico)')).toBe(true)
    expect(guessFeminine('Microsoft Raul - Spanish (Mexico)')).toBe(false)
    expect(guessFeminine('Microsoft Álvaro Online (Natural) - Spanish (Spain)')).toBe(false)
    expect(guessFeminine('Microsoft Elvira Online (Natural) - Spanish (Spain)')).toBe(true)
    expect(guessFeminine('Mónica')).toBe(true)
    expect(guessFeminine('Ting-Ting')).toBe(true)
    expect(guessFeminine('Google español')).toBe(true)
    expect(guessFeminine('Google UK English Male')).toBe(false)
    expect(guessFeminine('Google UK English Female')).toBe(true)
  })

  it('devuelve undefined si no puede saberlo', () => {
    expect(guessFeminine('eSpeak Spanish')).toBeUndefined()
    expect(guessFeminine('')).toBeUndefined()
  })
})

describe('personasForVoices', () => {
  it('asigna un personaje distinto por voz y respeta el género', () => {
    const voices = [
      { id: 'b', feminine: true },
      { id: 'a', feminine: true },
      { id: 'c', feminine: false },
      { id: 'd' },
    ]
    const map = personasForVoices(voices)
    expect(map.get('a')?.feminine).toBe(true)
    expect(map.get('b')?.feminine).toBe(true)
    expect(map.get('c')?.feminine).toBe(false)
    expect(new Set(map.values()).size).toBe(4)
  })

  it('es estable sin importar el orden de las voces', () => {
    const one = personasForVoices([{ id: 'x', feminine: true }, { id: 'y', feminine: true }])
    const two = personasForVoices([{ id: 'y', feminine: true }, { id: 'x', feminine: true }])
    expect(one.get('x')).toBe(two.get('x'))
    expect(one.get('y')).toBe(two.get('y'))
  })

  it('solo repite cuando hay más voces que personajes', () => {
    const unknown = Array.from({ length: 12 }, (_, i) => ({ id: `v${String(i).padStart(2, '0')}` }))
    const map = personasForVoices(unknown)
    expect(new Set([...map.values()].slice(0, 10)).size).toBe(10)
    expect(map.size).toBe(12)
    const sixFemale = Array.from({ length: 6 }, (_, i) => ({ id: `f${i}`, feminine: true }))
    const female = personasForVoices(sixFemale)
    expect([...female.values()].every((p) => p.feminine)).toBe(true)
    expect(female.get('f5')).toBe(female.get('f0'))
  })

  it('las voces de género desconocido toman primero personajes libres', () => {
    const map = personasForVoices([{ id: 'a', feminine: true }, { id: 'b' }])
    expect(map.get('b')).not.toBe(map.get('a'))
  })

  it('ignora voces repetidas', () => {
    expect(personasForVoices([{ id: 'a' }, { id: 'a' }]).size).toBe(1)
  })
})

describe('voicesForLanguage', () => {
  const v = (name: string, lang: string, localService: boolean) => ({ name, lang, localService })
  const all = [v('Online B', 'es-MX', false), v('Local Z', 'es-ES', true), v('English', 'en-US', true), v('Local A', 'es-ES', true)]

  it('filtra por idioma y pone primero las voces sin internet', () => {
    expect(voicesForLanguage(all, 'es').map((x) => x.name)).toEqual(['Local A', 'Local Z', 'Online B'])
  })

  it('sin idioma devuelve todas', () => {
    expect(voicesForLanguage(all, null)).toHaveLength(4)
  })
})

it('cada personaje tiene su ilustración y hay 5 de cada género', () => {
  expect(personaAvatar(VOICE_PERSONAS[0])).toBe('/img/voices/sofia.webp')
  expect(VOICE_PERSONAS.filter((p) => p.feminine)).toHaveLength(5)
  expect(new Set(VOICE_PERSONAS.map((p) => p.id)).size).toBe(10)
})
