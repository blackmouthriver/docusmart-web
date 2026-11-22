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
  /** Descuento en % sobre el subtotal (W-146.4). */
  discountRate?: number
  /** Fecha límite de pago ("AAAA-MM-DD" o ""), para cuentas de cobro. */
  dueDate?: string
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

export type Totals = { subtotal: number; discount: number; tax: number; withholding: number; total: number }

const pct = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0)

/**
 * Subtotal, descuento (sobre el subtotal), impuesto y retención (sobre el subtotal ya con el
 * descuento) y total a pagar, redondeados a la moneda.
 */
export function totals(items: readonly Item[], taxRate: number, withholdingRate: number, currency: string, discountRate = 0): Totals {
  const d = minorDigits(currency)
  const subtotal = roundTo(items.reduce((s, i) => s + (Number.isFinite(i.qty) ? i.qty : 0) * (Number.isFinite(i.price) ? i.price : 0), 0), d)
  const discount = roundTo((subtotal * pct(discountRate)) / 100, d)
  const base = subtotal - discount
  const tax = roundTo((base * (Number.isFinite(taxRate) ? taxRate : 0)) / 100, d)
  const withholding = roundTo((base * (Number.isFinite(withholdingRate) ? withholdingRate : 0)) / 100, d)
  return { subtotal, discount, tax, withholding, total: roundTo(base + tax - withholding, d) }
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
  discount?: string
  dueDate?: string
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
  discount: 'Discount',
  dueDate: 'Due date',
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
/** Logo de quien cobra (PNG o JPG). */
export type PdfLogo = { data: Uint8Array; type: 'png' | 'jpg'; width: number; height: number }

/**
 * Bloques del documento para el generador de PDF: título y número, emisor y cliente, la frase
 * de la cuenta de cobro (con el valor en letras si hay), la tabla de conceptos, los totales,
 * los datos de pago, las notas y la firma.
 */
export function billingBlocks(doc: BillingDoc, l: BillingLabels, fmt: (n: number) => string, opts: { dateText: (iso: string) => string; words?: string; signature?: PdfSignature; logo?: PdfLogo }): OBlock[] {
  const t = totals(doc.items, doc.taxRate, doc.withholdingRate, doc.currency, doc.discountRate ?? 0)
  const blocks: OBlock[] = []
  if (opts.logo) {
    // El logo arriba a la izquierda, sin pasar de 4,5 cm de ancho ni 2 cm de alto.
    const k = Math.min(1, 128 / opts.logo.width, 57 / opts.logo.height)
    blocks.push({ kind: 'image', type: opts.logo.type, data: opts.logo.data, width: Math.round(opts.logo.width * k), height: Math.round(opts.logo.height * k), align: 'left' })
  }
  blocks.push(p([{ text: l.title[doc.kind], bold: true, size: 20 }], { style: 'title' }))
  const meta = [`${l.number} ${doc.number}`, `${l.date}: ${opts.dateText(doc.date)}`]
  if (doc.city.trim()) meta.push(`${l.city}: ${doc.city.trim()}`)
  if (doc.kind === 'cotizacion' && doc.validUntil) meta.push(`${l.validUntil}: ${opts.dateText(doc.validUntil)}`)
  if (doc.kind === 'cobro' && doc.dueDate) meta.push(`${l.dueDate ?? 'Due date'}: ${opts.dateText(doc.dueDate)}`)
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
  if (t.tax || t.withholding || t.discount) blocks.push(totalLine(l.subtotal, fmt(t.subtotal)))
  if (t.discount) blocks.push(totalLine(`${l.discount ?? 'Discount'} (${doc.discountRate} %)`, `-${fmt(t.discount)}`))
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

/* ───────────── Historial, clientes y conceptos guardados (W-146.4) ───────────── */

/**
 * Un documento emitido, para verlo de nuevo o convertirlo (una cotización en cuenta de cobro o
 * recibo). Los datos para el pago no se guardan nunca: son un dato financiero.
 */
export type HistoryEntry = { id: string; savedAt: string; doc: Omit<BillingDoc, 'payment'>; total: number }
export type SavedItem = { description: string; price: number }

const MAX_HISTORY = 50
const MAX_CLIENTS = 30
const MAX_ITEMS = 60

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object'
const text = (v: unknown, max = 400) => (typeof v === 'string' ? v.slice(0, max) : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const party = (v: unknown): Party => {
  const o = isObj(v) ? v : {}
  return { name: text(o.name, 120), idType: text(o.idType, 30), id: text(o.id, 60), address: text(o.address, 160), phone: text(o.phone, 40), email: text(o.email, 120) }
}
const parseList = (json: string | null): unknown[] => {
  try {
    const v = JSON.parse(json ?? '[]') as unknown
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Lee el historial guardado (lo dañado o desconocido se descarta). */
export function parseHistory(json: string | null): HistoryEntry[] {
  return parseList(json)
    .filter(isObj)
    .flatMap((e): HistoryEntry[] => {
      const d = isObj(e.doc) ? e.doc : null
      if (!d || !DOC_KINDS.includes(d.kind as DocKind)) return []
      const items = (Array.isArray(d.items) ? d.items : []).filter(isObj).slice(0, 200).map((i) => ({ description: text(i.description, 200), qty: num(i.qty), price: num(i.price) }))
      const doc: Omit<BillingDoc, 'payment'> = {
        kind: d.kind as DocKind, number: text(d.number, 30), date: text(d.date, 10), city: text(d.city, 60), validUntil: text(d.validUntil, 10), currency: text(d.currency, 3) || 'COP',
        issuer: party(d.issuer), client: party(d.client), items, taxRate: num(d.taxRate), taxLabel: text(d.taxLabel, 20), withholdingRate: num(d.withholdingRate), withholdingLabel: text(d.withholdingLabel, 60),
        notes: text(d.notes, 2000), discountRate: num(d.discountRate), dueDate: text(d.dueDate, 10),
      }
      return [{ id: text(e.id, 40) || `${doc.kind}-${doc.number}`, savedAt: text(e.savedAt, 30), doc, total: num(e.total) }]
    })
    .slice(0, MAX_HISTORY)
}

/** Agrega (o reemplaza, si es el mismo tipo y número) un documento al principio del historial. */
export function addToHistory(list: readonly HistoryEntry[], doc: BillingDoc, savedAt: string): HistoryEntry[] {
  const { payment: _payment, ...rest } = doc
  const t = totals(doc.items, doc.taxRate, doc.withholdingRate, doc.currency, doc.discountRate ?? 0)
  const id = `${doc.kind}-${doc.number}`
  return [{ id, savedAt, doc: rest, total: t.total }, ...list.filter((e) => e.id !== id)].slice(0, MAX_HISTORY)
}

/** Una cotización (u otro documento) convertida en otro tipo: mismo cliente y conceptos, número y fecha nuevos. */
export function convertDoc(entry: HistoryEntry, kind: DocKind, number: string, date: string): BillingDoc {
  return { ...entry.doc, kind, number, date, validUntil: '', dueDate: '', payment: '' }
}

/** Clientes recordados: el más reciente primero, sin repetir (mismo nombre y documento). */
export function rememberClient(list: readonly Party[], client: Party): Party[] {
  if (!client.name.trim()) return [...list]
  const key = (p: Party) => `${p.name.trim().toLowerCase()}|${p.id.trim()}`
  return [client, ...list.filter((p) => key(p) !== key(client))].slice(0, MAX_CLIENTS)
}
export const parseClients = (json: string | null): Party[] => parseList(json).filter(isObj).map(party).filter((p) => p.name.trim()).slice(0, MAX_CLIENTS)

/** Conceptos recordados con su último precio, para escribirlos más rápido. */
export function rememberItems(list: readonly SavedItem[], items: readonly Item[]): SavedItem[] {
  const fresh = items.filter((i) => i.description.trim()).map((i) => ({ description: i.description.trim(), price: i.price }))
  const seen = new Set(fresh.map((i) => i.description.toLowerCase()))
  return [...fresh, ...list.filter((i) => !seen.has(i.description.toLowerCase()))].slice(0, MAX_ITEMS)
}
export const parseItems = (json: string | null): SavedItem[] =>
  parseList(json).filter(isObj).map((i) => ({ description: text(i.description, 200), price: num(i.price) })).filter((i) => i.description.trim()).slice(0, MAX_ITEMS)
