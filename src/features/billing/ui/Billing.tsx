// Cuentas de cobro, cotizaciones y recibos (W-130): un formulario que arma el PDF en el navegador.
// Los datos de quien cobra (y los de pago) se pueden recordar en este navegador; nada se sube.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useApp } from '../../../app/state'
import { Icon } from '../../../shared/ui/Icon'
import { BusyButton, HeroCard, Notice, Segmented, errorMessage } from '../../../shared/ui/ui'
import { DocPreview, SaveOptions } from '../../../shared/ui/DocPreview'
import { track } from '../../../shared/platform/analytics'
import { tr } from '../../../shared/i18n/translate'
import { useT } from '../../../shared/i18n/I18n'
import type { MessageKey } from '../../../shared/i18n/messages/es'
import {
  CURRENCIES,
  DOC_KINDS,
  ENGLISH_BILLING_LABELS,
  advanceCounter,
  amountInWordsEs,
  billingBlocks,
  billingFileName,
  emptyParty,
  formatMoney,
  formatNumber,
  minorDigits,
  moneyLocale,
  parseAmount,
  parseCounters,
  roundTo,
  totals,
  type BillingDoc,
  type BillingLabels,
  type DocKind,
  type Item,
  type Party,
} from '../core/billing'
import { isWinAnsi } from '../../integrity/core/certificate'
import type { Signature } from '../../pdf/ui/SignTool'
import { COUNTRIES, countryFromLocale, countryName, defaultIdType, findCountry, idsFor, matchCountry, type Country } from '../core/countries'

const SignatureEditor = lazy(() => import('../../pdf/ui/SignTool').then((m) => ({ default: m.SignatureEditor })))

const ISSUER_KEY = 'ds-billing-issuer'
const COUNTERS_KEY = 'ds-billing-counters'

// La cuenta para el pago ("Datos para el pago") nunca se guarda: es un dato financiero y queda solo en pantalla.
type Saved = { issuer: Party; currency: string; city: string; taxLabel: string; country: string }
const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* sin almacenamiento: quedan solo por esta visita */
  }
}
function readSaved(): Saved | null {
  try {
    const s = JSON.parse(read(ISSUER_KEY) ?? 'null') as Partial<Saved> | null
    if (!s || typeof s !== 'object') return null
    return { issuer: { ...emptyParty(), ...(s.issuer ?? {}) }, currency: String(s.currency ?? 'COP'), city: String(s.city ?? ''), taxLabel: String(s.taxLabel ?? ''), country: String(s.country ?? '') }
  } catch {
    return null
  }
}

type Row = { description: string; qty: string; price: string }
const emptyRow = (): Row => ({ description: '', qty: '1', price: '' })
const toItems = (rows: Row[]): Item[] => rows.map((r) => ({ description: r.description, qty: parseAmount(r.qty) || 0, price: parseAmount(r.price) || 0 }))
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const KIND_LABEL: Record<DocKind, MessageKey> = { cobro: 'bill.kind.cobro', cotizacion: 'bill.kind.cotizacion', recibo: 'bill.kind.recibo' }

export function BillingScreen() {
  return (
    <>
      <HeroCard title={tr('tools.billing')} subtitle={tr('tools.billing.desc')} />
      <BillingTool />
    </>
  )
}

export function BillingTool() {
  const { toast } = useApp()
  const { lang } = useT()
  const saved = useMemo(readSaved, [])
  // País: el guardado o el del idioma del navegador ("es-CO" → Colombia).
  const initialCountry = findCountry(saved?.country) ?? findCountry(countryFromLocale(typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]))
  const [country, setCountry] = useState<Country | null>(initialCountry)
  const names = useMemo(() => COUNTRIES.map((c) => ({ code: c.code, name: countryName(c.code, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang)), [lang])
  const [countryText, setCountryText] = useState(() => (initialCountry ? countryName(initialCountry.code, lang) : ''))
  const [counters, setCounters] = useState(() => parseCounters(read(COUNTERS_KEY)))
  const [kind, setKind] = useState<DocKind>('cobro')
  const [number, setNumber] = useState(() => formatNumber('cobro', counters.cobro + 1))
  const [date, setDate] = useState(today)
  const [city, setCity] = useState(saved?.city ?? '')
  const [validUntil, setValidUntil] = useState('')
  const [currency, setCurrency] = useState(saved?.currency ?? initialCountry?.currency ?? 'COP')
  const [issuer, setIssuer] = useState<Party>(saved?.issuer ?? { ...emptyParty(), idType: defaultIdType(initialCountry, 'persona') })
  const [client, setClient] = useState<Party>(() => ({ ...emptyParty(), idType: defaultIdType(initialCountry, 'empresa') }))
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [taxLabel, setTaxLabel] = useState(saved?.taxLabel || initialCountry?.tax.label || 'IVA')
  const [taxRate, setTaxRate] = useState('')
  const [withholding, setWithholding] = useState('')
  const [payment, setPayment] = useState('')
  const [notes, setNotes] = useState('')
  // Recordar es una decisión de la persona: viene desmarcado, salvo que ya lo hubiera activado antes.
  const [remember, setRemember] = useState(saved !== null)
  const [signature, setSignature] = useState<Signature | null>(null)
  const [signing, setSigning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<File | null>(null)

  /**
   * Al elegir el país se llenan la moneda, el nombre del impuesto y los tipos de documento. La tarifa
   * no se pone sola (muchos independientes no cobran impuesto): se ofrece con un botón.
   */
  const applyCountry = (c: Country) => {
    setCountry(c)
    setCurrency(c.currency)
    setTaxLabel(c.tax.label)
    const keep = (party: Party, who: 'persona' | 'empresa') => (c.ids.some((i) => i.code === party.idType) ? party.idType : defaultIdType(c, who))
    setIssuer((p) => ({ ...p, idType: keep(p, 'persona') }))
    setClient((p) => ({ ...p, idType: keep(p, 'empresa') }))
  }
  const typeCountry = (text: string) => {
    setCountryText(text)
    const code = matchCountry(text, names)
    if (code && code !== country?.code) applyCountry(findCountry(code)!)
    if (!text.trim()) setCountry(null)
  }

  // Al cambiar de tipo, si el número era el sugerido, se sugiere el del nuevo tipo.
  const pickKind = (k: DocKind) => {
    if (number === formatNumber(kind, counters[kind] + 1)) setNumber(formatNumber(k, counters[k] + 1))
    setKind(k)
  }
  useEffect(() => setOutput(null), [kind, number, date, city, validUntil, currency, issuer, client, rows, taxLabel, taxRate, withholding, payment, notes, signature, country])

  const items = toItems(rows)
  const t = totals(items, parseAmount(taxRate) || 0, parseAmount(withholding) || 0, currency)
  const money = (n: number) => formatMoney(n, currency, moneyLocale(lang, currency))
  const hasItem = items.some((i) => i.price > 0 && i.qty > 0)

  const setRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const doc: BillingDoc = {
        kind,
        number: number.trim(),
        date,
        city,
        validUntil: kind === 'cotizacion' ? validUntil : '',
        currency,
        issuer,
        client,
        items,
        taxRate: parseAmount(taxRate) || 0,
        taxLabel,
        withholdingRate: parseAmount(withholding) || 0,
        withholdingLabel: country?.withholding ?? '',
        payment,
        notes,
      }
      const local: BillingLabels = {
        title: { cobro: tr('bill.kind.cobro'), cotizacion: tr('bill.kind.cotizacion'), recibo: tr('bill.kind.recibo') },
        number: tr('bill.pdf.no'),
        date: tr('bill.date'),
        city: tr('bill.city'),
        validUntil: tr('bill.validUntil'),
        issuer: tr('bill.issuerPdf'),
        client: tr('bill.client'),
        id: tr('bill.id'),
        phone: tr('bill.phone'),
        email: tr('bill.email'),
        owes: tr('bill.pdf.owes'),
        sumOf: tr('bill.pdf.sumOf'),
        description: tr('bill.description'),
        qty: tr('bill.qty'),
        unitPrice: tr('bill.price'),
        amount: tr('bill.lineTotal'),
        subtotal: tr('bill.subtotal'),
        withholding: tr('bill.withholdingPdf'),
        total: tr('bill.total'),
        payment: tr('bill.payment'),
        notes: tr('bill.notes'),
        signature: tr('bill.signature'),
        received: tr('bill.receivedFrom'),
      }
      // Las fuentes estándar del PDF solo cubren el alfabeto latino: si no, los títulos van en inglés.
      const latin = isWinAnsi(JSON.stringify(local))
      const labels = latin ? local : ENGLISH_BILLING_LABELS
      const dateLocale = latin ? lang : 'en'
      const [{ layoutPdf }, { imageSize }] = await Promise.all([import('../../convert/core/officePdf'), import('../../convert/core/officeModels')])
      const sigSize = signature ? imageSize(signature.png) : null
      const blocks = billingBlocks(doc, labels, (n) => formatMoney(n, currency, latin ? moneyLocale(lang, currency) : 'en'), {
        dateText: (iso) => (iso ? new Date(`${iso}T12:00`).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }) : ''),
        words: lang.startsWith('es') ? amountInWordsEs(t.total, currency) : undefined,
        signature: signature && sigSize ? { data: signature.png, width: sigSize.width, height: sigSize.height } : undefined,
      })
      const pdf = await layoutPdf(blocks, { title: `${labels.title[kind]} ${doc.number}`.trim() })
      setOutput(new File([pdf as BlobPart], billingFileName(doc, labels.title[kind]), { type: 'application/pdf' }))
      // Numeración y datos recordados.
      const next = advanceCounter(counters, kind, doc.number)
      setCounters(next)
      write(COUNTERS_KEY, JSON.stringify(next))
      write(ISSUER_KEY, remember ? JSON.stringify({ issuer, currency, city, taxLabel, country: country?.code ?? '' } satisfies Saved) : null)
      track('billing_created', { kind, items: items.length, currency, tax: doc.taxRate > 0, signed: !!signature })
      toast(tr('common.doneReview'))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const newDocument = () => {
    setClient({ ...emptyParty(), idType: defaultIdType(country, 'empresa') })
    setRows([emptyRow()])
    setNotes('')
    setValidUntil('')
    setNumber(formatNumber(kind, counters[kind] + 1))
    setDate(today())
    setOutput(null)
  }

  /** Documentos del país (los de persona y empresa), el que ya estaba elegido y "Otro". */
  const idOptions = (current: string) => {
    const list = country ? [...idsFor(country, 'persona'), ...idsFor(country, 'empresa')].filter((x, i, a) => a.findIndex((y) => y.code === x.code) === i) : []
    const opts = list.map((i) => ({ code: i.code, label: i.name === i.code ? i.code : `${i.name} (${i.code})` }))
    if (current && !opts.some((o) => o.code === current)) opts.push({ code: current, label: current })
    return [...opts, { code: '', label: tr('bill.idOther') }]
  }

  const party = (value: Party, set: (p: Party) => void, title: string, auto: boolean) => (
    <fieldset className="bill-party">
      <legend>{title}</legend>
      <label className="field"><span>{tr('bill.name')}</span><input className="input" value={value.name} maxLength={120} autoComplete={auto ? 'name' : 'off'} onChange={(e) => set({ ...value, name: e.target.value })} /></label>
      <div className="row bill-two">
        <label className="field bill-idtype">
          <span>{tr('bill.idType')}</span>
          <select className="input" value={value.idType} onChange={(e) => set({ ...value, idType: e.target.value })}>
            {idOptions(value.idType).map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
          </select>
        </label>
        <label className="field"><span>{tr('bill.idNumber')}</span><input className="input" value={value.id} maxLength={60} onChange={(e) => set({ ...value, id: e.target.value })} /></label>
      </div>
      <label className="field"><span>{tr('bill.address')}</span><input className="input" value={value.address} maxLength={160} autoComplete={auto ? 'street-address' : 'off'} onChange={(e) => set({ ...value, address: e.target.value })} /></label>
      <div className="row bill-two">
        <label className="field"><span>{tr('bill.phone')}</span><input className="input" type="tel" value={value.phone} maxLength={40} autoComplete={auto ? 'tel' : 'off'} onChange={(e) => set({ ...value, phone: e.target.value })} /></label>
        <label className="field"><span>{tr('bill.email')}</span><input className="input" type="email" value={value.email} maxLength={120} autoComplete={auto ? 'email' : 'off'} onChange={(e) => set({ ...value, email: e.target.value })} /></label>
      </div>
    </fieldset>
  )

  return (
    <div className="stack">
      <div className="card stack">
        <div className="field">
          <span>{tr('bill.kind')}</span>
          <Segmented label={tr('bill.kind')} value={kind} onChange={pickKind} options={DOC_KINDS.map((k) => ({ value: k, label: tr(KIND_LABEL[k]) }))} />
          <small className="faint">{tr(`bill.kindHint.${kind}` as MessageKey)}</small>
        </div>
        <div className="field bill-country">
          <label htmlFor="bill-country">{tr('bill.country')}</label>
          <input id="bill-country" className="input" list="bill-countries" value={countryText} placeholder={tr('bill.countryPh')} autoComplete="off" onChange={(e) => typeCountry(e.target.value)} onBlur={() => country && setCountryText(countryName(country.code, lang))} />
          <datalist id="bill-countries">
            {names.map((n) => <option key={n.code} value={n.name} />)}
          </datalist>
          <small className="faint">{country ? tr('bill.countryHint') : tr('bill.countryNone')}</small>
        </div>
        <div className="row bill-meta">
          <label className="field"><span>{tr('bill.number')}</span><input className="input" value={number} maxLength={30} onChange={(e) => setNumber(e.target.value)} /></label>
          <label className="field"><span>{tr('bill.date')}</span><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="field"><span>{tr('bill.city')}</span><input className="input" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} /></label>
          <label className="field">
            <span>{tr('bill.currency')}</span>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {kind === 'cotizacion' && <label className="field"><span>{tr('bill.validUntil')}</span><input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></label>}
        </div>
      </div>

      <div className="card stack">
        <div className="bill-parties">
          {party(issuer, setIssuer, tr('bill.issuer'), true)}
          {party(client, setClient, kind === 'recibo' ? tr('bill.receivedFrom') : tr('bill.client'), false)}
        </div>
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>{tr('bill.remember')}</span>
        </label>
      </div>

      <div className="card stack">
        <h3>{tr('bill.items')}</h3>
        <div className="bill-items">
          {rows.map((r, i) => (
            <div key={i} className="bill-item">
              <label className="field bill-desc"><span>{tr('bill.description')}</span><input className="input" value={r.description} maxLength={200} onChange={(e) => setRow(i, { description: e.target.value })} /></label>
              <label className="field bill-qty"><span>{tr('bill.qty')}</span><input className="input" inputMode="decimal" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></label>
              <label className="field bill-price"><span>{tr('bill.price')}</span><input className="input" inputMode="decimal" value={r.price} placeholder="0" onChange={(e) => setRow(i, { price: e.target.value })} /></label>
              <span className="bill-line" aria-label={tr('bill.lineTotal')}>{money(roundTo(items[i].qty * items[i].price, minorDigits(currency)))}</span>
              <button type="button" className="icon-btn" aria-label={tr('bill.removeItem', { n: i + 1 })} disabled={rows.length === 1} onClick={() => setRows((x) => x.filter((_, j) => j !== i))}><Icon name="close" /></button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-soft btn-sm" style={{ justifySelf: 'start' }} onClick={() => setRows((x) => [...x, emptyRow()])}><Icon name="plus" /> {tr('bill.addItem')}</button>
        <div className="row bill-taxes">
          <label className="field"><span>{tr('bill.taxLabel')}</span><input className="input" value={taxLabel} maxLength={20} onChange={(e) => setTaxLabel(e.target.value)} /></label>
          <label className="field"><span>{tr('bill.taxRate')}</span><input className="input" inputMode="decimal" value={taxRate} placeholder="0" onChange={(e) => setTaxRate(e.target.value)} /></label>
          <label className="field"><span>{tr('bill.withholding')}</span><input className="input" inputMode="decimal" value={withholding} placeholder="0" onChange={(e) => setWithholding(e.target.value)} /></label>
        </div>
        {country?.tax.rate != null && !taxRate && (
          <button type="button" className="btn btn-ghost btn-sm bill-suggest" onClick={() => setTaxRate(String(country.tax.rate))}>
            {tr('bill.useRate', { tax: country.tax.label, rate: country.tax.rate })}
          </button>
        )}
        <dl className="bill-totals" aria-live="polite">
          {(t.tax > 0 || t.withholding > 0) && <><dt>{tr('bill.subtotal')}</dt><dd>{money(t.subtotal)}</dd></>}
          {t.tax > 0 && <><dt>{taxLabel || 'IVA'}</dt><dd>{money(t.tax)}</dd></>}
          {t.withholding > 0 && <><dt>{country?.withholding || tr('bill.withholdingPdf')}</dt><dd>-{money(t.withholding)}</dd></>}
          <dt className="bill-grand">{tr('bill.total')}</dt><dd className="bill-grand">{money(t.total)}</dd>
        </dl>
        {lang.startsWith('es') && t.total > 0 && <small className="faint bill-words">{amountInWordsEs(t.total, currency)}</small>}
      </div>

      <div className="card stack">
        <label className="field"><span>{tr('bill.payment')}</span><textarea className="textarea" style={{ minHeight: 60 }} value={payment} placeholder={tr('bill.paymentPh')} onChange={(e) => setPayment(e.target.value)} /></label>
        <label className="field"><span>{tr('bill.notes')}</span><textarea className="textarea" style={{ minHeight: 60 }} value={notes} placeholder={tr('bill.notesPh')} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="field">
          <span>{tr('bill.signature')}</span>
          {signing ? (
            <Suspense fallback={<span className="spinner" aria-hidden="true" />}>
              <SignatureEditor onDone={(s) => { setSignature(s); setSigning(false) }} onCancel={() => setSigning(false)} />
            </Suspense>
          ) : signature ? (
            <div className="row bill-sign">
              <img src={signature.url} alt={tr('bill.signature')} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSigning(true)}>{tr('bill.changeSignature')}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSignature(null)}>{tr('bill.removeSignature')}</button>
            </div>
          ) : (
            <button type="button" className="btn btn-soft btn-sm" style={{ justifySelf: 'start' }} onClick={() => setSigning(true)}><Icon name="pen" /> {tr('bill.addSignature')}</button>
          )}
        </div>
        <small className="faint">{tr('bill.disclaimer')} {tr('bill.privacy')}</small>
        {!hasItem && <small className="faint">{tr('bill.needItems')}</small>}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="row row-end" style={{ gap: 8 }}>
          {output && <button type="button" className="btn btn-ghost" onClick={newDocument}><Icon name="plus" /> {tr('bill.new')}</button>}
          <BusyButton busy={busy} disabled={!hasItem || !number.trim() || !date} onClick={create} icon="file">
            {tr('bill.create')}
          </BusyButton>
        </div>
      </div>

      {output && (
        <div className="card stack" aria-live="polite">
          <h3>{tr('bill.ready')}</h3>
          <DocPreview source={output} page={1} label={output.name} />
          <SaveOptions file={output} toolName="billing" />
        </div>
      )}
    </div>
  )
}
