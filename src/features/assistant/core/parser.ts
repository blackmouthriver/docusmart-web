/**
 * Analizador de pedidos por reglas (W-151.4): convierte lo que escribe la persona («comprime este pdf a
 * menos de 2 megas», «pasa las páginas 3 a 5 a jpg y luego únelas») en una acción del catálogo (W-151.3).
 *
 * - Primero reconoce los datos (tamaño, páginas, giro, ppp, medidas, calidad, blanco y negro, idioma,
 *   texto, posición, «este archivo») con el léxico `parse` de la base de cada idioma: nada de eso queda
 *   fijo aquí.
 * - Después busca la herramienta con el buscador del asistente (BM25 sobre la base de cada idioma, con sus
 *   frases, sinónimos y tolerancia a errores de tipeo), con el pedido SIN esos datos: «gira el pdf 90
 *   grados» busca «gira el pdf».
 * - La contraseña nunca se toma del chat: la persona la escribe en la herramienta.
 *
 * El resultado siempre pasa por `validateAction`: las opciones que la herramienta no acepta se descartan
 * (y se informan en `dropped`), nunca se inventan.
 */
import { normalizeForSearch } from '../../../shared/i18n/search'
import { OPTIONS, POSITIONS, TOOL_OPTIONS, TOOL_SLUGS, validateAction, type AssistantAction, type OpenToolAction, type OptionKey, type Options } from './actions'
import { search, type Index } from './engine'

/** Léxico de un idioma (en minúsculas y sin tildes), en `parse` de public/assistant/<idioma>.json. */
export type Lexicon = {
  numbers: Record<string, number>
  units: Record<string, 'kb' | 'mb' | 'gb'>
  pages: string[]
  range: string[]
  and: string[]
  fillers: string[]
  current: string[]
  degrees: string[]
  angles: Record<string, '90' | '180' | '270'>
  dpi: string[]
  pixels: string[]
  width: string[]
  height: string[]
  percent: string[]
  quality: string[]
  grayscale: string[]
  says: string[]
  /** Pronombres pegados al verbo que se separan antes de buscar («comprímelos» → «comprime»). */
  suffixes: string[]
  then: string[]
  languages: Record<string, string>
  positions: Record<string, (typeof POSITIONS)[number]>
}

export type ParseResult = { action: AssistantAction; dropped: OptionKey[] }

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/**
 * Patrón de una palabra o frase: con límites de palabra, salvo en chino, japonés y coreano (sin espacios).
 * Las siglas latinas (mb, dpi, px, webm…) pueden ir pegadas a un número o a texto CJK («2mb», «300dpi»,
 * «webmに», «转成webm»), pero no a otras letras latinas («mp3» no contiene la «p» de página).
 */
const word = (w: string) => {
  if (CJK.test(w) || !/[\p{L}\p{N}]/u.test(w)) return esc(w)
  if (/^[a-z0-9]+$/.test(w)) return `(?<![\\p{Script=Latin}])${esc(w)}(?![\\p{Script=Latin}])`
  return `(?<![\\p{L}\\p{N}])${esc(w)}(?![\\p{L}\\p{N}])`
}
/** Alternativas, de la más larga a la más corta (para que «de alto» gane a «alto»). */
const alt = (list: readonly string[]) => [...list].sort((a, b) => b.length - a.length).map(word).join('|')
const NUM = '(\\d+(?:[.,]\\d+)?)'
const toNumber = (s: string) => Number(s.replace(',', '.'))
/** Cuánto más puntaje necesita la búsqueda con los datos para ganarle a la búsqueda sin ellos. */
const FULL_RATIO = 1.5
/** Palabra que se sigue usando para encontrar la herramienta de un paso encadenado («y luego comprímelo»). */
const CARRY = 'pdf'

/** Minúsculas, sin tildes y con los números escritos en letras pasados a cifras («dos megas» → «2 megas»). */
function prepare(text: string, lex: Lexicon): string {
  let t = normalizeForSearch(text)
  const names = Object.keys(lex.numbers)
  if (names.length) t = t.replace(new RegExp(`(?:${alt(names)})`, 'gu'), (m) => String(lex.numbers[m]))
  return t
}

const has = (t: string, list: readonly string[]) => list.length > 0 && new RegExp(`(?:${alt(list)})`, 'u').test(t)
/** La frase más larga de un diccionario que aparece en el texto (y dónde está). */
function findPhrase<T>(t: string, dict: Record<string, T>): { value: T; span: string } | undefined {
  for (const k of Object.keys(dict).sort((a, b) => b.length - a.length)) {
    const m = new RegExp(word(k), 'u').exec(t)
    if (m) return { value: dict[k], span: m[0] }
  }
}

/** Páginas: «página(s) 3 a 5», «1, 3 y 7», «de la 2 a la 4» → «3-5», «1, 3, 7», «2-4»; o «3〜5ページ» (CJK). */
function pagesOf(t: string, lex: Lexicon): { value: string; span: string } | undefined {
  const m = new RegExp(`(?:${alt(lex.pages)})\\s*(.*)$`, 'u').exec(t)
  if (!m) return
  return pagesAfter(m, lex) ?? pagesBefore(t, lex)
}

/** «página(s) 3 a 5»: los números van después de la palabra. */
function pagesAfter(m: RegExpExecArray, lex: Lexicon): { value: string; span: string } | undefined {
  const parts: string[] = []
  const used: string[] = []
  for (const tok of m[1].split(/\s+|(?=[,-])|(?<=[,-])/u).filter(Boolean)) {
    const last = parts[parts.length - 1]
    if (/^\d+$/.test(tok)) {
      // Dos números seguidos sin «a» ni «y» entre ellos: el segundo ya no es de las páginas («2 a la 4 de un pdf»).
      if (last && /\d/.test(last)) break
      parts.push(tok)
    } else if (lex.range.includes(tok)) parts.push('-')
    else if (lex.and.includes(tok)) parts.push(',')
    else if (lex.fillers.includes(tok)) {
      used.push(tok)
      continue
    } else break
    used.push(tok)
  }
  while (parts.length && !/\d/.test(parts[parts.length - 1])) parts.pop()
  if (!parts.some((p) => /\d/.test(p))) return
  const head = m[0].slice(0, m[0].length - m[1].length)
  return { value: parts.join('').replace(/,+/g, ', ').replace(/-+/g, '-'), span: head + used.join(' ') }
}

/**
 * «3〜5ページ», «第3到5页», «3~5페이지»: en chino, japonés y coreano el número va antes de la palabra.
 * Se toma el tramo de números y separadores (del léxico) justo antes de «página».
 */
function pagesBefore(t: string, lex: Lexicon): { value: string; span: string } | undefined {
  const seps = [...lex.range, ...lex.and, ...lex.fillers].filter(Boolean).map(esc).sort((a, b) => b.length - a.length).join('|')
  const m = new RegExp(`((?:\\d+|${seps}|\\s)+?)\\s*(?:${alt(lex.pages)})`, 'u').exec(t)
  if (!m || !/\d/.test(m[1])) return
  const parts: string[] = []
  for (const tok of m[1].match(new RegExp(`\\d+|${seps}`, 'gu')) ?? []) {
    if (/^\d+$/.test(tok)) parts.push(tok)
    else if (lex.range.includes(tok)) parts.push('-')
    else if (lex.and.includes(tok)) parts.push(',')
  }
  while (parts.length && !/\d/.test(parts[0])) parts.shift()
  while (parts.length && !/\d/.test(parts[parts.length - 1])) parts.pop()
  if (!parts.length) return
  return { value: parts.join('').replace(/,+/g, ', ').replace(/-+/g, '-'), span: m[0] }
}

/** Todos los datos que se reconocen en el texto y los tramos que ocupan (para quitarlos antes de buscar). */
function extract(t: string, lex: Lexicon): { options: Options; spans: string[] } {
  const o: Options = {}
  const spans: string[] = []
  const take = <T>(m: RegExpExecArray | null, f: (m: RegExpExecArray) => T): T | undefined => (m ? (spans.push(m[0]), f(m)) : undefined)
  // Tamaño: «2 mb», «1,5 megas», «500 kb».
  take(new RegExp(`${NUM}\\s*(${alt(Object.keys(lex.units))})`, 'u').exec(t), (m) => (o.targetSize = Math.round(toNumber(m[1]) * 1024 ** { kb: 1, mb: 2, gb: 3 }[lex.units[m[2]]])))
  const pages = pagesOf(t, lex)
  if (pages) (o.pages = pages.value), spans.push(pages.span)
  // Giro: «90 grados» o «a la derecha».
  const deg = take(new RegExp(`(90|180|270)\\s*(?:${alt(lex.degrees)})`, 'u').exec(t), (m) => m[1])
  const turn = deg ? undefined : findPhrase(t, lex.angles)
  if (deg) o.angle = deg
  else if (turn) (o.angle = turn.value), spans.push(turn.span)
  take(new RegExp(`(\\d+)\\s*(?:${alt(lex.dpi)})`, 'u').exec(t), (m) => (o.dpi = Number(m[1])))
  // Medidas: «1920x1080», «1080 px de ancho», «de alto 600», «ancho 800», «800 píxeles».
  // El texto ya viene normalizado (un solo espacio): « ?» en vez de «\s*» evita retrocesos.
  const box = take(/(\d+) ?[x×] ?(\d+)/u.exec(t), (m) => ((o.width = Number(m[1])), (o.height = Number(m[2]))))
  if (box === undefined) {
    const near = (words: string[]) => new RegExp(`(\\d+)\\s*(?:(?:${alt(lex.pixels)})\\s*)?(?:${alt(words)})|(?:${alt(words)})\\s*(?:(?:${alt(lex.fillers)})\\s*)?(\\d+)`, 'u').exec(t)
    const w = take(near(lex.width), (m) => (o.width = Number(m[1] ?? m[2])))
    const h = take(near(lex.height), (m) => (o.height = Number(m[1] ?? m[2])))
    if (w === undefined && h === undefined) take(new RegExp(`(\\d+)\\s*(?:${alt(lex.pixels)})`, 'u').exec(t), (m) => (o.width = Number(m[1])))
  }
  // Calidad («calidad 80», «calidad del 80 %») y porcentaje («al 50 %»).
  const q = take(new RegExp(`(?:${alt(lex.quality)})\\D{0,12}?(\\d+)\\s*(?:${alt(lex.percent)})?`, 'u').exec(t), (m) => (o.quality = Number(m[1])))
  if (q === undefined) take(new RegExp(`(\\d+)\\s*(?:${alt(lex.percent)})`, 'u').exec(t), (m) => (o.percent = Number(m[1])))
  const gray = findPhrase(t, Object.fromEntries(lex.grayscale.map((g) => [g, true])))
  if (gray) (o.grayscale = true), spans.push(gray.span)
  // Formato: el último que se nombra («de heic a png» → png). No se quita: también ayuda a elegir la herramienta.
  const formats = (OPTIONS.format.values as readonly string[]).concat('jpeg')
  const fm = [...t.matchAll(new RegExp(`(?:${alt(formats)})`, 'gu'))].map((x) => (x[0] === 'jpeg' ? 'jpg' : x[0]))
  if (fm.length) o.format = fm[fm.length - 1]
  const language = findPhrase(t, lex.languages)
  if (language) (o.language = language.value), spans.push(language.span)
  const position = findPhrase(t, lex.positions)
  if (position) (o.position = position.value), spans.push(position.span)
  return { options: o, spans }
}

/**
 * Texto de una marca de agua: entre comillas, o después de «que diga». Sin comillas se toma la palabra
 * siguiente, o todas las seguidas en mayúsculas («que diga MUY CONFIDENCIAL al pdf» → «MUY CONFIDENCIAL»).
 */
function textOf(original: string, lex: Lexicon): { value: string; span: string } | undefined {
  // Comillas de todos los idiomas: "…", “…”, „…“, «…», »…« y '…' (la simple solo fuera de una palabra:
  // en «marca d'água» es un apóstrofo, no una comilla).
  const quoted = /"([^"]{1,200})"|“([^”]{1,200})”|„([^“”]{1,200})[“”]|«([^»]{1,200})»|»([^«]{1,200})«|(?<![\p{L}\p{N}])'([^']{1,200})'(?![\p{L}\p{N}])/u.exec(original)
  if (quoted) return { value: quoted.slice(1).find((g) => g !== undefined)!.trim(), span: normalizeForSearch(quoted[0]) }
  const t = normalizeForSearch(original)
  const m = new RegExp(`(?:${alt(lex.says)})\\s+(.+)$`, 'u').exec(t)
  if (!m) return
  const flat = original.trim().replace(/\s+/g, ' ')
  if (flat.length !== t.length) return
  const rest = flat.slice(t.length - m[1].length).split(' ')
  const upper = (w: string) => /\p{Lu}/u.test(w) && w === w.toLocaleUpperCase()
  const firstLower = rest.findIndex((w) => !upper(w))
  const words = upper(rest[0]) ? rest.slice(0, firstLower < 0 ? rest.length : firstLower) : rest.slice(0, 1)
  const value = trimPunctuation(words.join(' '))
  return value ? { value, span: normalizeForSearch(m[0].slice(0, m[0].length - m[1].length) + words.join(' ')) } : undefined
}

/** Quita la puntuación del final («CONFIDENCIAL.» → «CONFIDENCIAL»), sin expresiones regulares con retroceso. */
function trimPunctuation(s: string): string {
  let end = s.length
  while (end > 0 && '.,;:!?¡¿'.includes(s[end - 1])) end--
  return s.slice(0, end)
}

/**
 * Quita los pronombres pegados a los verbos de más de 4 letras («comprimelos» → «compri», «unelo» → «une»).
 * La raíz que queda la completa el buscador (palabras cortadas y errores de tipeo).
 */
function unglue(t: string, lex: Lexicon): string {
  if (!lex.suffixes.length) return t
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(\\p{L}{3,}?)(?:${lex.suffixes.map(esc).sort((a, b) => b.length - a.length).join('|')})(?![\\p{L}\\p{N}])`, 'gu')
  return t.replace(re, (whole, stem: string) => (whole.length > 4 ? stem : whole))
}

/** La herramienta de una respuesta: la suya, o la de una respuesta general que se llama igual que una herramienta. */
const toolOf = (entry: { id: string; tool?: string }) => entry.tool ?? (TOOL_SLUGS.has(entry.id) ? entry.id : undefined)

type Step = { step: OpenToolAction | { kind: 'explain'; entry: string }; dropped: OptionKey[] }

/** Una herramienta y sus opciones, a partir de un tramo del pedido. */
function parseStep(index: Index, lex: Lexicon, segment: string, carry: boolean): Step | null {
  const t = prepare(segment, lex)
  const { options: found, spans } = extract(t, lex)
  const text = textOf(segment, lex)
  if (text) (found.text = text.value), spans.push(text.span)
  // El pedido sin los datos ya reconocidos, y con los verbos sin pronombres pegados.
  let core = normalizeForSearch(segment)
  for (const s of spans) if (s.trim()) core = core.replace(s, ' ')
  core = unglue(core, lex).replace(/\s+/g, ' ').trim()
  if (carry && !core.includes(CARRY)) core = `${core} ${CARRY}`
  // Dos búsquedas: sin los datos (lo normal: «gira el pdf 90 grados» → «gira el pdf») y con ellos, porque a
  // veces un dato es lo que indica la herramienta («pon la foto en blanco y negro» → Ajustar imagen). Gana la
  // que encuentra una herramienta que acepta más de los datos reconocidos; si empatan, la que no los tiene…
  const fits = (r: ReturnType<typeof search>) => {
    const e = r.confident ? r.results[0]?.entry : undefined
    const tool = e && toolOf(e)
    return tool ? Object.keys(found).filter((k) => TOOL_OPTIONS[tool]?.[k as OptionKey]).length : -1
  }
  const plain = search(index, core || segment, { limit: 1 })
  const full = spans.length ? search(index, unglue(normalizeForSearch(segment), lex), { limit: 1 }) : plain
  // …y además con bastante más puntaje: un verbo claro («une estos pdf a 2 megas») sigue mandando.
  const out = fits(full) > fits(plain) && (full.results[0]?.score ?? 0) >= FULL_RATIO * (plain.results[0]?.score ?? 0) ? full : plain
  const top = out.results[0]?.entry
  if (!out.confident || !top) return null
  const tool = toolOf(top)
  if (!tool) return { step: { kind: 'explain', entry: top.id }, dropped: [] }
  const accepted = TOOL_OPTIONS[tool] ?? {}
  // «al 80 %» es porcentaje para redimensionar, pero calidad para las que tienen calidad y no porcentaje.
  if (found.percent !== undefined && !accepted.percent && accepted.quality) {
    found.quality = found.percent
    delete found.percent
  }
  const options: Options = {}
  const dropped: OptionKey[] = []
  for (const [k, v] of Object.entries(found) as Array<[OptionKey, Options[OptionKey]]>) {
    const allowed = accepted[k]
    // Si la herramienta acepta solo algunos valores (formatos, posiciones), el valor tiene que ser uno de ellos.
    const okValue = allowed === true || (Array.isArray(allowed) && allowed.includes(String(v)))
    if (allowed && okValue && v !== undefined) options[k] = v
    // El formato de entrada («pdf a word») no es una opción que falte: solo se informa si la herramienta tiene formatos.
    else if (k !== 'format' || allowed) dropped.push(k)
  }
  return { step: { kind: 'openTool', tool, ...(Object.keys(options).length ? { options } : {}), ...(has(t, lex.current) ? { useCurrentFile: true } : {}) }, dropped }
}

/**
 * Entiende un pedido. Devuelve la acción (ya validada) y las opciones reconocidas que la herramienta no
 * acepta, o null si no se entiende con seguridad (entonces el asistente responde como siempre).
 */
export function parseRequest(index: Index, lex: Lexicon | undefined, text: string): ParseResult | null {
  if (!lex || !text.trim()) return null
  // Pasos encadenados: «une estos pdf y luego comprímelos».
  const pieces = splitSteps(text, lex)
  const steps: Array<Step | null> = []
  for (const [i, p] of pieces.entries()) {
    const prev = steps[i - 1]
    const carry = i > 0 && !!prev && prev.step.kind === 'openTool' && prev.step.tool.includes(CARRY)
    steps.push(parseStep(index, lex, p, carry))
  }
  const tools = steps.filter((s): s is Step & { step: OpenToolAction } => !!s && s.step.kind === 'openTool')
  let raw: unknown
  let dropped: OptionKey[]
  if (pieces.length > 1 && tools.length >= 2) {
    // Solo el primer paso usa el archivo abierto: los demás reciben el resultado del anterior.
    raw = { kind: 'chain', steps: tools.map((s, i) => (i === 0 ? s.step : { kind: 'openTool', tool: s.step.tool, ...(s.step.options ? { options: s.step.options } : {}) })) }
    dropped = tools.flatMap((s) => s.dropped)
  } else {
    const first = steps.find((s): s is Step => !!s)
    if (!first) return null
    raw = first.step
    dropped = first.dropped
  }
  const v = validateAction(raw)
  return v.ok ? { action: v.action, dropped: [...new Set(dropped)] } : null
}

/** Corta el pedido en pasos por «y luego», «después»… (en el texto original, para conservar mayúsculas). */
function splitSteps(text: string, lex: Lexicon): string[] {
  if (!lex.then.length) return [text]
  const flat = text.trim().replace(/\s+/g, ' ')
  const norm = normalizeForSearch(flat)
  const re = new RegExp(`[\\s,;]*(?:${alt(lex.then)})[\\s,;]*`, 'gu')
  // Normalizar no cambia el largo en las letras latinas: se corta el original en las mismas posiciones.
  if (norm.length !== flat.length) return norm.split(re).filter((p) => p.trim())
  const out: string[] = []
  let from = 0
  for (const m of norm.matchAll(re)) {
    if (m.index! > from) out.push(flat.slice(from, m.index))
    from = m.index! + m[0].length
  }
  out.push(flat.slice(from))
  return out.map((p) => p.trim()).filter(Boolean)
}
