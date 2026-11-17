import { expect, it } from 'vitest'
import { linesToText } from '../../../../src/shared/pdf/textLayout'

it('deja una línea en blanco donde hay un salto vertical grande', () => {
  const text = linesToText([
    { text: 'Capítulo 1', y: 770, h: 20 },
    { text: 'Primer párrafo que llega', y: 720, h: 12 },
    { text: 'hasta el borde.', y: 702, h: 12 },
    { text: 'Segundo párrafo.', y: 666, h: 12 },
  ])
  expect(text).toBe('Capítulo 1\n\nPrimer párrafo que llega\nhasta el borde.\n\nSegundo párrafo.')
})

it('no separa con el interlineado normal ni con saltos hacia arriba (columnas)', () => {
  expect(linesToText([
    { text: 'uno', y: 700, h: 12 },
    { text: 'dos', y: 684, h: 12 },
    { text: 'tres', y: 760, h: 12 },
  ])).toBe('uno\ndos\ntres')
})

it('ignora líneas vacías y recorta', () => {
  expect(linesToText([])).toBe('')
  expect(linesToText([{ text: '  ', y: 0, h: 0 }, { text: 'a', y: -100, h: 0 }])).toBe('a')
})
