/**
 * Apariencia de DocuSmart Web, como en Ajustes de la app: tema (Sistema, Claro,
 * Oscuro), color de acento (los 10 de la app, con su tono para claro y oscuro) y
 * tamaño de letra. Se guarda en el navegador y se aplica con variables CSS.
 */

export type ThemeMode = 'system' | 'light' | 'dark'
export type FontScale = 'normal' | 'large' | 'xlarge'
type Tone = { primary: string; deep: string; soft: string; light: string }

/** Mismos colores que AccentColor.kt de la app (primary / container / onContainer). */
export const ACCENTS = {
  blue: { swatch: '#2563EB', light: { primary: '#2563EB', deep: '#1D4ED8', soft: '#EAF0FF', light: '#60A5FA' }, dark: { primary: '#60A5FA', deep: '#93C5FD', soft: '#172554', light: '#93C5FD' } },
  purple: { swatch: '#7C3AED', light: { primary: '#7C3AED', deep: '#5B21B6', soft: '#EDE9FE', light: '#A78BFA' }, dark: { primary: '#C4B5FD', deep: '#DDD6FE', soft: '#2E1065', light: '#DDD6FE' } },
  green: { swatch: '#15803D', light: { primary: '#15803D', deep: '#14532D', soft: '#DCFCE7', light: '#4ADE80' }, dark: { primary: '#86EFAC', deep: '#BBF7D0', soft: '#052E16', light: '#BBF7D0' } },
  orange: { swatch: '#C2410C', light: { primary: '#C2410C', deep: '#7C2D12', soft: '#FFEDD5', light: '#FB923C' }, dark: { primary: '#FDBA74', deep: '#FED7AA', soft: '#431407', light: '#FED7AA' } },
  pink: { swatch: '#DB2777', light: { primary: '#DB2777', deep: '#831843', soft: '#FCE7F3', light: '#F472B6' }, dark: { primary: '#F9A8D4', deep: '#FBCFE8', soft: '#500724', light: '#FBCFE8' } },
  teal: { swatch: '#0F766E', light: { primary: '#0F766E', deep: '#134E4A', soft: '#CCFBF1', light: '#2DD4BF' }, dark: { primary: '#5EEAD4', deep: '#99F6E4', soft: '#042F2E', light: '#99F6E4' } },
  indigo: { swatch: '#4F46E5', light: { primary: '#4F46E5', deep: '#312E81', soft: '#E0E7FF', light: '#818CF8' }, dark: { primary: '#A5B4FC', deep: '#C7D2FE', soft: '#1E1B4B', light: '#C7D2FE' } },
  red: { swatch: '#DC2626', light: { primary: '#DC2626', deep: '#7F1D1D', soft: '#FEE2E2', light: '#F87171' }, dark: { primary: '#FCA5A5', deep: '#FECACA', soft: '#450A0A', light: '#FECACA' } },
  amber: { swatch: '#B45309', light: { primary: '#B45309', deep: '#78350F', soft: '#FEF3C7', light: '#FBBF24' }, dark: { primary: '#FCD34D', deep: '#FDE68A', soft: '#451A03', light: '#FDE68A' } },
  cyan: { swatch: '#0E7490', light: { primary: '#0E7490', deep: '#164E63', soft: '#CFFAFE', light: '#22D3EE' }, dark: { primary: '#67E8F9', deep: '#A5F3FC', soft: '#083344', light: '#A5F3FC' } },
} satisfies Record<string, { swatch: string; light: Tone; dark: Tone }>

export type Accent = keyof typeof ACCENTS
export const FONT_SCALES: Record<FontScale, number> = { normal: 1, large: 1.15, xlarge: 1.3 }

export type Appearance = { theme: ThemeMode; accent: Accent; font: FontScale }
export const DEFAULT_APPEARANCE: Appearance = { theme: 'system', accent: 'blue', font: 'normal' }
const STORAGE_KEY = 'ds-appearance'

/** Lee lo guardado, descartando valores que no existen (versiones viejas, datos raros). */
export function parseAppearance(raw: string | null): Appearance {
  try {
    const v = JSON.parse(raw ?? '{}') as Partial<Record<keyof Appearance, unknown>>
    return {
      theme: v.theme === 'light' || v.theme === 'dark' || v.theme === 'system' ? v.theme : DEFAULT_APPEARANCE.theme,
      accent: typeof v.accent === 'string' && v.accent in ACCENTS ? (v.accent as Accent) : DEFAULT_APPEARANCE.accent,
      font: typeof v.font === 'string' && v.font in FONT_SCALES ? (v.font as FontScale) : DEFAULT_APPEARANCE.font,
    }
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

export const resolveTheme = (mode: ThemeMode, systemDark: boolean): 'light' | 'dark' => (mode === 'system' ? (systemDark ? 'dark' : 'light') : mode)

/** Variables CSS del color de acento para el tema dado. */
export function accentVars(accent: Accent, theme: 'light' | 'dark'): Record<string, string> {
  const t = ACCENTS[accent][theme]
  const strong = ACCENTS[accent].light
  // --accent / --accent-deep: el tono intenso, para fondos con texto blanco (la cabecera) en los dos temas.
  return { '--blue': t.primary, '--blue-deep': t.deep, '--blue-soft': t.soft, '--blue-light': t.light, '--accent': strong.primary, '--accent-deep': strong.deep }
}

/* ───────────── Navegador ───────────── */

const systemDark = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches

export function loadAppearance(): Appearance {
  try {
    return parseAppearance(localStorage.getItem(STORAGE_KEY))
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

export function saveAppearance(a: Appearance) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a))
  } catch {
    // Navegación privada o almacenamiento bloqueado: se aplica igual, sin recordarlo.
  }
}

/** Aplica la apariencia al documento (tema, acento y tamaño de letra). */
export function applyAppearance(a: Appearance, root: HTMLElement = document.documentElement) {
  const theme = resolveTheme(a.theme, systemDark())
  root.dataset.theme = theme
  root.style.colorScheme = theme
  for (const [k, v] of Object.entries(accentVars(a.accent, theme))) root.style.setProperty(k, v)
  root.style.setProperty('--font-scale', String(FONT_SCALES[a.font]))
}

/** Con el tema "Sistema", sigue los cambios del sistema operativo. */
export function watchSystemTheme(get: () => Appearance): () => void {
  if (typeof matchMedia !== 'function') return () => {}
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const on = () => get().theme === 'system' && applyAppearance(get())
  mq.addEventListener('change', on)
  return () => mq.removeEventListener('change', on)
}
