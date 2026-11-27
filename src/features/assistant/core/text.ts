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
  pt: new Set('a o os as de do da dos das em no na nos nas um uma uns umas e ou para por com sem que como se meu minha meus minhas e sao posso pode quero preciso tem ter fazer isso este esta esse essa ao aos mais muito nao qual quais onde quando eu voce dois tres varios varias'.split(' ')),
  fr: new Set('le la les l un une des de du d et ou en au aux pour par avec sans que qui comment est sont je j tu il elle on mon ma mes ton ta tes son sa ses ce cet cette ces se puis peux veux faut faire ne n pas plus y a deux trois plusieurs'.split(' ')),
  it: new Set('il lo la i gli le l un uno una di del della dei delle da in nel nella e o per con senza che come e sono posso puoi voglio devo fare mio mia miei mie questo questa non si due tre vari varie'.split(' ')),
  de: new Set('der die das den dem des ein eine einen einem einer und oder zu zum zur in im mit ohne fur von auf an ist sind wie was ich du kann will muss mein meine mich mir es sich nicht auch zwei drei mehrere'.split(' ')),
  ca: new Set('el la els les l un una uns unes de del dels d i o en a al als per amb sense que com es son puc pots vull he fer meu meva meus meves aquest aquesta no dos tres diversos'.split(' ')),
  eu: new Set('eta edo da dira bat ere nola zer nire nik dut ditut du ahal nahi behar egin hau hori ez bai bi hiru'.split(' ')),
  // Chino, japonés y coreano: pares de caracteres de relleno (cómo, qué, puedo, quiero…), tras partir en pares.
  zh: new Set('怎么 怎样 么样 什么 如何 可以 一个 我的 我想 想要 需要 能不 不能 吗 呢 的话 一下'.split(' ')),
  ja: new Set('です すか ます した たい たいで ですか でき きる 方法 どう うす すれ れば ください'.split(' ')),
  ko: new Set('하고 싶어 어요 해요 있나 나요 습니 니다 방법 어떻 떻게 하는 는법'.split(' ')),
  ru: new Set('и в во не что как на с со а но или по к ко у о об от для из за мой моя мои я ты это этот эта мне меня можно нужно хочу могу ли два три несколько'.split(' ')),
}
/** Idiomas sin espacios entre palabras (o con partículas pegadas): se indexan por pares de caracteres. */
const CJK_RUN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+|[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
/** Pares de caracteres consecutivos (bigramas) de un tramo en chino, japonés o coreano. */
export function cjkBigrams(run: string): string[] {
  const chars = [...run]
  if (chars.length < 2) return chars
  return chars.slice(0, -1).map((c, i) => c + chars[i + 1])
}

/** Sinónimos → palabra de la base (después de normalizar y quitar plurales). */
const SYNONYMS: Record<string, Readonly<Record<string, string>>> = {
  es: {
    juntar: 'unir', junto: 'unir', junta: 'unir', combinar: 'unir', combino: 'unir', fusionar: 'unir', pegar: 'unir', unificar: 'unir', uno: 'unir',
    separar: 'dividir', separo: 'dividir', partir: 'dividir', parto: 'dividir', cortar: 'dividir',
    girar: 'rotar', giro: 'rotar', voltear: 'rotar', enderezar: 'rotar',
    reducir: 'comprimir', reduzco: 'comprimir', achicar: 'comprimir', aligerar: 'comprimir', peso: 'comprimir', pesa: 'comprimir', liviano: 'comprimir', comprimo: 'comprimir',
    clave: 'contrasena', password: 'contrasena', bloquear: 'proteger', protejo: 'proteger', candado: 'proteger',
    quitar: 'desbloquear', quito: 'desbloquear', sacar: 'extraer', extrae: 'extraer', extraigo: 'extraer',
    cambia: 'cambiar', cambio: 'cambiar', cambiarlo: 'cambiar', ponerle: 'proteger',
    firma: 'firmar', firmo: 'firmar',
    foto: 'imagen', fotografia: 'imagen', jpeg: 'jpg', imagenes: 'imagen',
    escaneo: 'escanear', escaner: 'escanear', digitalizar: 'escanear',
    docx: 'word', doc: 'word', xlsx: 'excel', planilla: 'excel', calculo: 'excel',
    // "hoja" es casi siempre una página ("las hojas del PDF"); la de cálculo la marca "cálculo".
    hoja: 'pagina', ordeno: 'ordenar', reordenar: 'ordenar', enumerar: 'numerar', enumero: 'numerar', numero: 'numerar',
    costo: 'precio', cuesta: 'precio', pagar: 'precio', pago: 'precio', gratis: 'precio', gratuito: 'precio', gratuita: 'precio', cobran: 'precio',
    movil: 'celular', telefono: 'celular', smartphone: 'celular',
    // Novedades (W-104): renombrar el resultado y guardar en la nube.
    renombro: 'renombrar', renombre: 'renombrar', rename: 'renombrar', nube: 'drive', onedrive: 'drive', anuncio: 'publicidad', propaganda: 'publicidad', tutorial: 'guia', tutoriales: 'guia', manual: 'guia',
    comprimido: 'zip', descomprimir: 'extraer', generar: 'crear', genero: 'crear', creo: 'crear',
    escuchar: 'voz', leer: 'lectura', audio: 'voz',
    suscripcion: 'premium', plan: 'premium',
    seguro: 'privacidad', segura: 'privacidad', servidor: 'privacidad', suben: 'privacidad', subir: 'privacidad', sube: 'privacidad',
    ayudame: 'ayuda', ayudar: 'ayuda',
  },
  // Ruso: los nombres de formatos se escriben también en cirílico (W-151.2).
  ru: {
    пдф: 'pdf', пдфка: 'pdf', ворд: 'word', ворде: 'word', эксель: 'excel', ексель: 'excel', джпг: 'jpg', жпг: 'jpg', джипег: 'jpg', пнг: 'png', зип: 'zip', рар: 'rar', гиф: 'gif', гифк: 'gif', мп3: 'mp3', мп4: 'mp4',
  },
  pt: {
    graca: 'gratis', gratuito: 'gratis', gratuita: 'gratis', zap: 'whatsapp', zapzap: 'whatsapp', pdfs: 'pdf',
  },
  en: {
    combine: 'merge', join: 'merge', joining: 'merge', unite: 'merge', glue: 'merge',
    renaming: 'rename', renamed: 'rename', cloud: 'drive', ad: 'ads', advert: 'ads', adverts: 'ads', advertising: 'ads', tutorial: 'guide', tutorials: 'guide', manual: 'guide', howto: 'guide',
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
const EMPTY: ReadonlySet<string> = new Set()

/** Idiomas con plural en -s (los demás se dejan como están). */
const PLURAL_S = new Set(['es', 'en', 'pt', 'fr', 'it', 'ca'])

/** Terminaciones frecuentes del ruso (verbos, sustantivos y adjetivos), de la más larga a la más corta. */
const RU_ENDINGS = ['иться', 'ыться', 'ться', 'ение', 'ения', 'ению', 'ением', 'ами', 'ями', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ать', 'ять', 'ить', 'еть', 'уть', 'ешь', 'ует', 'ют', 'ет', 'ит', 'ах', 'ях', 'ов', 'ев', 'ой', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ую', 'юю', 'ом', 'ем', 'ам', 'ям', 'ть', 'а', 'я', 'ы', 'и', 'у', 'ю', 'е', 'о', 'ь']

/** Quita plurales simples (pdfs → pdf, imagenes → imagen, archivos → archivo, files → file) y, en ruso,
 *  las terminaciones (объединить, объединение → объедин): igual en la pregunta y en la base. */
export function stem(word: string, lang: string): string {
  if (lang === 'ru') {
    if (word.length <= 4) return word
    const end = RU_ENDINGS.find((e) => word.endsWith(e) && word.length - e.length >= 4)
    return end ? word.slice(0, -end.length) : word
  }
  if (word.length <= MIN_STEM || !PLURAL_S.has(lang)) return word
  if ((lang === 'es' || lang === 'ca') && word.endsWith('es') && word.length > 5 && !/[aeiou]es$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** Palabras útiles de un texto: normalizadas, sin vacías, con sinónimos y plurales unidos. */
export function tokenize(text: string, lang: string): string[] {
  const stop = STOPWORDS[lang] ?? EMPTY
  const syn = SYNONYMS[lang] ?? {}
  return normalizeForSearch(text)
    // "PDF/A" es un formato propio, no "pdf" + "a".
    .replace(/pdf\s*\/\s*a\b/g, 'pdfa')
    .split(/[^\p{L}\p{N}]+/u)
    .flatMap((w) => (CJK.test(w) ? (w.match(CJK_RUN) ?? []).flatMap((run) => (CJK.test(run) ? cjkBigrams(run) : [run])) : [w]))
    .filter((w) => w && !stop.has(w))
    .map((w) => {
      if (CJK.test(w)) return w
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
