import { beforeEach, describe, expect, it } from 'vitest'
import {
  CHAIN_MAX_AGE_MS,
  clearChainedFiles,
  clearHandOff,
  handOff,
  matchesAccept,
  peekHandOff,
  setChainedFiles,
  takeChainedFiles,
} from '../../../../src/shared/files/handoff'

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

const pdf = new File(['%PDF'], 'informe.pdf', { type: 'application/pdf' })
const png = new File(['x'], 'foto.png', { type: 'image/png' })

describe('matchesAccept', () => {
  it('entiende tipos, comodines y extensiones', () => {
    expect(matchesAccept(pdf, 'application/pdf')).toBe(true)
    expect(matchesAccept(png, 'application/pdf')).toBe(false)
    expect(matchesAccept(png, 'image/*')).toBe(true)
    expect(matchesAccept(pdf, 'image/*')).toBe(false)
    expect(matchesAccept(pdf, '*/*')).toBe(true)
    expect(matchesAccept(pdf, 'application/pdf,image/*')).toBe(true)
    expect(matchesAccept(new File(['x'], 'datos.7z'), '.zip,.7z')).toBe(true)
    expect(matchesAccept(new File(['x'], 'DATOS.ZIP'), '.zip,.7z')).toBe(true)
    expect(matchesAccept(pdf, '.zip,.7z')).toBe(false)
  })

  it('un accept vacío acepta todo', () => {
    expect(matchesAccept(pdf, '')).toBe(true)
  })
})

describe('traspaso encadenado (W-110)', () => {
  beforeEach(() => clearChainedFiles())

  it('lo recoge una sola vez la primera zona que lo acepta', () => {
    setChainedFiles([pdf])
    expect(takeChainedFiles('application/pdf', false)).toEqual([pdf])
    expect(takeChainedFiles('application/pdf', false)).toBeNull()
  })

  it('una zona que no lo acepta no lo consume: otra de la misma pantalla puede recogerlo', () => {
    setChainedFiles([pdf])
    expect(takeChainedFiles('image/png,image/jpeg', false)).toBeNull()
    expect(takeChainedFiles('application/pdf', false)).toEqual([pdf])
  })

  it('una zona de un solo archivo recibe solo el primero; una múltiple recibe todos los que acepta', () => {
    const other = new File(['%PDF'], 'otro.pdf', { type: 'application/pdf' })
    setChainedFiles([pdf, other, png])
    expect(takeChainedFiles('application/pdf', true)).toEqual([pdf, other])
    setChainedFiles([pdf, other])
    expect(takeChainedFiles('application/pdf', false)).toEqual([pdf])
  })

  it('caduca: pasado el tiempo ya no se entrega ni queda pendiente', () => {
    const t0 = 1_000_000
    setChainedFiles([pdf], t0)
    expect(takeChainedFiles('application/pdf', false, t0 + CHAIN_MAX_AGE_MS + 1)).toBeNull()
    expect(takeChainedFiles('application/pdf', false, t0 + 1)).toBeNull()
  })

  it('un traspaso sin archivos no deja nada pendiente', () => {
    setChainedFiles([pdf])
    setChainedFiles([])
    expect(takeChainedFiles('*/*', true)).toBeNull()
  })

  it('no interfiere con el traspaso de destino fijo', () => {
    handOff('pdf/editar', pdf)
    setChainedFiles([png])
    expect(peekHandOff('pdf/editar')).toBe(pdf)
    expect(takeChainedFiles('image/*', false)).toEqual([png])
    expect(peekHandOff('pdf/editar')).toBe(pdf)
    clearHandOff('pdf/editar')
  })
})
