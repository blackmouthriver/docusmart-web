/**
 * Apariencia de DocuSmart Web, como en Ajustes de la app: tema (Sistema, Claro,
 * Oscuro), color de acento (los 10 de la app, con su tono para claro y oscuro) y
 * tamaño de letra. Se guarda en el navegador y se aplica con variables CSS.
 */

export type ThemeMode = 'system' | 'light' | 'dark'
/** Estilo de la barra lateral (W-145): según el tema, oscura (la de siempre), clara o del color de acento. */
export type SidebarStyle = 'auto' | 'dark' | 'light' | 'accent'
export const SIDEBAR_STYLES: readonly SidebarStyle[] = ['auto', 'dark', 'light', 'accent']
export type FontScale = 'normal' | 'large' | 'xlarge'
type Tone = { primary: string; deep: string; soft: string; light: string }
type AccentDef = { swatch: string; light: Tone; dark: Tone; /** Degradado de dos colores (cabecera, barra y muestra). */ gradient?: readonly [string, string] }

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
  // Tonos oscuros (pedido del usuario, 2026-11-23): negro y azul profundo.
  black: { swatch: '#111827', light: { primary: '#111827', deep: '#030712', soft: '#E5E7EB', light: '#6B7280' }, dark: { primary: '#E5E7EB', deep: '#F3F4F6', soft: '#1F2937', light: '#F3F4F6' } },
  navy: { swatch: '#1E3A8A', light: { primary: '#1E3A8A', deep: '#172554', soft: '#DBEAFE', light: '#3B82F6' }, dark: { primary: '#93C5FD', deep: '#BFDBFE', soft: '#0B1A3D', light: '#BFDBFE' } },
  // Degradados de dos colores (pedido del usuario, 2026-11-23): la cabecera y la barra lateral de
  // color pasan de uno a otro. Los botones y enlaces usan el primer color (contraste con texto blanco).
  sunset: { swatch: '#EA580C', gradient: ['#EA580C', '#DB2777'], light: { primary: '#DB2777', deep: '#9D174D', soft: '#FFE4E6', light: '#FB923C' }, dark: { primary: '#F9A8D4', deep: '#FBCFE8', soft: '#4C0519', light: '#FDBA74' } },
  ocean: { swatch: '#2563EB', gradient: ['#2563EB', '#0891B2'], light: { primary: '#2563EB', deep: '#1E3A8A', soft: '#E0F2FE', light: '#22D3EE' }, dark: { primary: '#7DD3FC', deep: '#BAE6FD', soft: '#0C1E3E', light: '#67E8F9' } },
  aurora: { swatch: '#7C3AED', gradient: ['#7C3AED', '#DB2777'], light: { primary: '#7C3AED', deep: '#5B21B6', soft: '#F3E8FF', light: '#F472B6' }, dark: { primary: '#D8B4FE', deep: '#F5D0FE', soft: '#2E1065', light: '#F9A8D4' } },
  forest: { swatch: '#15803D', gradient: ['#15803D', '#0E7490'], light: { primary: '#15803D', deep: '#14532D', soft: '#DCFCE7', light: '#2DD4BF' }, dark: { primary: '#86EFAC', deep: '#BBF7D0', soft: '#052E16', light: '#5EEAD4' } },
  dusk: { swatch: '#4F46E5', gradient: ['#4F46E5', '#0284C7'], light: { primary: '#4F46E5', deep: '#312E81', soft: '#E0E7FF', light: '#38BDF8' }, dark: { primary: '#A5B4FC', deep: '#C7D2FE', soft: '#1E1B4B', light: '#7DD3FC' } },
  fire: { swatch: '#DC2626', gradient: ['#DC2626', '#D97706'], light: { primary: '#DC2626', deep: '#7F1D1D', soft: '#FEE2E2', light: '#FBBF24' }, dark: { primary: '#FCA5A5', deep: '#FECACA', soft: '#450A0A', light: '#FDE68A' } },
  lagoon: { swatch: '#0F766E', gradient: ['#0F766E', '#2563EB'], light: { primary: '#0F766E', deep: '#134E4A', soft: '#CCFBF1', light: '#60A5FA' }, dark: { primary: '#5EEAD4', deep: '#99F6E4', soft: '#042F2E', light: '#93C5FD' } },
  berry: { swatch: '#BE123C', gradient: ['#BE123C', '#7C3AED'], light: { primary: '#BE123C', deep: '#881337', soft: '#FFE4E6', light: '#A78BFA' }, dark: { primary: '#FDA4AF', deep: '#FECDD3', soft: '#4C0519', light: '#C4B5FD' } },
  galaxy: { swatch: '#312E81', gradient: ['#312E81', '#9333EA'], light: { primary: '#4338CA', deep: '#312E81', soft: '#E0E7FF', light: '#C084FC' }, dark: { primary: '#A5B4FC', deep: '#C7D2FE', soft: '#1E1B4B', light: '#D8B4FE' } },
  coral: { swatch: '#E11D48', gradient: ['#E11D48', '#EA580C'], light: { primary: '#E11D48', deep: '#9F1239', soft: '#FFE4E6', light: '#FB923C' }, dark: { primary: '#FDA4AF', deep: '#FECDD3', soft: '#4C0519', light: '#FDBA74' } },
  night: { swatch: '#1E293B', gradient: ['#1E293B', '#4F46E5'], light: { primary: '#4F46E5', deep: '#1E293B', soft: '#E0E7FF', light: '#818CF8' }, dark: { primary: '#A5B4FC', deep: '#C7D2FE', soft: '#0F172A', light: '#C7D2FE' } },
  tropical: { swatch: '#0D9488', gradient: ['#0D9488', '#B45309'], light: { primary: '#0F766E', deep: '#134E4A', soft: '#CCFBF1', light: '#FBBF24' }, dark: { primary: '#5EEAD4', deep: '#99F6E4', soft: '#042F2E', light: '#FDE68A' } },
  neon: { swatch: '#C026D3', gradient: ['#C026D3', '#2563EB'], light: { primary: '#A21CAF', deep: '#701A75', soft: '#FAE8FF', light: '#60A5FA' }, dark: { primary: '#F0ABFC', deep: '#F5D0FE', soft: '#4A044E', light: '#93C5FD' } },
  obsidian: { swatch: '#0F172A', gradient: ['#0F172A', '#475569'], light: { primary: '#1E293B', deep: '#0F172A', soft: '#E2E8F0', light: '#94A3B8' }, dark: { primary: '#CBD5E1', deep: '#E2E8F0', soft: '#1E293B', light: '#E2E8F0' } },
  abyss: { swatch: '#0B1F4D', gradient: ['#0B1F4D', '#1D4ED8'], light: { primary: '#1E3A8A', deep: '#0B1F4D', soft: '#DBEAFE', light: '#60A5FA' }, dark: { primary: '#93C5FD', deep: '#BFDBFE', soft: '#0B1A3D', light: '#BFDBFE' } },
  midnight: { swatch: '#030712', gradient: ['#030712', '#1E3A8A'], light: { primary: '#111827', deep: '#030712', soft: '#E0E7FF', light: '#6366F1' }, dark: { primary: '#C7D2FE', deep: '#E0E7FF', soft: '#111827', light: '#E0E7FF' } },
} satisfies Record<string, AccentDef>

export type Accent = keyof typeof ACCENTS
/** Los colores de un solo tono (como la app) y los degradados de dos colores. */
export const SOLID_ACCENTS = (Object.keys(ACCENTS) as Accent[]).filter((id) => !(ACCENTS[id] as AccentDef).gradient)
export const GRADIENT_ACCENTS = (Object.keys(ACCENTS) as Accent[]).filter((id) => !!(ACCENTS[id] as AccentDef).gradient)

/** Fondo de la muestra en Ajustes: el color o su degradado. */
export function accentSwatch(id: Accent): string {
  const g = (ACCENTS[id] as AccentDef).gradient
  return g ? `linear-gradient(135deg, ${g[0]}, ${g[1]})` : ACCENTS[id].swatch
}
export const FONT_SCALES: Record<FontScale, number> = { normal: 1, large: 1.15, xlarge: 1.3 }

/** animatedBg: fondo animado detrás del contenido (W-89), activado por defecto como en la app. */
export type Appearance = { theme: ThemeMode; accent: Accent; font: FontScale; animatedBg: boolean; sidebar: SidebarStyle }
export const DEFAULT_APPEARANCE: Appearance = { theme: 'system', accent: 'blue', font: 'normal', animatedBg: true, sidebar: 'dark' }
const STORAGE_KEY = 'ds-appearance'

/** Lee lo guardado, descartando valores que no existen (versiones viejas, datos raros). */
export function parseAppearance(raw: string | null): Appearance {
  try {
    const v = JSON.parse(raw ?? '{}') as Partial<Record<keyof Appearance, unknown>>
    return {
      theme: v.theme === 'light' || v.theme === 'dark' || v.theme === 'system' ? v.theme : DEFAULT_APPEARANCE.theme,
      accent: typeof v.accent === 'string' && v.accent in ACCENTS ? (v.accent as Accent) : DEFAULT_APPEARANCE.accent,
      font: typeof v.font === 'string' && v.font in FONT_SCALES ? (v.font as FontScale) : DEFAULT_APPEARANCE.font,
      animatedBg: typeof v.animatedBg === 'boolean' ? v.animatedBg : DEFAULT_APPEARANCE.animatedBg,
      sidebar: typeof v.sidebar === 'string' && (SIDEBAR_STYLES as readonly string[]).includes(v.sidebar) ? (v.sidebar as SidebarStyle) : DEFAULT_APPEARANCE.sidebar,
    }
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

export const resolveTheme = (mode: ThemeMode, systemDark: boolean): 'light' | 'dark' => (mode === 'system' ? (systemDark ? 'dark' : 'light') : mode)

/** La barra "según el tema" es clara con el tema claro y oscura con el oscuro. */
export const resolveSidebar = (style: SidebarStyle, theme: 'light' | 'dark'): Exclude<SidebarStyle, 'auto'> => (style === 'auto' ? theme : style)

/** Variables CSS del color de acento para el tema dado. */
export function accentVars(accent: Accent, theme: 'light' | 'dark'): Record<string, string> {
  const t = ACCENTS[accent][theme]
  const strong = ACCENTS[accent].light
  // --accent / --accent-deep: el tono intenso, para fondos con texto blanco (la cabecera) en los dos temas.
  // --grad-a / --grad-b: los dos colores de un degradado ('' los quita y vale el del color único).
  // --tint-a / --tint-b: los dos colores que tiñen suave el fondo de la página (el degradado o el color y su tono claro).
  const g = (ACCENTS[accent] as AccentDef).gradient
  return {
    '--blue': t.primary, '--blue-deep': t.deep, '--blue-soft': t.soft, '--blue-light': t.light, '--accent': strong.primary, '--accent-deep': strong.deep,
    '--grad-a': g?.[0] ?? '', '--grad-b': g?.[1] ?? '', '--tint-a': g?.[0] ?? strong.primary, '--tint-b': g?.[1] ?? strong.light,
  }
}

/* ───────────── Navegador ───────────── */

export const systemDark = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches

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

/** Solo el tema claro u oscuro, sin acento ni tamaño de letra (la portada, con sus colores de marca). */
export function applyTheme(a: Appearance, root: HTMLElement = document.documentElement): 'light' | 'dark' {
  const theme = resolveTheme(a.theme, systemDark())
  root.dataset.theme = theme
  root.style.colorScheme = theme
  return theme
}

/** Aplica la apariencia al documento (tema, acento y tamaño de letra). */
export function applyAppearance(a: Appearance, root: HTMLElement = document.documentElement) {
  const theme = applyTheme(a, root)
  // Un valor vacío quita la variable (así, al volver a un color único, desaparece el degradado).
  for (const [k, v] of Object.entries(accentVars(a.accent, theme))) root.style.setProperty(k, v)
  root.style.setProperty('--font-scale', String(FONT_SCALES[a.font]))
  root.dataset.animBg = a.animatedBg ? 'on' : 'off'
  root.dataset.sidebar = resolveSidebar(a.sidebar, theme)
}

/** Con el tema "Sistema", sigue los cambios del sistema operativo. */
export function watchSystemTheme(get: () => Appearance, apply: (a: Appearance) => unknown = applyAppearance): () => void {
  if (typeof matchMedia !== 'function') return () => {}
  const mq = matchMedia('(prefers-color-scheme: dark)')
  const on = () => get().theme === 'system' && apply(get())
  mq.addEventListener('change', on)
  return () => mq.removeEventListener('change', on)
}
