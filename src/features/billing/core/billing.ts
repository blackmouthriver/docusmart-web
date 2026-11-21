/**
 * Cuentas de cobro, cotizaciones y recibos (W-130): totales, numeración, valor en letras y los
 * bloques del PDF. Partes puras, para poder probarlas; el PDF lo arma el generador de Word a PDF.
 * No es una factura electrónica: no reemplaza la facturación legal de cada país.
 */
import type { OBlock, OPara, ORun } from '../../convert/core/officePdf'

export type DocKind = 'cobro' | 'cotizacion' | 'recibo'
export const DOC_KINDS: readonly DocKind[] = ['cobro', 'cotizacion', 'recibo']
export const PREFIX: Record<DocKind, string> = { cobro: 'CC', cotizacion: 'COT', recibo: 'REC' }

/** `idType`: el documento según el país ("NIT", "C.C.", "RFC"…); vacío si no se eligió. */
export type Party = { name: string; idType: string; id: string; address: string; phone: string; email: string }
export type Item = { description: string; qty: number; price: number }
export type BillingDoc = {
  kind: DocKind
  number: string
  /** "AAAA-MM-DD" */
  date: string
  city: string
  /** Solo cotizaciones: válida hasta ("AAAA-MM-DD" o ""). */
  validUntil: string
  currency: string
  issuer: Party
  client: Party
  items: Item[]
  /** Impuesto en % (IVA…) y su nombre. */
  taxRate: number
  taxLabel: string
  /** Retención en % (se descuenta del total) y su nombre según el país ("Retención en la fuente"…). */
  withholdingRate: number
  withholdingLabel: string
  payment: string
  notes: string
}

export const emptyParty = (): Party => ({ name: '', idType: '', id: '', address: '', phone: '', email: '' })
export const CURRENCIES = ['COP', 'MXN', 'USD', 'EUR', 'ARS', 'CLP', 'PEN', 'BRL', 'GTQ', 'DOP', 'CRC', 'UYU', 'BOB', 'PYG', 'VES', 'HNL', 'NIO', 'GBP', 'CAD'] as const

/** Decimales de la moneda (COP y CLP no usan centavos en la práctica; USD sí). */
export function minorDigits(currency: string): number {
  if (currency === 'COP' || currency === 'CLP' || currency === 'PYG') return 0
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

export const roundTo = (n: number, digits: number) => {
  const k = 10 ** digits
  return Math.round((n + Number.EPSILON) * k) / k
}

/**
 * Cantidad o precio escrito a mano → número (o NaN). Acepta "1.500.000", "1,500,000", "1.500,50",
 * "1,500.50", "12,5" y "12.5": si hay dos separadores, el último es el decimal; si hay uno solo
 * seguido de exactamente tres cifras en grupos ("1.500", "2,000,000"), es de miles.
 */
export function parseAmount(text: string): number {
  const t = text.replace(/[^\d.,-]/g, '')
  if (!/\d/.test(t)) return Number.NaN
  const lastComma = t.lastIndexOf(',')
  const lastDot = t.lastIndexOf('.')
  let normalized: string
  if (lastComma > -1 && lastDot > -1) {
    const dec = lastComma > lastDot ? ',' : '.'
    normalized = t.replace(dec === ',' ? /\./g : /,/g, '').replace(dec, '.')
  } else {
    const sep = lastComma > -1 ? ',' : lastDot > -1 ? '.' : ''
    const thousands = sep && new RegExp(`^-?\\d{1,3}(\\${sep}\\d{3})+$`).test(t)
    normalized = !sep ? t : thousands ? t.split(sep).join('') : t.replace(sep, '.')
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : Number.NaN
}

export type Totals = { subtotal: number; tax: number; withholding: number; total: number }

/** Subtotal, impuesto y retención (sobre el subtotal) y total a pagar, redondeados a la moneda. */
export function totals(items: readonly Item[], taxRate: number, withholdingRate: number, currency: string): Totals {
  const d = minorDigits(currency)
  const subtotal = roundTo(items.reduce((s, i) => s + (Number.isFinite(i.qty) ? i.qty : 0) * (Number.isFinite(i.price) ? i.price : 0), 0), d)
  const tax = roundTo((subtotal * (Number.isFinite(taxRate) ? taxRate : 0)) / 100, d)
  const withholding = roundTo((subtotal * (Number.isFinite(withholdingRate) ? withholdingRate : 0)) / 100, d)
  return { subtotal, tax, withholding, total: roundTo(subtotal + tax - withholding, d) }
}

/** País de cada moneda latinoamericana, para escribir el monto como allá ("$ 1.890.000" y no "1.890.000 COP"). */
const CURRENCY_REGION: Record<string, string> = {
  COP: 'es-CO', MXN: 'es-MX', ARS: 'es-AR', CLP: 'es-CL', PEN: 'es-PE', GTQ: 'es-GT', DOP: 'es-DO', CRC: 'es-CR', UYU: 'es-UY', BOB: 'es-BO', PYG: 'es-PY', BRL: 'pt-BR',
  VES: 'es-VE', HNL: 'es-HN', NIO: 'es-NI',
}

/** Idioma para formatear el dinero: la variante regional de la moneda si es del mismo idioma ("es" + COP → "es-CO"). */
export function moneyLocale(lang: string, currency: string): string {
  const region = CURRENCY_REGION[currency]
  return region && region.split('-')[0] === lang.split('-')[0] ? region : lang
}

export function formatMoney(n: number, currency: string, locale: string): string {
  const d = minorDigits(currency)
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d }).format(n)
  } catch {
    return `${currency} ${n.toFixed(d)}`
  }
}

/** "CC-0007" */
export const formatNumber = (kind: DocKind, n: number) => `${PREFIX[kind]}-${String(Math.max(1, Math.floor(n))).padStart(4, '0')}`

export type Counters = Record<DocKind, number>
export const parseCounters = (json: string | null): Counters => {
  const base: Counters = { cobro: 0, cotizacion: 0, recibo: 0 }
  try {
    const raw = JSON.parse(json ?? '{}') as Record<string, unknown>
    for (const k of DOC_KINDS) if (Number.isInteger(raw?.[k]) && (raw[k] as number) >= 0) base[k] = raw[k] as number
  } catch {
    /* contadores dañados: se empieza de cero */
  }
  return base
}

/** Si se usó el número que tocaba, el contador avanza; si la persona escribió uno propio "PREFIJO-n", sigue desde ahí. */
export function advanceCounter(counters: Counters, kind: DocKind, used: string): Counters {
  const m = new RegExp(`^${PREFIX[kind]}-(\\d+)$`).exec(used.trim())
  const n = m ? Number(m[1]) : counters[kind] + 1
  return { ...counters, [kind]: Math.max(counters[kind], n) }
}

/* ───────────── Valor en letras (español) ───────────── */

const UNITS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function below1000(n: number): string {
  if (n === 100) return 'cien'
  const h = Math.floor(n / 100)
  const r = n % 100
  const rest = r < 30 ? UNITS[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? ` y ${UNITS[r % 10]}` : ''}`
  return [HUNDREDS[h], rest].filter(Boolean).join(' ')
}

/** "uno" pasa a "un" delante de mil/millón/sustantivo ("veintiún mil", "un millón"). */
const apocope = (s: string) => s.replace(/veintiuno$/, 'veintiún').replace(/(^|\s)uno$/, '$1un')

/** Número entero en palabras, en español (hasta billones). */
export function integerToWordsEs(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n === 0) return 'cero'
  const parts: string[] = []
  // En español, un billón es un millón de millones.
  const trillions = Math.floor(n / 1e12)
  const millions = Math.floor((n % 1e12) / 1e6) // 0 a 999 999 ("dos mil quinientos millones")
  const thousands = Math.floor((n % 1e6) / 1e3)
  const rest = n % 1e3
  if (trillions) parts.push(trillions === 1 ? 'un billón' : `${apocope(integerToWordsEs(trillions))} billones`)
  if (millions) parts.push(millions === 1 ? 'un millón' : `${apocope(integerToWordsEs(millions))} millones`)
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${apocope(below1000(thousands))} mil`)
  if (rest) parts.push(below1000(rest))
  return parts.join(' ')
}

const CURRENCY_WORDS: Record<string, [string, string]> = {
  COP: ['peso', 'pesos'], MXN: ['peso', 'pesos'], ARS: ['peso', 'pesos'], CLP: ['peso', 'pesos'], UYU: ['peso', 'pesos'], DOP: ['peso', 'pesos'],
  USD: ['dólar', 'dólares'], EUR: ['euro', 'euros'], PEN: ['sol', 'soles'], BRL: ['real', 'reales'], GTQ: ['quetzal', 'quetzales'],
  CRC: ['colón', 'colones'], BOB: ['boliviano', 'bolivianos'], PYG: ['guaraní', 'guaraníes'], GBP: ['libra', 'libras'],
  VES: ['bolívar', 'bolívares'], HNL: ['lempira', 'lempiras'], NIO: ['córdoba', 'córdobas'], CAD: ['dólar canadiense', 'dólares canadienses'],
}

/** "Un millón doscientos mil pesos" / "Ciento veinte dólares con 50/100" (como se escribe en una cuenta de cobro). */
export function amountInWordsEs(amount: number, currency: string): string {
  const d = minorDigits(currency)
  const whole = Math.floor(Math.abs(amount))
  const cents = Math.round((Math.abs(amount) - whole) * 100)
  const [one, many] = CURRENCY_WORDS[currency] ?? [currency, currency]
  let words = integerToWordsEs(whole)
  // "un millón de pesos", "dos millones de pesos": con millones redondos va "de".
  const roundMillions = whole >= 1e6 && whole % 1e6 === 0
  words = whole === 1 ? 'un' : apocope(words)
  let text = `${words}${roundMillions ? ' de' : ''} ${whole === 1 ? one : many}`
  if (d > 0 && cents) text += ` con ${String(cents).padStart(2, '0')}/100`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/* ───────────── PDF ───────────── */

export type BillingLabels = {
  title: Record<DocKind, string>
  number: string
  date: string
  city: string
  validUntil: string
  issuer: string
  client: string
  id: string
  phone: string
  email: string
  owes: string
  sumOf: string
  description: string
  qty: string
  unitPrice: string
  amount: string
  subtotal: string
  withholding: string
  total: string
  payment: string
  notes: string
  signature: string
  received: string
}

/** Etiquetas en inglés (referencia para pruebas). */
export const ENGLISH_BILLING_LABELS: BillingLabels = {
  title: { cobro: 'Bill for services', cotizacion: 'Quote', recibo: 'Receipt' },
  number: 'No.',
  date: 'Date',
  city: 'City',
  validUntil: 'Valid until',
  issuer: 'From',
  client: 'To',
  id: 'ID / Tax ID',
  phone: 'Phone',
  email: 'Email',
  owes: 'owes',
  sumOf: 'the sum of',
  description: 'Description',
  qty: 'Qty',
  unitPrice: 'Unit price',
  amount: 'Amount',
  subtotal: 'Subtotal',
  withholding: 'Withholding',
  total: 'Total',
  payment: 'Payment details',
  notes: 'Notes',
  signature: 'Signature',
  received: 'Received from',
}

const p = (runs: ORun[] | string, extra: Partial<OPara> = {}): OPara => ({ kind: 'para', runs: typeof runs === 'string' ? [{ text: runs }] : runs, ...extra })
const cell = (text: string, opts: { bold?: boolean; align?: 'left' | 'right' } = {}): OPara[] => [p([{ text, bold: opts.bold }], { align: opts.align })]

function partyLines(party: Party, l: BillingLabels): OPara[] {
  const out: OPara[] = []
  if (party.name.trim()) out.push(p([{ text: party.name.trim(), bold: true }]))
  if (party.id.trim()) out.push(p(`${party.idType.trim() || l.id}: ${party.id.trim()}`))
  if (party.address.trim()) out.push(p(party.address.trim()))
  const contact = [party.phone.trim() && `${l.phone}: ${party.phone.trim()}`, party.email.trim() && `${l.email}: ${party.email.trim()}`].filter(Boolean).join(' · ')
  if (contact) out.push(p(contact))
  return out
}

export type PdfSignature = { data: Uint8Array; width: number; height: number }

/**
 * Bloques del documento para el generador de PDF: título y número, emisor y cliente, la frase
 * de la cuenta de cobro (con el valor en letras si hay), la tabla de conceptos, los totales,
 * los datos de pago, las notas y la firma.
 */
export function billingBlocks(doc: BillingDoc, l: BillingLabels, fmt: (n: number) => string, opts: { dateText: (iso: string) => string; words?: string; signature?: PdfSignature }): OBlock[] {
  const t = totals(doc.items, doc.taxRate, doc.withholdingRate, doc.currency)
  const blocks: OBlock[] = []
  blocks.push(p([{ text: l.title[doc.kind], bold: true, size: 20 }], { style: 'title' }))
  const meta = [`${l.number} ${doc.number}`, `${l.date}: ${opts.dateText(doc.date)}`]
  if (doc.city.trim()) meta.push(`${l.city}: ${doc.city.trim()}`)
  if (doc.kind === 'cotizacion' && doc.validUntil) meta.push(`${l.validUntil}: ${opts.dateText(doc.validUntil)}`)
  blocks.push(p(meta.join('   ·   ')))
  blocks.push(p(' '))

  if (doc.kind === 'cobro') {
    // Como se escribe una cuenta de cobro: "CLIENTE debe a: EMISOR la suma de: $ … (… pesos)".
    blocks.push(p([{ text: doc.client.name.trim() || '—', bold: true }]))
    if (doc.client.id.trim()) blocks.push(p(`${doc.client.idType.trim() || l.id}: ${doc.client.id.trim()}`))
    blocks.push(p(' '))
    blocks.push(p([{ text: `${l.owes.toUpperCase()}:`, bold: true }]))
    blocks.push(...partyLines(doc.issuer, l))
    blocks.push(p(' '))
    blocks.push(p([{ text: `${l.sumOf.toUpperCase()}: `, bold: true }, { text: fmt(t.total), bold: true }, ...(opts.words ? [{ text: ` (${opts.words})` }] : [])]))
  } else {
    blocks.push(p([{ text: doc.kind === 'recibo' ? l.received : l.client, bold: true, size: 9 }]))
    blocks.push(...(partyLines(doc.client, l).length ? partyLines(doc.client, l) : [p('—')]))
    blocks.push(p(' '))
    blocks.push(p([{ text: l.issuer, bold: true, size: 9 }]))
    blocks.push(...partyLines(doc.issuer, l))
  }
  blocks.push(p(' '))

  const items = doc.items.filter((i) => i.description.trim() || i.price)
  blocks.push({
    kind: 'table',
    header: true,
    rows: [
      [cell(l.description, { bold: true }), cell(l.qty, { bold: true, align: 'right' }), cell(l.unitPrice, { bold: true, align: 'right' }), cell(l.amount, { bold: true, align: 'right' })],
      ...items.map((i) => [cell(i.description.trim() || '—'), cell(String(i.qty), { align: 'right' }), cell(fmt(i.price), { align: 'right' }), cell(fmt(roundTo(i.qty * i.price, minorDigits(doc.currency))), { align: 'right' })]),
    ],
  })
  const totalLine = (label: string, value: string, bold = false) => p([{ text: `${label}: `, bold }, { text: value, bold }], { align: 'right' })
  if (t.tax || t.withholding) blocks.push(totalLine(l.subtotal, fmt(t.subtotal)))
  if (t.tax) blocks.push(totalLine(`${doc.taxLabel.trim() || 'IVA'} (${doc.taxRate} %)`, fmt(t.tax)))
  // Guion común y no "−" (U+2212): las fuentes estándar del PDF no lo tienen y se borraría.
  if (t.withholding) blocks.push(totalLine(`${doc.withholdingLabel.trim() || l.withholding} (${doc.withholdingRate} %)`, `-${fmt(t.withholding)}`))
  blocks.push(totalLine(l.total, fmt(t.total), true))
  if (opts.words && doc.kind !== 'cobro') blocks.push(p([{ text: opts.words, italic: true, size: 9 }], { align: 'right' }))

  if (doc.payment.trim()) {
    blocks.push(p(' '), p([{ text: l.payment, bold: true }]))
    for (const line of doc.payment.trim().split('\n')) blocks.push(p(line || ' '))
  }
  if (doc.notes.trim()) {
    blocks.push(p(' '), p([{ text: l.notes, bold: true }]))
    for (const line of doc.notes.trim().split('\n')) blocks.push(p(line || ' '))
  }

  blocks.push(p(' '), p(' '))
  if (opts.signature) {
    // La firma a unos 5 cm de ancho, sin pasar de 2 cm de alto.
    const k = Math.min(140 / opts.signature.width, 56 / opts.signature.height)
    blocks.push({ kind: 'image', type: 'png', data: opts.signature.data, width: Math.round(opts.signature.width * k), height: Math.round(opts.signature.height * k), align: 'left' })
  } else blocks.push(p(' '), p(' '))
  blocks.push(p('______________________________'))
  blocks.push(p([{ text: doc.issuer.name.trim() || l.signature, bold: true }]))
  if (doc.issuer.id.trim()) blocks.push(p(`${doc.issuer.idType.trim() || l.id}: ${doc.issuer.id.trim()}`))
  return blocks
}

/** "cuenta-de-cobro-CC-0007.pdf" */
export function billingFileName(doc: BillingDoc, kindLabel: string): string {
  const slug = kindLabel
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const num = doc.number.trim().replace(/[\\/:*?"<>|\s]+/g, '_')
  return `${[slug || 'documento', num].filter(Boolean).join('-')}.pdf`
}
