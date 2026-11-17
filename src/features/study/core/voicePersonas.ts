/**
 * Personajes de voz del Modo Estudio, los mismos de la app (VoicePersona.kt):
 * en vez de nombres técnicos ("Microsoft Sabina - Spanish (Mexico)") cada voz
 * del navegador se muestra como un personaje con nombre, ilustración y color.
 *
 * Los nombres no se traducen: son identidades de personaje, igual que en la app.
 * El navegador no informa el género de una voz; se deduce del nombre con una
 * tabla de voces conocidas (Windows/Edge, Chrome, Safari) y, si no se conoce,
 * la voz toma cualquier personaje libre.
 */

export type VoicePersona = {
  /** Identificador estable y nombre del archivo de la ilustración (public/img/voices/<id>.webp). */
  id: string
  name: string
  feminine: boolean
  /** Anillo de color alrededor del avatar (mismo color que en la app). */
  color: string
}

export const VOICE_PERSONAS: readonly VoicePersona[] = [
  { id: 'sofia', name: 'Sofía', feminine: true, color: '#2563EB' },
  { id: 'mateo', name: 'Mateo', feminine: false, color: '#22C55E' },
  { id: 'valentina', name: 'Valentina', feminine: true, color: '#F97316' },
  { id: 'diego', name: 'Diego', feminine: false, color: '#4338CA' },
  { id: 'camila', name: 'Camila', feminine: true, color: '#EF4444' },
  { id: 'sebastian', name: 'Sebastián', feminine: false, color: '#06B6D4' },
  { id: 'isabella', name: 'Isabella', feminine: true, color: '#FBBF24' },
  { id: 'emilio', name: 'Emilio', feminine: false, color: '#1D4ED8' },
  { id: 'lucia', name: 'Lucía', feminine: true, color: '#D97706' },
  { id: 'nicolas', name: 'Nicolás', feminine: false, color: '#78716C' },
]

export const personaAvatar = (p: VoicePersona) => `/img/voices/${p.id}.webp`

// Nombres de voces de Windows/Edge (incluidas las "Online (Natural)"), Safari/macOS/iOS
// y otras frecuentes, sin tildes ni guiones. true = femenina, false = masculina.
const FEMALE = `helena laura sabina elvira dalia elena paloma salome catalina ximena andrea camila karina
  monica paulina marisol angelica soledad isabela marta lucia
  zira hazel susan aria jenny sonia libby natasha clara emma ava michelle samantha karen moira tessa fiona
  victoria allison serena kate
  maria francisca helia raquel luciana joana thalita fernanda
  hortense julie denise eloise sylvie amelie audrey aurelie marie
  hedda katja amala seraphina anna petra
  elsa isabella alice federica paola
  herena alba montserrat ainhoa
  irina svetlana dariya milena katya
  ayumi haruka sayaka nanami kyoko mizuki
  heami sunhi yuna sora
  huihui yaoyao xiaoxiao xiaoyi hanhan tingting meijia sinji hiumaan hiugaai`
const MALE = `pablo raul alvaro jorge tomas gonzalo alonso lorenzo emilio diego juan carlos
  david mark george guy ryan william christopher eric roger steffan brian andrew daniel alex fred arthur oliver
  thomas aaron
  antonio duarte felipe
  paul henri antoine jean remy nicolas
  stefan conrad killian markus yannick florian
  cosimo giuseppe luca benigno
  enric jordi ander
  pavel dmitry yuri
  ichiro keita otoya hattori
  injoon minsu
  kangkang yunxi yunyang zhiwei danny yunjian`
const KNOWN = new Map<string, boolean>([
  ...FEMALE.split(/\s+/).filter(Boolean).map((n) => [n, true] as const),
  ...MALE.split(/\s+/).filter(Boolean).map((n) => [n, false] as const),
])

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/-/g, '')

/** Género deducido del nombre de la voz; `undefined` si no se puede saber. */
export function guessFeminine(voiceName: string): boolean | undefined {
  const n = normalize(voiceName)
  const words = n.split(/[^\p{L}]+/u).filter(Boolean)
  if (words.some((w) => w === 'female' || w === 'mujer' || w === 'femenina')) return true
  if (words.some((w) => w === 'male' || w === 'hombre' || w === 'masculina')) return false
  for (const w of words) {
    const known = KNOWN.get(w)
    if (known !== undefined) return known
  }
  // Las voces "Google <idioma>" de Chrome son femeninas (las masculinas dicen "Male").
  if (words[0] === 'google') return true
  return undefined
}

/**
 * Un personaje distinto para cada voz de la lista (port de `personasForVoices` de la app):
 * se ordenan por id para que el resultado sea estable entre sesiones; las voces femeninas
 * solo toman personajes femeninos y las masculinas, masculinos; las de género desconocido
 * toman primero los personajes libres. Solo se repite cuando hay más voces que personajes.
 */
export function personasForVoices(voices: readonly { id: string; feminine?: boolean }[]): Map<string, VoicePersona> {
  const sorted = [...new Map(voices.map((v) => [v.id, v])).values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  const female = VOICE_PERSONAS.filter((p) => p.feminine)
  const male = VOICE_PERSONAS.filter((p) => !p.feminine)
  const result = new Map<string, VoicePersona>()
  sorted.filter((v) => v.feminine === true).forEach((v, i) => result.set(v.id, female[i % female.length]))
  sorted.filter((v) => v.feminine === false).forEach((v, i) => result.set(v.id, male[i % male.length]))
  const used = new Set(result.values())
  const order = [...VOICE_PERSONAS.filter((p) => !used.has(p)), ...VOICE_PERSONAS.filter((p) => used.has(p))]
  sorted.filter((v) => v.feminine === undefined).forEach((v, i) => result.set(v.id, order[i % order.length]))
  return result
}

/** Voces a mostrar: las del idioma pedido (o todas) y, entre ellas, primero las que funcionan sin internet. */
export function voicesForLanguage<V extends { lang: string; localService: boolean; name: string }>(voices: readonly V[], lang: string | null): V[] {
  const base = lang ? voices.filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase())) : [...voices]
  return base.sort((a, b) => Number(b.localService) - Number(a.localService) || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name))
}
