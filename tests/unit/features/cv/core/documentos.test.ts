// Documentos tras la auditoría W-146.4: hoja de vida con Carta/A4, diseño, orden y secciones
// propias; cuenta de cobro con descuento, vencimiento, logo, historial, clientes y conceptos.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { describe, expect, it } from 'vitest'
import { layoutPdf } from '../../../../../src/features/convert/core/officePdf'
import {
  CV_ACCENTS,
  DEFAULT_ORDER,
  ENGLISH_CV_LABELS,
  cvLayoutOptions,
  cvPdfBlocks,
  cvPieces,
  cvSizes,
  cvWordDoc,
  defaultPaper,
  draftJson,
  emptyCv,
  emptyJob,
  normalizeOrder,
  paperSize,
  parseDraft,
  type CvData,
} from '../../../../../src/features/cv/core/cv'
import {
  ENGLISH_BILLING_LABELS,
  addToHistory,
  billingBlocks,
  convertDoc,
  emptyParty,
  parseClients,
  parseHistory,
  parseItems,
  rememberClient,
  rememberItems,
  totals,
  type BillingDoc,
} from '../../../../../src/features/billing/core/billing'

const cv = (patch: Partial<CvData> = {}): CvData => ({
  ...emptyCv(),
  name: 'Ana Pérez',
  summary: 'Analista de datos',
  experience: [{ ...emptyJob(), role: 'Analista', company: 'X', start: '2022', current: true, details: 'Tableros' }],
  skills: 'SQL',
  ...patch,
})
const sections = (d: CvData) => cvPieces(d, ENGLISH_CV_LABELS).filter((p) => p.kind === 'section').map((p) => (p as { text: string }).text)

async function pdfPage(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const vp = (await doc.getPage(1)).getViewport({ scale: 1 })
  await task.destroy()
  return [Math.round(vp.width), Math.round(vp.height)]
}

describe('hoja de vida: tamaño de la hoja', () => {
  it('Carta en los países que la usan y A4 en el resto', () => {
    expect(defaultPaper(['es-CO', 'es'])).toBe('letter')
    expect(defaultPaper(['en-US'])).toBe('letter')
    expect(defaultPaper(['es-ES'])).toBe('a4')
    expect(defaultPaper(['es', 'pt-BR'])).toBe('a4')
    expect(defaultPaper(['fr'])).toBe('a4')
    expect(paperSize('letter')).toEqual([612, 792])
  })

  it('el PDF y el Word salen con el mismo tamaño elegido', async () => {
    for (const paper of ['letter', 'a4'] as const) {
      const d = cv({ paper })
      const [w, h] = paperSize(paper)
      expect(await pdfPage(await layoutPdf(cvPdfBlocks(d, ENGLISH_CV_LABELS), cvLayoutOptions(d)))).toEqual([Math.round(w), Math.round(h)])
      expect(cvWordDoc(d, ENGLISH_CV_LABELS).page).toEqual({ width: w, height: h })
    }
  })
})

describe('hoja de vida: diseño', () => {
  it('el color de acento va en el nombre y los títulos; la letra y la plantilla compacta cambian tamaños', () => {
    const d = cv({ accent: CV_ACCENTS[2], font: 'serif', template: 'compacta' })
    const blocks = cvPdfBlocks(d, ENGLISH_CV_LABELS) as Array<{ kind: string; style?: string; runs?: Array<{ color?: string; size?: number }> }>
    expect(blocks.find((b) => b.style === 'title')!.runs![0]).toMatchObject({ color: CV_ACCENTS[2], size: cvSizes('compacta').name })
    expect(blocks.filter((b) => b.style === 'h2').every((b) => b.runs![0].color === CV_ACCENTS[2])).toBe(true)
    expect(cvSizes('compacta').body).toBeLessThan(cvSizes('ats').body)
    expect(cvLayoutOptions(d)).toMatchObject({ family: 'serif', margin: 43 })
    const word = cvWordDoc(d, ENGLISH_CV_LABELS)
    expect(word.bodyFamily).toBe('serif')
    expect(word.margins.top).toBe(43)
  })
})

describe('hoja de vida: orden y secciones propias', () => {
  it('respeta el orden elegido y agrega las secciones propias donde van', () => {
    const d = cv({ order: ['skills', 'custom', 'experience', 'profile', 'education', 'languages', 'courses', 'references'], custom: [{ title: 'Proyectos', body: '- App de inventario\n• Tablero de ventas' }, { title: '', body: '' }] })
    expect(sections(d)).toEqual(['Skills', 'Proyectos', 'Experience', 'Profile'])
    const bullets = cvPieces(d, ENGLISH_CV_LABELS).filter((p) => p.kind === 'bullet').map((p) => (p as { text: string }).text)
    expect(bullets).toContain('App de inventario')
    expect(bullets).toContain('Tablero de ventas')
  })

  it('el orden guardado se completa y limpia', () => {
    expect(normalizeOrder(['skills', 'skills', 'nada', 3])).toEqual(['skills', ...DEFAULT_ORDER.filter((s) => s !== 'skills')])
    expect(normalizeOrder(undefined)).toEqual([...DEFAULT_ORDER])
  })

  it('el borrador guarda y recupera todo lo nuevo; lo inválido vuelve al valor por defecto', () => {
    const d = cv({ paper: 'letter', accent: CV_ACCENTS[3], font: 'serif', template: 'compacta', custom: [{ title: 'Logros', body: 'Premio' }], order: ['custom', ...DEFAULT_ORDER.filter((s) => s !== 'custom')] })
    expect(parseDraft(draftJson(d))).toEqual(d)
    const bad = parseDraft(JSON.stringify({ app: 'docusmart-cv', cv: { ...d, accent: 'rojo', paper: 'A3', font: 'comic', template: 'x', order: 'mal' } }))!
    expect(bad).toMatchObject({ accent: CV_ACCENTS[0], paper: 'a4', font: 'sans', template: 'ats', order: [...DEFAULT_ORDER] })
  })
})

describe('cuenta de cobro: descuento, vencimiento y logo', () => {
  const doc = (patch: Partial<BillingDoc> = {}): BillingDoc => ({
    kind: 'cobro', number: 'CC-0001', date: '2026-11-22', city: 'Bogotá', validUntil: '', currency: 'COP',
    issuer: { ...emptyParty(), name: 'Ana' }, client: { ...emptyParty(), name: 'Cliente S.A.S.', id: '900' },
    items: [{ description: 'Diseño', qty: 2, price: 500_000 }], taxRate: 19, taxLabel: 'IVA', withholdingRate: 10, withholdingLabel: 'Retención', payment: 'Cuenta 123', notes: '', discountRate: 0, dueDate: '',
    ...patch,
  })

  it('el descuento va sobre el subtotal; impuesto y retención, sobre lo que queda', () => {
    expect(totals(doc().items, 19, 10, 'COP', 10)).toEqual({ subtotal: 1_000_000, discount: 100_000, tax: 171_000, withholding: 90_000, total: 981_000 })
    // Un descuento fuera de rango se limita a 0–100 %.
    expect(totals(doc().items, 0, 0, 'COP', 150).total).toBe(0)
    expect(totals(doc().items, 0, 0, 'COP', -5).discount).toBe(0)
  })

  it('el PDF muestra el logo, la fecha límite y la línea del descuento', () => {
    const logo = { data: new Uint8Array([1]), type: 'png' as const, width: 600, height: 200 }
    const blocks = billingBlocks(doc({ discountRate: 10, dueDate: '2026-12-01' }), ENGLISH_BILLING_LABELS, (n) => String(n), { dateText: (s) => s, logo })
    expect(blocks[0]).toMatchObject({ kind: 'image', width: 128, align: 'left' })
    const text = blocks.flatMap((b) => ('runs' in b ? b.runs.map((r) => r.text) : [])).join(' ')
    expect(text).toContain('Due date: 2026-12-01')
    expect(text).toContain('Discount (10 %)')
    expect(text).toContain('-100000')
    // En una cotización no se muestra la fecha límite de pago.
    const quote = billingBlocks(doc({ kind: 'cotizacion', dueDate: '2026-12-01' }), ENGLISH_BILLING_LABELS, String, { dateText: (s) => s })
    expect(quote.flatMap((b) => ('runs' in b ? b.runs.map((r) => r.text) : [])).join(' ')).not.toContain('Due date')
  })

  it('historial: sin datos de pago, el más reciente primero y sin repetir el mismo número', () => {
    let h = addToHistory([], doc(), '2026-11-22T10:00:00Z')
    h = addToHistory(h, doc({ number: 'CC-0002' }), '2026-11-22T11:00:00Z')
    h = addToHistory(h, doc({ notes: 'corregida' }), '2026-11-22T12:00:00Z')
    expect(h.map((e) => e.doc.number)).toEqual(['CC-0001', 'CC-0002'])
    expect(h[0].doc.notes).toBe('corregida')
    expect(JSON.stringify(h)).not.toContain('Cuenta 123')
    expect(h[0].total).toBe(1_090_000)
    expect(parseHistory(JSON.stringify(h))).toEqual(h)
    expect(parseHistory('no es json')).toEqual([])
    expect(parseHistory(JSON.stringify([{ doc: { kind: 'factura' } }, 3, null]))).toEqual([])
  })

  it('convertir una cotización en cuenta de cobro: mismo cliente y conceptos, número y fecha nuevos', () => {
    const [entry] = addToHistory([], doc({ kind: 'cotizacion', number: 'COT-0004', validUntil: '2026-12-30' }), 'x')
    const bill = convertDoc(entry, 'cobro', 'CC-0009', '2026-12-05')
    expect(bill).toMatchObject({ kind: 'cobro', number: 'CC-0009', date: '2026-12-05', validUntil: '', payment: '', client: { name: 'Cliente S.A.S.' } })
    expect(bill.items).toEqual(entry.doc.items)
  })

  it('clientes y conceptos recordados: sin repetir y con el último precio', () => {
    let clients = rememberClient([], { ...emptyParty(), name: 'Uno', id: '1' })
    clients = rememberClient(clients, { ...emptyParty(), name: 'Dos', id: '2' })
    clients = rememberClient(clients, { ...emptyParty(), name: 'uno ', id: '1', email: 'nuevo@x.co' })
    expect(clients.map((c) => c.email || c.name)).toEqual(['nuevo@x.co', 'Dos'])
    expect(rememberClient(clients, emptyParty())).toEqual(clients)
    expect(parseClients(JSON.stringify(clients))).toEqual(clients)
    let items = rememberItems([], [{ description: 'Diseño', qty: 1, price: 100 }, { description: ' ', qty: 1, price: 5 }])
    items = rememberItems(items, [{ description: 'diseño', qty: 1, price: 150 }, { description: 'Hosting', qty: 1, price: 20 }])
    expect(items).toEqual([{ description: 'diseño', price: 150 }, { description: 'Hosting', price: 20 }])
    expect(parseItems(JSON.stringify(items))).toEqual(items)
    expect(parseItems('{}')).toEqual([])
  })
})
