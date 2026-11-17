/**
 * Cuando el visitante elige un idioma en el selector de las páginas públicas
 * (enlaces con data-set-lang), se guarda igual que el de Ajustes de la app web:
 * así /app/ se abre en ese idioma.
 */
export const LANG_KEY = 'ds-lang'

export function saveLangChoice(lang: string | undefined): void {
  if (!lang || !/^[a-z]{2}$/.test(lang)) return
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* almacenamiento bloqueado: no pasa nada */
  }
}

export function rememberLangChoice(target: Pick<Document, 'addEventListener'> = document): void {
  target.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest?.<HTMLElement>('[data-set-lang]')
    if (el) saveLangChoice(el.dataset.setLang)
  })
}
