import { describe, expect, it } from 'vitest'
import { compareTexts, myersDiff, normalizeLine, reportText, type Line, type Op } from './pdfCompare'

const chars = (s: string) => s.split('')
/** Reconstruye ambas secuencias desde las operaciones, para verificar que el diff es correcto. */
function rebuild<T>(ops: Op<T>[]) {
  const a: T[] = []
  const b: T[] = []
  for (const o of ops) {
    if (o.type !== 'ins') a.push(...o.items)
    if (o.type !== 'del') b.push(...o.items)
  }
  return { a, b }
}
const edits = <T,>(ops: Op<T>[]) => ops.filter((o) => o.type !== 'same').reduce((n, o) => n + o.items.length, 0)

describe('myersDiff', () => {
  it('encuentra el diff mínimo del ejemplo clásico', () => {
    const ops = myersDiff(chars('ABCABBA'), chars('CBABAC'))!
    expect(edits(ops)).toBe(5)
    expect(rebuild(ops)).toEqual({ a: chars('ABCABBA'), b: chars('CBABAC') })
  })

  it('casos borde: vacíos, iguales, solo agregados o solo borrados', () => {
    expect(myersDiff([], [])).toEqual([])
    expect(myersDiff(chars('abc'), chars('abc'))).toEqual([{ type: 'same', items: chars('abc') }])
    expect(myersDiff([], chars('xy'))).toEqual([{ type: 'ins', items: chars('xy') }])
    expect(myersDiff(chars('xy'), [])).toEqual([{ type: 'del', items: chars('xy') }])
    expect(myersDiff(chars('axb'), chars('ab'))).toEqual([
      { type: 'same', items: ['a'] },
      { type: 'del', items: ['x'] },
      { type: 'same', items: ['b'] },
    ])
  })

  it('es correcto con secuencias al azar', () => {
    let seed = 7
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let t = 0; t < 40; t++) {
      const a = Array.from({ length: Math.floor(rnd() * 30) }, () => 'abc'[Math.floor(rnd() * 3)])
      const b = Array.from({ length: Math.floor(rnd() * 30) }, () => 'abc'[Math.floor(rnd() * 3)])
      expect(rebuild(myersDiff(a, b)!)).toEqual({ a, b })
    }
  })

  it('se rinde si hacen falta demasiados cambios', () => {
    expect(myersDiff(chars('aaaa'), chars('bbbb'), undefined, 3)).toBeNull()
  })
})

const lines = (page: number, ...texts: string[]): Line[] => texts.map((text) => ({ text, page }))

describe('compareTexts', () => {
  const base = [...lines(1, 'Contrato de arriendo', 'El canon es de 1.500.000 pesos', 'Pago el día 5'), ...lines(2, 'Firma del arrendador', 'Firma del arrendatario')]

  it('documentos iguales (aunque cambien espacios y líneas vacías)', () => {
    const c = compareTexts(base, [...base.map((l) => ({ ...l, text: `  ${l.text.replace(/ /g, '   ')} ` })), { text: '   ', page: 2 }])
    expect(c).toEqual({ identical: true, hunks: [], added: 0, removed: 0, tooDifferent: false })
  })

  it('marca la palabra cambiada, con contexto y páginas', () => {
    const b = base.map((l) => (l.text.startsWith('El canon') ? { ...l, text: 'El canon es de 1.800.000 pesos' } : l))
    const c = compareTexts(base, b)
    expect(c.identical).toBe(false)
    expect(c.hunks).toHaveLength(1)
    const [h] = c.hunks
    expect(h.segments).toEqual([
      { type: 'same', text: 'El canon es de' },
      { type: 'del', text: '1.500.000' },
      { type: 'ins', text: '1.800.000' },
      { type: 'same', text: 'pesos' },
    ])
    expect(h.before).toEqual(['Contrato de arriendo'])
    expect(h.after).toEqual(['Pago el día 5', 'Firma del arrendador'])
    expect([h.pageA, h.pageB]).toEqual([1, 1])
    expect([c.added, c.removed]).toEqual([1, 1])
  })

  it('un párrafo agregado no desordena el resto y conserva su página', () => {
    const b = [...base.slice(0, 3), { text: 'Cláusula nueva de mascotas', page: 2 }, ...base.slice(3)]
    const c = compareTexts(base, b)
    expect(c.hunks).toHaveLength(1)
    expect(c.hunks[0].segments).toEqual([{ type: 'ins', text: 'Cláusula nueva de mascotas' }])
    expect(c.hunks[0].pageB).toBe(2)
    expect(c.hunks[0].pageA).toBe(1)
    expect(c.added).toBe(4)
  })

  it('el mismo texto con otros saltos de línea no es un cambio', () => {
    const b = [...lines(1, 'Contrato de arriendo El canon es', 'de 1.500.000 pesos Pago el día 5'), ...base.slice(3)]
    expect(compareTexts(base, b).identical).toBe(true)
  })

  it('líneas quitadas al final del documento', () => {
    const c = compareTexts(base, base.slice(0, 3))
    expect(c.hunks[0].segments).toEqual([{ type: 'del', text: 'Firma del arrendador Firma del arrendatario' }])
    expect(c.hunks[0].pageA).toBe(2)
    expect(c.hunks[0].pageB).toBe(1)
    expect(c.hunks[0].after).toEqual([])
    expect(c.removed).toBe(6)
  })

  it('documento nuevo contra uno vacío', () => {
    const c = compareTexts([], lines(1, 'Hola'))
    expect(c.hunks[0]).toMatchObject({ pageA: 1, pageB: 1, segments: [{ type: 'ins', text: 'Hola' }] })
  })

  it('documentos completamente distintos y enormes se reportan sin colgar', () => {
    const a = Array.from({ length: 7000 }, (_, i) => ({ text: `a${i}`, page: 1 }))
    const b = Array.from({ length: 7000 }, (_, i) => ({ text: `b${i}`, page: 1 }))
    const c = compareTexts(a, b)
    expect(c.tooDifferent).toBe(true)
    expect([c.added, c.removed]).toEqual([7000, 7000])
  })

  it('normaliza los espacios', () => {
    expect(normalizeLine('  a \t b\n')).toBe('a b')
  })
})

describe('reportText', () => {
  it('describe los cambios con - y +', () => {
    const b = lines(1, 'Hola mundo cruel')
    const r = reportText(compareTexts(lines(1, 'Hola mundo'), b), 'v1.pdf', 'v2.pdf')
    expect(r).toContain('"v1.pdf" (original) con "v2.pdf"')
    expect(r).toContain('1 cambio: 1 palabras agregadas y 0 quitadas.')
    expect(r).toContain('── Cambio 1 · página 1 del original, 1 de la nueva versión')
    expect(r).toContain('+ cruel')
    expect(r).not.toContain('Hola mundo\n')
  })

  it('iguales, muy distintos y varios cambios', () => {
    expect(reportText(compareTexts(lines(1, 'a'), lines(1, 'a')), 'x', 'y')).toContain('es igual')
    expect(reportText({ identical: false, hunks: [], added: 0, removed: 0, tooDifferent: true }, 'x', 'y')).toContain('demasiado distintos')
    const r = reportText(compareTexts(lines(1, 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis'), lines(1, 'UNO', 'dos', 'tres', 'cuatro', 'cinco', 'SEIS')), 'x', 'y')
    expect(r).toContain('2 cambios')
    expect(r).toContain('- uno')
  })
})
