import { describe, expect, it } from 'vitest'
import { layoutPdf } from '../../../../../src/features/convert/core/officePdf'
import {
  ENGLISH_BILLING_LABELS,
  advanceCounter,
  amountInWordsEs,
  billingBlocks,
  billingFileName,
  emptyParty,
  formatMoney,
  formatNumber,
  integerToWordsEs,
  minorDigits,
  moneyLocale,
  parseAmount,
  parseCounters,
  totals,
  type BillingDoc,
} from '../../../../../src/features/billing/core/billing'

const doc = (over: Partial<BillingDoc> = {}): BillingDoc => ({
  kind: 'cobro',
  number: 'CC-0001',
  date: '2026-11-20',
  city: 'Bogotá',
  validUntil: '',
  currency: 'COP',
  issuer: { ...emptyParty(), name: 'Ana Pérez', idType: 'C.C.', id: '1.020.304', phone: '300 000 0000' },
  client: { ...emptyParty(), name: 'Empresa S.A.S.', idType: 'NIT', id: '900.123.456-7' },
  items: [{ description: 'Diseño de logo', qty: 1, price: 1_200_000 }],
  taxRate: 0,
  taxLabel: 'IVA',
  withholdingRate: 0,
  withholdingLabel: '',
  payment: 'Bancolombia ahorros 123-456789-00',
  notes: '',
  ...over,
})

describe('cantidades', () => {
  it('lee los formatos más comunes de números', () => {
    expect(parseAmount('1.500.000')).toBe(1_500_000)
    expect(parseAmount('1,500,000')).toBe(1_500_000)
    expect(parseAmount('1.500,50')).toBe(1500.5)
    expect(parseAmount('1,500.50')).toBe(1500.5)
    expect(parseAmount('12,5')).toBe(12.5)
    expect(parseAmount('12.5')).toBe(12.5)
    expect(parseAmount('$ 250.000')).toBe(250_000)
    expect(parseAmount('3')).toBe(3)
    expect(parseAmount('')).toBeNaN()
    expect(parseAmount('abc')).toBeNaN()
  })

  it('decimales según la moneda', () => {
    expect(minorDigits('COP')).toBe(0)
    expect(minorDigits('CLP')).toBe(0)
    expect(minorDigits('USD')).toBe(2)
    expect(minorDigits('EUR')).toBe(2)
    expect(minorDigits('XYZ')).toBe(2)
  })

  it('totales con impuesto y retención, redondeados a la moneda', () => {
    const items = [{ description: 'a', qty: 3, price: 33_333.33 }, { description: 'b', qty: 1, price: 0.4 }]
    expect(totals(items, 19, 11, 'COP')).toEqual({ subtotal: 100_000, discount: 0, tax: 19_000, withholding: 11_000, total: 108_000 })
    expect(totals([{ description: 'x', qty: 2, price: 10.005 }], 10, 0, 'USD')).toEqual({ subtotal: 20.01, discount: 0, tax: 2, withholding: 0, total: 22.01 })
    expect(totals([{ description: 'x', qty: Number.NaN, price: 5 }], Number.NaN, 0, 'USD').total).toBe(0)
  })

  it('formatea el dinero con la moneda y el idioma', () => {
    expect(formatMoney(1_200_000, 'COP', 'es-CO').replace(/\s/g, ' ')).toMatch(/1\.200\.000/)
    expect(formatMoney(1234.5, 'USD', 'en-US')).toBe('$1,234.50')
    expect(formatMoney(5, 'ZZ', 'es')).toBe('ZZ 5.00')
  })
})

describe('idioma del dinero', () => {
  it('usa la variante regional de la moneda si es del mismo idioma', () => {
    expect(moneyLocale('es', 'COP')).toBe('es-CO')
    expect(moneyLocale('es', 'MXN')).toBe('es-MX')
    expect(moneyLocale('pt', 'BRL')).toBe('pt-BR')
    expect(moneyLocale('en', 'COP')).toBe('en')
    expect(moneyLocale('es', 'EUR')).toBe('es')
    expect(formatMoney(1_890_000, 'COP', moneyLocale('es', 'COP'))).toMatch(/^\$\s?1\.890\.000$/)
  })

  it('la retención en el PDF lleva un guion que las fuentes del PDF sí tienen', () => {
    const text = JSON.stringify(billingBlocks(doc({ withholdingRate: 10 }), ENGLISH_BILLING_LABELS, (n) => String(n), { dateText: (d) => d }))
    expect(text).toContain('-120000')
    expect(text).not.toContain('−')
  })
})

describe('numeración', () => {
  it('formato y avance del contador', () => {
    expect(formatNumber('cobro', 7)).toBe('CC-0007')
    expect(formatNumber('cotizacion', 12345)).toBe('COT-12345')
    const c = parseCounters(JSON.stringify({ cobro: 3, recibo: 'x' }))
    expect(c).toEqual({ cobro: 3, cotizacion: 0, recibo: 0 })
    expect(advanceCounter(c, 'cobro', 'CC-0004').cobro).toBe(4)
    expect(advanceCounter(c, 'cobro', 'CC-0050').cobro).toBe(50)
    // Un número propio sin el prefijo cuenta como el siguiente; nunca retrocede.
    expect(advanceCounter(c, 'cobro', 'Factura 9').cobro).toBe(4)
    expect(advanceCounter(c, 'cobro', 'CC-0001').cobro).toBe(3)
    expect(parseCounters('roto')).toEqual({ cobro: 0, cotizacion: 0, recibo: 0 })
  })
})

describe('valor en letras', () => {
  it('números en español', () => {
    expect(integerToWordsEs(0)).toBe('cero')
    expect(integerToWordsEs(21)).toBe('veintiuno')
    expect(integerToWordsEs(100)).toBe('cien')
    expect(integerToWordsEs(101)).toBe('ciento uno')
    expect(integerToWordsEs(1000)).toBe('mil')
    expect(integerToWordsEs(21_000)).toBe('veintiún mil')
    expect(integerToWordsEs(1_200_000)).toBe('un millón doscientos mil')
    expect(integerToWordsEs(2_500_000_000)).toBe('dos mil quinientos millones')
    expect(integerToWordsEs(1_000_000_000_000)).toBe('un billón')
    expect(integerToWordsEs(999_999)).toBe('novecientos noventa y nueve mil novecientos noventa y nueve')
  })

  it('montos con la moneda, como en una cuenta de cobro', () => {
    expect(amountInWordsEs(1_200_000, 'COP')).toBe('Un millón doscientos mil pesos')
    expect(amountInWordsEs(2_000_000, 'COP')).toBe('Dos millones de pesos')
    expect(amountInWordsEs(1, 'USD')).toBe('Un dólar')
    expect(amountInWordsEs(120.5, 'USD')).toBe('Ciento veinte dólares con 50/100')
    expect(amountInWordsEs(21, 'EUR')).toBe('Veintiún euros')
  })
})

describe('documento PDF', () => {
  const fmt = (n: number) => formatMoney(n, 'COP', 'es-CO')
  const opts = { dateText: (d: string) => d, words: 'Un millón doscientos mil pesos' }

  it('la cuenta de cobro dice quién debe a quién y la suma en letras', () => {
    const blocks = billingBlocks(doc(), ENGLISH_BILLING_LABELS, fmt, opts)
    const text = JSON.stringify(blocks)
    expect(text).toContain('Bill for services')
    expect(text).toContain('Empresa S.A.S.')
    expect(text).toContain('OWES:')
    expect(text).toContain('Un millón doscientos mil pesos')
    expect(text).toContain('Bancolombia ahorros')
    expect(blocks.some((b) => b.kind === 'table')).toBe(true)
  })

  it('la cotización muestra la vigencia, el impuesto y la retención', () => {
    const blocks = billingBlocks(doc({ kind: 'cotizacion', validUntil: '2026-12-20', taxRate: 19, withholdingRate: 4 }), ENGLISH_BILLING_LABELS, fmt, { dateText: (d) => d })
    const text = JSON.stringify(blocks)
    expect(text).toContain('Valid until: 2026-12-20')
    expect(text).toContain('IVA (19 %)')
    expect(text).toContain('Withholding (4 %)')
    expect(text).not.toContain('OWES')
  })

  it('genera un PDF real con firma', async () => {
    // PNG de 1 × 1 transparente.
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))
    const blocks = billingBlocks(doc({ kind: 'recibo' }), ENGLISH_BILLING_LABELS, fmt, { ...opts, signature: { data: png, width: 1, height: 1 } })
    expect(blocks.some((b) => b.kind === 'image')).toBe(true)
    const pdf = await layoutPdf(blocks, { title: 'Receipt' })
    expect(new TextDecoder().decode(pdf.subarray(0, 5))).toBe('%PDF-')
  })

  it('imprime el tipo de documento de cada parte y el nombre de la retención del país', () => {
    const text = JSON.stringify(billingBlocks(doc({ withholdingRate: 11, withholdingLabel: 'Retención en la fuente' }), ENGLISH_BILLING_LABELS, fmt, opts))
    expect(text).toContain('C.C.: 1.020.304')
    expect(text).toContain('NIT: 900.123.456-7')
    expect(text).toContain('Retención en la fuente (11 %)')
    // Sin tipo elegido usa el nombre genérico.
    const generic = JSON.stringify(billingBlocks(doc({ client: { ...emptyParty(), name: 'X', id: '123' } }), ENGLISH_BILLING_LABELS, fmt, opts))
    expect(generic).toContain('ID / Tax ID: 123')
  })

  it('nombre del archivo', () => {
    expect(billingFileName(doc(), 'Cuenta de cobro')).toBe('cuenta-de-cobro-CC-0001.pdf')
    expect(billingFileName(doc({ number: 'A / 7' }), 'Cotización')).toBe('cotizacion-A_7.pdf')
    expect(billingFileName(doc({ number: '' }), '見積書')).toBe('documento.pdf')
  })
})
