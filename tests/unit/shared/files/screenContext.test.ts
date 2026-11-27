// Contexto de la pantalla para el asistente (W-151.6).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SCREEN_ERROR_MAX_AGE_MS, reportError, reportFiles, resetScreenContext, screenSnapshot } from '../../../../src/shared/files/screenContext'

describe('contexto de la pantalla (W-151.6)', () => {
  const loc = { pathname: '/app/', hash: '#/pdf/dividir' }
  beforeEach(() => {
    resetScreenContext()
    vi.stubGlobal('location', loc)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('guarda solo nombre, tipo y tamaño de los archivos, y el último error', () => {
    reportFiles([new File(['%PDF-1.7 contenido secreto'], 'contrato.pdf', { type: 'application/pdf' })])
    reportError('pdf-protegido', 'El PDF tiene contraseña.', 1000)
    const snap = screenSnapshot(2000)
    expect(snap.files).toEqual([{ name: 'contrato.pdf', type: 'application/pdf', size: 26 }])
    expect(JSON.stringify(snap)).not.toContain('secreto')
    expect(snap.error).toEqual({ entry: 'pdf-protegido', message: 'El PDF tiene contraseña.' })
  })

  it('el error vence a los 10 minutos y elegir otro archivo lo borra', () => {
    reportError('pdf-danado', 'Dañado', 0)
    expect(screenSnapshot(SCREEN_ERROR_MAX_AGE_MS + 1).error).toBeNull()
    reportError('pdf-danado', 'Dañado', 0)
    reportFiles([])
    expect(screenSnapshot(1).error).toBeNull()
  })

  it('vale solo para la pantalla donde ocurrió', () => {
    reportError('pdf-danado', 'Dañado')
    loc.hash = '#/pdf/unir'
    expect(screenSnapshot()).toEqual({ files: [], error: null, result: null })
  })
})
