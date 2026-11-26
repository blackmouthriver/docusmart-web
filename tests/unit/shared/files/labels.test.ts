// Nombres cortos para varios archivos juntos: que se vea lo que diferencia a cada uno.
import { describe, expect, it } from 'vitest'
import { distinctLabels, middleEllipsis } from '../../../../src/shared/files/files'

describe('nombres en mosaicos', () => {
  it('recorta por el medio y deja ver el final', () => {
    expect(middleEllipsis('informe.pdf', 18)).toBe('informe.pdf')
    const r = middleEllipsis('contrato-de-arrendamiento-pagina-3.pdf', 18)
    expect(r).toHaveLength(18)
    expect(r.endsWith('pagina-3.pdf')).toBe(true)
    expect(r).toContain('…')
  })

  it('con un comienzo común, muestra desde la última palabra común', () => {
    const names = [1, 2, 10].map((n) => `contrato-de-arrendamiento-pagina-${n}.pdf`)
    expect(distinctLabels(names)).toEqual(['pagina-1.pdf', 'pagina-2.pdf', 'pagina-10.pdf'])
    expect(distinctLabels(['largo-pagina-1.png', 'largo-pagina-2.png'])).toEqual(['pagina-1.png', 'pagina-2.png'])
  })

  it('nombres distintos o uno solo: tal cual (recortados si son muy largos)', () => {
    expect(distinctLabels(['foto.jpg', 'escaneo.pdf'])).toEqual(['foto.jpg', 'escaneo.pdf'])
    expect(distinctLabels(['un-nombre-de-archivo-muy-largo-de-verdad.pdf'])[0]).toHaveLength(18)
    expect(distinctLabels([])).toEqual([])
  })
})
