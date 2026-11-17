/**
 * Idiomas de DocuSmart Web: los mismos 12 de la app Android (AppLanguage), con su
 * bandera y su nombre en el propio idioma.
 */
export const LANGS = [
  { code: 'es', name: 'Español', region: 'España', flag: '🇪🇸' },
  { code: 'en', name: 'English', region: 'United Kingdom', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', region: 'Portugal', flag: '🇵🇹' },
  { code: 'de', name: 'Deutsch', region: 'Deutschland', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', region: 'Россия', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', region: '日本', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', region: '대한민국', flag: '🇰🇷' },
  { code: 'zh', name: '中文', region: '中国', flag: '🇨🇳' },
  { code: 'it', name: 'Italiano', region: 'Italia', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', region: 'France', flag: '🇫🇷' },
  // Catalán y euskera no tienen bandera propia en emoji: se usa la de España, como en la app.
  { code: 'ca', name: 'Català', region: 'Espanya', flag: '🇪🇸' },
  { code: 'eu', name: 'Euskara', region: 'Espainia', flag: '🇪🇸' },
] as const

export type Lang = (typeof LANGS)[number]['code']
export const DEFAULT_LANG: Lang = 'es'
const CODES = new Set<string>(LANGS.map((l) => l.code))

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && CODES.has(v)

/**
 * Zona horaria → idioma, solo como respaldo cuando el navegador no dice un idioma
 * que tengamos. No se consulta la IP: así no se envía nada a terceros.
 */
const TIMEZONES: Array<[RegExp, Lang]> = [
  [/^Europe\/(Madrid)$|^Atlantic\/Canary$|^Africa\/Ceuta$/, 'es'],
  [/^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Maceio|Araguaina|Noronha|Santarem)$|^Europe\/Lisbon$|^Atlantic\/(Azores|Madeira)$|^Africa\/(Luanda|Maputo)$/, 'pt'],
  [/^America\//, 'es'],
  [/^Europe\/(Berlin|Vienna|Zurich|Busingen)$/, 'de'],
  [/^Europe\/(Moscow|Kirov|Volgograd|Samara|Ulyanovsk|Astrakhan|Saratov|Minsk)$|^Asia\/(Yekaterinburg|Omsk|Novosibirsk|Krasnoyarsk|Irkutsk|Yakutsk|Vladivostok|Magadan|Kamchatka)$/, 'ru'],
  [/^Asia\/Tokyo$/, 'ja'],
  [/^Asia\/Seoul$/, 'ko'],
  [/^Asia\/(Shanghai|Urumqi|Hong_Kong|Macau|Taipei)$/, 'zh'],
  [/^Europe\/(Rome|Vatican|San_Marino)$/, 'it'],
  [/^Europe\/(Paris|Brussels|Luxembourg|Monaco)$|^America\/(Montreal)$/, 'fr'],
]

export function langFromTimeZone(tz: string | undefined): Lang | null {
  if (!tz) return null
  return TIMEZONES.find(([re]) => re.test(tz))?.[1] ?? null
}

/**
 * Idioma a usar, con la misma regla que la app: el guardado si es válido; si no, el
 * primero del navegador que tengamos; si no, el de la zona horaria; si no, español.
 */
export function detectLanguage(o: { saved?: string | null; browser?: readonly string[]; timeZone?: string }): Lang {
  if (isLang(o.saved)) return o.saved
  for (const tag of o.browser ?? []) {
    const base = tag.toLowerCase().split(/[-_]/)[0]
    if (isLang(base)) return base
  }
  return langFromTimeZone(o.timeZone) ?? DEFAULT_LANG
}
