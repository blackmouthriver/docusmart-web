import { describe, expect, it, vi } from 'vitest'
import { LANGS, detectLanguage, isLang, langFromTimeZone } from '../../../../src/shared/i18n/languages'
import { ACCENTS, DEFAULT_APPEARANCE, GRADIENT_ACCENTS, SOLID_ACCENTS, accentSwatch, accentVars, applyAppearance, applyTheme, parseAppearance, resolveSidebar, resolveTheme } from '../../../../src/app/appearance'

describe('idiomas', () => {
  it('los 12 de la app', () => {
    expect(LANGS.map((l) => l.code)).toEqual(['es', 'en', 'pt', 'de', 'ru', 'ja', 'ko', 'zh', 'it', 'fr', 'ca', 'eu'])
    expect(isLang('fr')).toBe(true)
    expect(isLang('ar')).toBe(false)
    expect(isLang(3)).toBe(false)
  })

  it('guardado → navegador → zona horaria → español', () => {
    expect(detectLanguage({ saved: 'ja', browser: ['en-US'] })).toBe('ja')
    expect(detectLanguage({ saved: 'xx', browser: ['ar-EG', 'pt-BR', 'en'] })).toBe('pt')
    expect(detectLanguage({ browser: ['zh_TW'] })).toBe('zh')
    expect(detectLanguage({ browser: ['ar'], timeZone: 'Europe/Paris' })).toBe('fr')
    expect(detectLanguage({ browser: [], timeZone: 'Asia/Dubai' })).toBe('es')
    expect(detectLanguage({})).toBe('es')
  })

  it('zona horaria como respaldo', () => {
    expect(langFromTimeZone('America/Bogota')).toBe('es')
    expect(langFromTimeZone('America/Sao_Paulo')).toBe('pt')
    expect(langFromTimeZone('Europe/Berlin')).toBe('de')
    expect(langFromTimeZone('Asia/Tokyo')).toBe('ja')
    expect(langFromTimeZone('Asia/Seoul')).toBe('ko')
    expect(langFromTimeZone('Asia/Shanghai')).toBe('zh')
    expect(langFromTimeZone('Europe/Rome')).toBe('it')
    expect(langFromTimeZone('Europe/Moscow')).toBe('ru')
    expect(langFromTimeZone('Asia/Dubai')).toBeNull()
    expect(langFromTimeZone(undefined)).toBeNull()
  })
})

describe('apariencia', () => {
  it('los 10 colores de la app', () => {
    expect(Object.keys(ACCENTS)).toEqual(['blue', 'purple', 'green', 'orange', 'pink', 'teal', 'indigo', 'red', 'amber', 'cyan', 'black', 'navy', 'sunset', 'ocean', 'aurora', 'forest', 'dusk', 'fire', 'lagoon', 'berry', 'galaxy', 'coral', 'night', 'tropical', 'neon', 'obsidian', 'abyss', 'midnight'])
    expect(SOLID_ACCENTS).toHaveLength(12)
    expect(GRADIENT_ACCENTS).toEqual(['sunset', 'ocean', 'aurora', 'forest', 'dusk', 'fire', 'lagoon', 'berry', 'galaxy', 'coral', 'night', 'tropical', 'neon', 'obsidian', 'abyss', 'midnight'])
  })

  it('lee lo guardado sin aceptar valores raros', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE)
    // Guardado antes de W-89 (sin animatedBg ni sidebar): fondo animado activado y barra oscura, como antes.
    expect(parseAppearance('{"theme":"dark","accent":"pink","font":"large"}')).toEqual({ theme: 'dark', accent: 'pink', font: 'large', animatedBg: true, sidebar: 'dark' })
    expect(parseAppearance('{"animatedBg":false}').animatedBg).toBe(false)
    expect(parseAppearance('{"animatedBg":"no"}').animatedBg).toBe(true)
    expect(parseAppearance('{"theme":"neon","accent":"gold","font":9}')).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('no es json')).toEqual(DEFAULT_APPEARANCE)
  })

  it('tema y variables del acento', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(accentVars('green', 'light')['--blue']).toBe('#15803D')
    expect(accentVars('green', 'dark')['--blue']).toBe('#86EFAC')
    expect(accentVars('green', 'dark')['--accent']).toBe('#15803D')
  })

  it('degradados de dos colores (2026-11-23): variables y muestra', () => {
    expect(accentVars('sunset', 'light')).toMatchObject({ '--grad-a': '#EA580C', '--grad-b': '#DB2777', '--accent': '#DB2777' })
    // Un color único deja las variables vacías (y así se quitan del documento).
    expect(accentVars('blue', 'dark')).toMatchObject({ '--grad-a': '', '--grad-b': '' })
    expect(accentSwatch('ocean')).toBe('linear-gradient(135deg, #2563EB, #0891B2)')
    expect(accentSwatch('green')).toBe('#15803D')
    expect(parseAppearance('{"accent":"aurora"}').accent).toBe('aurora')
    const vars: Record<string, string> = {}
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '', setProperty: (k: string, v: string) => (vars[k] = v) } }
    applyAppearance({ ...DEFAULT_APPEARANCE, theme: 'light', accent: 'fire' }, root as unknown as HTMLElement)
    expect([vars['--grad-a'], vars['--grad-b']]).toEqual(['#DC2626', '#D97706'])
    applyAppearance({ ...DEFAULT_APPEARANCE, theme: 'light', accent: 'teal' }, root as unknown as HTMLElement)
    expect([vars['--grad-a'], vars['--grad-b']]).toEqual(['', ''])
  })

  it('el fondo se tiñe con el acento: el degradado o el color y su tono claro', () => {
    expect(accentVars('ocean', 'dark')).toMatchObject({ '--tint-a': '#2563EB', '--tint-b': '#0891B2' })
    expect(accentVars('navy', 'dark')).toMatchObject({ '--tint-a': '#1E3A8A', '--tint-b': '#3B82F6' })
    expect(accentVars('black', 'light')).toMatchObject({ '--accent': '#111827', '--tint-a': '#111827' })
  })

  it('se aplica al documento', () => {
    const vars: Record<string, string> = {}
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '', setProperty: (k: string, v: string) => (vars[k] = v) } }
    applyAppearance({ theme: 'dark', accent: 'red', font: 'xlarge', animatedBg: false, sidebar: 'auto' }, root as unknown as HTMLElement)
    expect(root.dataset.theme).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(vars['--blue']).toBe('#FCA5A5')
    expect(vars['--font-scale']).toBe('1.3')
    expect(root.dataset.animBg).toBe('off')
    // Barra lateral según el tema: oscura con el tema oscuro.
    expect(root.dataset.sidebar).toBe('dark')
  })

  it('estilo de la barra lateral (W-145): guardado válido y según el tema', () => {
    expect(parseAppearance(JSON.stringify({ sidebar: 'light' })).sidebar).toBe('light')
    expect(parseAppearance(JSON.stringify({ sidebar: 'rosa' })).sidebar).toBe('dark')
    expect(resolveSidebar('auto', 'light')).toBe('light')
    expect(resolveSidebar('accent', 'dark')).toBe('accent')
  })

  it('solo el tema, sin tocar acento ni letra (portada)', () => {
    const setProperty = vi.fn()
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '', setProperty } }
    expect(applyTheme({ theme: 'dark', accent: 'red', font: 'xlarge', animatedBg: true, sidebar: 'dark' }, root as unknown as HTMLElement)).toBe('dark')
    expect(root.dataset.theme).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(setProperty).not.toHaveBeenCalled()
  })
})

describe('traducción', () => {
  it('usa el idioma (sin la clave, la clave misma) y reemplaza variables', async () => {
    const { translate, loadMessages } = await import('../../../../src/shared/i18n/translate')
    const { es } = await import('../../../../src/shared/i18n/messages/es')
    // Sin respaldo en español: cada página carga su diccionario y todos traen todas las claves.
    expect(translate({}, 'nav.home')).toBe('nav.home')
    expect(translate({ 'nav.home': 'Home' }, 'nav.home')).toBe('Home')
    expect(translate({ 'nav.home': 'Hola {nombre}, {n} y {otra}' }, 'nav.home', { nombre: 'Ana', n: 3 })).toBe('Hola Ana, 3 y {otra}')
    expect(await loadMessages('es')).toEqual(es)
    // Los 11 diccionarios cargan y traen todas las claves
    for (const l of LANGS.filter((x) => x.code !== 'es')) {
      const dict = await loadMessages(l.code)
      expect(Object.keys(dict).sort()).toEqual(Object.keys(es).sort())
      expect(dict['nav.home']).not.toBe('')
    }
  })
})
