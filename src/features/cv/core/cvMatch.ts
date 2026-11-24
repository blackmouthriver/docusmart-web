/**
 * Comparar la hoja de vida con una oferta (W-147.10), como Jobscan pero en el navegador: se sacan
 * las palabras clave de la oferta (las que más se repiten, sin palabras vacías ni las de cualquier
 * aviso de empleo) y se mira cuáles ya están en la hoja de vida. Sin tildes ni mayúsculas, y
 * tolerando el plural ("habilidad" = "habilidades").
 */
import type { CvData } from './cv'

/** Palabras vacías (español, inglés, portugués) y palabras de cualquier aviso de empleo. */
const STOP = new Set(
  (
    // español
    'a al algo algun alguna alguno algunos ante antes aqui asi aun bajo bien cada como con contra cual cuales cuando de del desde donde dos durante e el ella ellas ellos en entre era es esa ese eso esta estan este esto estos fue ha hace hacer han hasta hay la las le les lo los mas me mi mientras muy nada ni no nos nuestra nuestro nuestros o otra otro otros para pero poco por porque pueda puede pueden que quien se sea segun ser si sin sobre son su sus tambien tanto te tener tiene tienen todo todos tu un una uno unos usted ya y ' +
    'anos ano años buscamos busca buscando cargo candidato candidata candidatos persona personas empresa empresas compania oferta ofertas empleo trabajo vacante vacantes requisitos requisito funciones funcion responsabilidades perfil postulate postular aplicar salario sueldo beneficios contrato horario lunes viernes sabado tiempo completo medio minimo minima deseable excluyente indispensable manejo conocimientos conocimiento experiencia experiencias nivel area areas sector importante zona ciudad ofrecemos tendras seras debe deberas sera cargo laborar laboral desarrollo crecimiento equipo excelente buena buen ' +
    // inglés
    'about above after all also am an and any are as at be been being but by can could did do does for from had has have he her his how i if in into is it its just may me more most my no not of on one or our out over she should so some such than that the their them then there these they this those through to too under up us very was we were what when where which while who will with would you your ' +
    'years year looking seeking candidate candidates company job jobs role position opportunity requirements requirement responsibilities responsibility salary benefits apply applicant ideal plus preferred required must strong excellent ability work working team join including etc ' +
    // portugués
    'ao aos as com da das de do dos em entre era essa esse esta este eu foi ha isso ja lhe mais mas me mesmo na nas nem no nos num numa o os ou para pela pelas pelo pelos por qual quando que se sem ser seu seus sua suas tambem te tem um uma uns vaga vagas empresa cargo requisitos experiencia anos conhecimento conhecimentos salario beneficios'
  ).split(' '),
)

/** Sin tildes ni mayúsculas. */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Raíz sencilla para comparar plurales: "habilidades" → "habilidad", "skills" → "skill". */
export function stem(word: string): string {
  if (word.length > 5 && word.endsWith('es') && !word.endsWith('ces')) return word.slice(0, -2)
  if (word.length > 5 && word.endsWith('ces')) return word.slice(0, -3) + 'z'
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

type Token = { raw: string; norm: string; stop: boolean }

/** Palabras del texto, conservando las de tecnología (C++, C#, .NET, Node.js, Power BI). */
export function tokens(text: string): Token[] {
  const out: Token[] = []
  for (const piece of text.split(/[^\p{L}\p{N}+#.]+/u)) {
    const raw = piece.replace(/^\.+|\.+$/g, '')
    if (!raw) continue
    const norm = fold(raw)
    const tech = /[+#.\d]/.test(norm)
    // Siglas en mayúsculas de dos letras (BI, TI, QA, UX) sí cuentan.
    const acronym = raw.length === 2 && raw === raw.toUpperCase() && raw !== raw.toLowerCase()
    const stop = STOP.has(norm) || (!tech && !acronym && norm.length < 3) || /^\d+$/.test(norm)
    out.push({ raw, norm, stop })
  }
  return out
}

export type Keyword = { term: string; key: string; weight: number }

/**
 * Las palabras clave de la oferta, de la más repetida a la menos: palabras sueltas y pares de
 * palabras que van juntos al menos dos veces ("servicio al cliente", "power bi").
 */
export function offerKeywords(offer: string, max = 25): Keyword[] {
  const list = tokens(offer)
  const words = new Map<string, Keyword & { first: number }>()
  const pairs = new Map<string, Keyword & { first: number }>()
  list.forEach((t, i) => {
    if (t.stop) return
    const key = stem(t.norm)
    const w = words.get(key)
    if (w) w.weight++
    else words.set(key, { term: t.raw, key, weight: 1, first: i })
    // Par con la siguiente palabra útil (puede haber una palabra vacía en medio: "servicio al cliente").
    let j = i + 1
    if (list[j]?.stop && j + 1 < list.length && !list[j + 1].stop) j++
    const next = list[j]
    if (!next || next.stop) return
    const pk = `${key} ${stem(next.norm)}`
    const p = pairs.get(pk)
    if (p) p.weight++
    else pairs.set(pk, { term: list.slice(i, j + 1).map((x) => x.raw).join(' '), key: pk, weight: 1, first: i })
  })
  const chosenPairs = [...pairs.values()].filter((p) => p.weight >= 2)
  // Una palabra que solo aparece dentro de un par elegido no se repite sola.
  const inPairs = new Map<string, number>()
  for (const p of chosenPairs) for (const k of p.key.split(' ')) inPairs.set(k, (inPairs.get(k) ?? 0) + p.weight)
  const singles = [...words.values()].map((w) => ({ ...w, weight: w.weight - (inPairs.get(w.key) ?? 0) })).filter((w) => w.weight > 0)
  return [...chosenPairs.map((p) => ({ ...p, weight: p.weight + 1 })), ...singles]
    .sort((a, b) => b.weight - a.weight || a.first - b.first)
    .slice(0, max)
    .map(({ term, key, weight }) => ({ term, key, weight }))
}

/** Todo el texto de la hoja de vida. */
export function cvText(d: CvData): string {
  return [
    d.headline,
    d.summary,
    d.skills,
    ...d.experience.flatMap((j) => [j.role, j.company, j.details]),
    ...d.education.flatMap((s) => [s.degree, s.school]),
    ...d.languages.flatMap((l) => [l.name, l.level]),
    ...d.courses.flatMap((c) => [c.name, c.org]),
    ...d.custom.flatMap((c) => [c.title, c.body]),
  ].join('\n')
}

export type OfferMatch = { score: number; found: Keyword[]; missing: Keyword[] }

/** Qué palabras clave de la oferta ya están en la hoja de vida, y el porcentaje (por peso). */
export function matchOffer(cv: string, offer: string, max = 25): OfferMatch {
  const keys = offerKeywords(offer, max)
  const useful = tokens(cv).filter((t) => !t.stop).map((t) => stem(t.norm))
  const single = new Set(useful)
  const pairs = new Set(useful.slice(1).map((s, i) => `${useful[i]} ${s}`))
  const has = (k: Keyword) => (k.key.includes(' ') ? pairs.has(k.key) : single.has(k.key))
  const found = keys.filter(has)
  const missing = keys.filter((k) => !has(k))
  const total = keys.reduce((n, k) => n + k.weight, 0)
  const score = total ? Math.round((100 * found.reduce((n, k) => n + k.weight, 0)) / total) : 0
  return { score, found, missing }
}
