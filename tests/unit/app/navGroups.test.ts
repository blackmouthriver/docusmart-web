// Barra lateral en acordeón: una sola categoría abierta a la vez.
import { describe, expect, it } from 'vitest'
import { openOnly, toggleGroup } from '../../../src/app/navGroups'

describe('grupos de la barra lateral', () => {
  it('abrir uno cierra los demás', () => {
    expect([...openOnly(new Set(['organizar', 'seguridad']), 'convertir')]).toEqual(['convertir'])
    expect([...toggleGroup(new Set(['organizar']), 'seguridad')]).toEqual(['seguridad'])
    expect([...toggleGroup(new Set<string>(), 'estudio')]).toEqual(['estudio'])
  })

  it('tocar el que está abierto lo cierra', () => {
    expect([...toggleGroup(new Set(['seguridad']), 'seguridad')]).toEqual([])
  })

  it('si ya es el único abierto, no cambia (mismo conjunto, sin volver a dibujar)', () => {
    const open = new Set(['seguridad'])
    expect(openOnly(open, 'seguridad')).toBe(open)
    expect(openOnly(new Set(['seguridad', 'organizar']), 'seguridad')).not.toBe(open)
  })
})
