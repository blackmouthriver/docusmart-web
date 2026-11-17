import { describe, expect, it } from 'vitest'
import { LANGS, detectLanguage, isLang, langFromTimeZone } from './languages'
import { ACCENTS, DEFAULT_APPEARANCE, accentVars, applyAppearance, parseAppearance, resolveTheme } from '../appearance'

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
    expect(Object.keys(ACCENTS)).toEqual(['blue', 'purple', 'green', 'orange', 'pink', 'teal', 'indigo', 'red', 'amber', 'cyan'])
  })

  it('lee lo guardado sin aceptar valores raros', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE)
    expect(parseAppearance('{"theme":"dark","accent":"pink","font":"large"}')).toEqual({ theme: 'dark', accent: 'pink', font: 'large' })
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

  it('se aplica al documento', () => {
    const vars: Record<string, string> = {}
    const root = { dataset: {} as Record<string, string>, style: { colorScheme: '', setProperty: (k: string, v: string) => (vars[k] = v) } }
    applyAppearance({ theme: 'dark', accent: 'red', font: 'xlarge' }, root as unknown as HTMLElement)
    expect(root.dataset.theme).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(vars['--blue']).toBe('#FCA5A5')
    expect(vars['--font-scale']).toBe('1.3')
  })
})

describe('traducción', () => {
  it('usa el idioma, cae al español y reemplaza variables', async () => {
    const { translate, loadMessages } = await import('./translate')
    const { es } = await import('./messages/es')
    expect(translate({}, 'nav.home')).toBe('Inicio')
    expect(translate({ 'nav.home': 'Home' }, 'nav.home')).toBe('Home')
    expect(translate({ 'nav.home': 'Hola {nombre}, {n} y {otra}' }, 'nav.home', { nombre: 'Ana', n: 3 })).toBe('Hola Ana, 3 y {otra}')
    expect(await loadMessages('es')).toBe(es)
    // Los 11 diccionarios cargan y traen todas las claves
    for (const l of LANGS.filter((x) => x.code !== 'es')) {
      const dict = await loadMessages(l.code)
      expect(Object.keys(dict).sort()).toEqual(Object.keys(es).sort())
      expect(dict['nav.home']).not.toBe('')
    }
  })
})
