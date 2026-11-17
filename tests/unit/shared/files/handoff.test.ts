import { expect, it } from 'vitest'
import { clearHandOff, handOff, peekHandOff } from '../../../../src/shared/files/handoff'

it('entrega el archivo solo a la pantalla indicada y una sola vez', () => {
  const file = new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })
  expect(peekHandOff('pdf/editar')).toBeNull()
  handOff('pdf/editar', file)
  expect(peekHandOff('otra')).toBeNull()
  expect(peekHandOff('pdf/editar')).toBe(file)
  expect(peekHandOff('pdf/editar')).toBe(file)
  clearHandOff('otra')
  expect(peekHandOff('pdf/editar')).toBe(file)
  clearHandOff('pdf/editar')
  expect(peekHandOff('pdf/editar')).toBeNull()
})
