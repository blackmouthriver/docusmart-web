/**
 * Texto para el buscador del asistente (W-70b): normaliza, quita palabras vacías, une sinónimos
 * y plurales, y mide la distancia entre palabras para tolerar errores de tipeo.
 */
import { normalizeForSearch } from '../../../shared/i18n/search'

/** Palabras que no ayudan a encontrar la respuesta (en minúsculas y sin tildes). */
const STOPWORDS: Record<string, ReadonlySet<string>> = {
  es: new Set(
    'a al algo algun alguna algunas alguno algunos ante antes asi aqui cada como con contra cual cuales cuando de del desde donde e el ella ellas ellos en entre era es esa esas ese eso esos esta estan estar estas este esto estos fue ha hay hace hacer hago la las le les lo los me mi mis mucho muy necesito ni no nos o otra otro para pero poco por porque puede pueden puedo que quiero se ser si sin sobre son su sus tambien tan te tengo tiene tu tus un una unos y ya yo dos tres varios varias muchos muchas vez veces'.split(' '),
  ),
  en: new Set(
    'a about an and any are as at be been but by can could do does for from get got have how i if in into is it its me my need not of on or please should so some that the their them then there this to us use want was what when where which will with would you your one two three several multiple many time times'.split(' '),
  ),
}

/** Sinónimos → palabra de la base (después de normalizar y quitar plurales). */
const SYNONYMS: Record<string, Readonly<Record<string, string>>> = {
  es: {
    juntar: 'unir', junto: 'unir', junta: 'unir', combinar: 'unir', combino: 'unir', fusionar: 'unir', pegar: 'unir', unificar: 'unir', uno: 'unir',
    separar: 'dividir', separo: 'dividir', partir: 'dividir', parto: 'dividir', cortar: 'dividir',
    girar: 'rotar', giro: 'rotar', voltear: 'rotar', enderezar: 'rotar',
    reducir: 'comprimir', reduzco: 'comprimir', achicar: 'comprimir', aligerar: 'comprimir', peso: 'comprimir', pesa: 'comprimir', liviano: 'comprimir', comprimo: 'comprimir',
    clave: 'contrasena', password: 'contrasena', bloquear: 'proteger', protejo: 'proteger', candado: 'proteger',
    quitar: 'desbloquear', sacar: 'extraer', extrae: 'extraer', extraigo: 'extraer',
    cambia: 'cambiar', cambio: 'cambiar', cambiarlo: 'cambiar', ponerle: 'proteger',
    firma: 'firmar', firmo: 'firmar',
    foto: 'imagen', fotografia: 'imagen', jpeg: 'jpg', imagenes: 'imagen',
    escaneo: 'escanear', escaner: 'escanear', digitalizar: 'escanear',
    docx: 'word', doc: 'word', xlsx: 'excel', planilla: 'excel', hoja: 'excel',
    costo: 'precio', cuesta: 'precio', pagar: 'precio', pago: 'precio', gratis: 'precio', gratuito: 'precio', gratuita: 'precio', cobran: 'precio',
    movil: 'celular', telefono: 'celular', smartphone: 'celular',
    comprimido: 'zip', descomprimir: 'extraer', generar: 'crear', genero: 'crear', creo: 'crear',
    escuchar: 'voz', leer: 'lectura', audio: 'voz',
    suscripcion: 'premium', plan: 'premium',
    seguro: 'privacidad', segura: 'privacidad', servidor: 'privacidad', suben: 'privacidad', subir: 'privacidad', sube: 'privacidad',
    ayudame: 'ayuda', ayudar: 'ayuda',
  },
  en: {
    combine: 'merge', join: 'merge', joining: 'merge', unite: 'merge', glue: 'merge',
    separate: 'split', cut: 'split', divide: 'split',
    turn: 'rotate', flip: 'rotate', straighten: 'rotate',
    reduce: 'compress', shrink: 'compress', smaller: 'compress',
    lock: 'protect', encrypt: 'protect', remove: 'unlock',
    signature: 'sign',
    photo: 'image', picture: 'image', pic: 'image', jpeg: 'jpg',
    scanner: 'scan', digitize: 'scan',
    docx: 'word', doc: 'word', xlsx: 'excel', spreadsheet: 'excel', sheet: 'excel',
    cost: 'price', pay: 'price', free: 'price', paid: 'price', charge: 'price',
    mobile: 'phone', cellphone: 'phone', smartphone: 'phone',
    unzip: 'extract', decompress: 'extract', make: 'create', generate: 'create',
    scanned: 'scan', scanning: 'scan', merging: 'merge', signing: 'sign', signed: 'sign', compressed: 'compress', converting: 'convert',
    listen: 'voice', speak: 'voice', speech: 'voice',
    subscription: 'premium',
    safe: 'privacy', secure: 'privacy', server: 'privacy', upload: 'privacy', uploaded: 'privacy',
  },
}

const MIN_STEM = 3

/** Quita plurales simples (pdfs → pdf, imagenes → imagen, archivos → archivo, files → file). */
export function stem(word: string, lang: string): string {
  if (word.length <= MIN_STEM) return word
  if (lang === 'es' && word.endsWith('es') && word.length > 5 && !/[aeiou]es$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** Palabras útiles de un texto: normalizadas, sin vacías, con sinónimos y plurales unidos. */
export function tokenize(text: string, lang: string): string[] {
  const stop = STOPWORDS[lang] ?? STOPWORDS.en
  const syn = SYNONYMS[lang] ?? {}
  return normalizeForSearch(text)
    // "PDF/A" es un formato propio, no "pdf" + "a".
    .replace(/pdf\s*\/\s*a/g, 'pdfa')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !stop.has(w))
    .map((w) => {
      const direct = syn[w]
      if (direct) return direct
      const s = stem(w, lang)
      return syn[s] ?? s
    })
}

/** Distancia de edición (Levenshtein) con tope: devuelve max + 1 si la supera. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** Errores de tipeo tolerados según el largo de la palabra. */
export const typoBudget = (word: string): number => (word.length >= 8 ? 2 : word.length >= 5 ? 1 : 0)
