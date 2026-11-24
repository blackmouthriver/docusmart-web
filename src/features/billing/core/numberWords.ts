/**
 * Valor en letras en portugués (Brasil) e inglés (W-147.10), como el de español de billing.ts:
 * "Mil duzentos e cinquenta reais e trinta centavos", "One thousand two hundred fifty dollars and 30/100".
 */
import { amountInWordsEs, minorDigits } from './billing'

/* ───────────── Portugués (Brasil) ───────────── */

const PT_UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const PT_TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const PT_HUNDREDS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function ptBelow1000(n: number): string {
  if (n === 100) return 'cem'
  const h = Math.floor(n / 100)
  const r = n % 100
  const rest = r < 20 ? PT_UNITS[r] : [PT_TENS[Math.floor(r / 10)], PT_UNITS[r % 10]].filter(Boolean).join(' e ')
  return [PT_HUNDREDS[h], rest].filter(Boolean).join(' e ')
}

/** Número entero en portugués (escala corta de Brasil: bilhão = mil milhões). */
export function integerToWordsPt(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n === 0) return 'zero'
  const scales: Array<[number, string, string]> = [
    [1e12, 'trilhão', 'trilhões'],
    [1e9, 'bilhão', 'bilhões'],
    [1e6, 'milhão', 'milhões'],
    [1e3, 'mil', 'mil'],
  ]
  const groups: string[] = []
  let rest = n
  for (const [size, one, many] of scales) {
    const k = Math.floor(rest / size)
    rest %= size
    if (!k) continue
    if (size === 1e3) groups.push(k === 1 ? 'mil' : `${ptBelow1000(k)} mil`)
    else groups.push(`${ptBelow1000(k)} ${k === 1 ? one : many}`)
  }
  if (rest) groups.push(ptBelow1000(rest))
  // "e" antes del último grupo si es menor que 100 o una centena redonda ("mil e cem", "dois mil e trinta").
  if (groups.length > 1 && rest && (rest < 100 || rest % 100 === 0)) return `${groups.slice(0, -1).join(' ')} e ${groups.at(-1)}`
  return groups.join(' ')
}

const PT_CURRENCY: Record<string, [string, string]> = {
  BRL: ['real', 'reais'], USD: ['dólar', 'dólares'], EUR: ['euro', 'euros'], COP: ['peso', 'pesos'], MXN: ['peso', 'pesos'], ARS: ['peso', 'pesos'],
  CLP: ['peso', 'pesos'], UYU: ['peso', 'pesos'], PEN: ['sol', 'soles'], PYG: ['guarani', 'guaranis'], GBP: ['libra', 'libras'], AOA: ['kwanza', 'kwanzas'], MZN: ['metical', 'meticais'],
}

/** "Mil duzentos e cinquenta reais e trinta centavos"; "Um milhão de reais". */
export function amountInWordsPt(amount: number, currency: string): string {
  const whole = Math.floor(Math.abs(amount))
  const cents = Math.round((Math.abs(amount) - whole) * 100)
  const [one, many] = PT_CURRENCY[currency] ?? [currency, currency]
  const parts: string[] = []
  if (whole || !cents) {
    // "um milhão de reais", "dois bilhões de reais": con millones redondos va "de".
    const round = whole >= 1e6 && whole % 1e6 === 0
    parts.push(`${integerToWordsPt(whole)}${round ? ' de' : ''} ${whole === 1 ? one : many}`)
  }
  if (minorDigits(currency) > 0 && cents) parts.push(`${integerToWordsPt(cents)} ${cents === 1 ? 'centavo' : 'centavos'}`)
  const text = parts.join(' e ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/* ───────────── Inglés ───────────── */

const EN_UNITS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function enBelow1000(n: number): string {
  const h = Math.floor(n / 100)
  const r = n % 100
  const rest = r < 20 ? EN_UNITS[r] : EN_TENS[Math.floor(r / 10)] + (r % 10 ? `-${EN_UNITS[r % 10]}` : '')
  return [h ? `${EN_UNITS[h]} hundred` : '', rest].filter(Boolean).join(' ')
}

/** Número entero en inglés (escala corta: billion = 10⁹), como se escribe en un cheque. */
export function integerToWordsEn(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n === 0) return 'zero'
  const scales: Array<[number, string]> = [
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
    [1e3, 'thousand'],
  ]
  const groups: string[] = []
  let rest = n
  for (const [size, name] of scales) {
    const k = Math.floor(rest / size)
    rest %= size
    if (k) groups.push(`${enBelow1000(k)} ${name}`)
  }
  if (rest) groups.push(enBelow1000(rest))
  return groups.join(' ')
}

const EN_CURRENCY: Record<string, [string, string]> = {
  USD: ['dollar', 'dollars'], CAD: ['Canadian dollar', 'Canadian dollars'], AUD: ['Australian dollar', 'Australian dollars'], EUR: ['euro', 'euros'],
  GBP: ['pound', 'pounds'], COP: ['peso', 'pesos'], MXN: ['peso', 'pesos'], ARS: ['peso', 'pesos'], CLP: ['peso', 'pesos'], BRL: ['real', 'reais'], PEN: ['sol', 'soles'],
}

/** "One thousand two hundred fifty dollars and 30/100" (como en un cheque). */
export function amountInWordsEn(amount: number, currency: string): string {
  const whole = Math.floor(Math.abs(amount))
  const cents = Math.round((Math.abs(amount) - whole) * 100)
  const [one, many] = EN_CURRENCY[currency] ?? [currency, currency]
  let text = `${integerToWordsEn(whole)} ${whole === 1 ? one : many}`
  if (minorDigits(currency) > 0 && cents) text += ` and ${String(cents).padStart(2, '0')}/100`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** El valor en letras en el idioma de la pantalla, si hay (español, portugués o inglés). */
export function amountInWords(lang: string, amount: number, currency: string): string | undefined {
  if (lang.startsWith('es')) return amountInWordsEs(amount, currency)
  if (lang.startsWith('pt')) return amountInWordsPt(amount, currency)
  if (lang.startsWith('en')) return amountInWordsEn(amount, currency)
  return undefined
}
