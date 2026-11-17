// Contexto de idioma de DocuSmart Web: `useT()` devuelve t(), el idioma y setLang().
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { detectLanguage, type Lang } from './languages'
import { loadMessages, setCurrentDict, translate, type Dict, type Vars } from './translate'
import type { MessageKey } from './messages/es'

const STORAGE_KEY = 'ds-lang'

type I18nValue = { lang: Lang; t: (key: MessageKey, vars?: Vars) => string; setLang: (l: Lang) => Promise<void> }
const I18nContext = createContext<I18nValue>({ lang: 'es', t: (k, v) => translate({}, k, v), setLang: async () => {} })

export const useT = () => useContext(I18nContext)

/** Idioma inicial: el guardado, el del navegador o el de la zona horaria (como la app). */
export function initialLanguage(): Lang {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    // almacenamiento bloqueado
  }
  let timeZone: string | undefined
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    timeZone = undefined
  }
  return detectLanguage({ saved, browser: typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language], timeZone })
}

export function I18nProvider({ initialLang, initialDict, children }: { initialLang: Lang; initialDict: Dict; children: ReactNode }) {
  const [state, setState] = useState(() => {
    setCurrentDict(initialDict)
    return { lang: initialLang, dict: initialDict }
  })
  const setLang = useCallback(async (lang: Lang) => {
    const dict = await loadMessages(lang)
    setCurrentDict(dict)
    setState({ lang, dict })
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // se aplica igual, sin recordarlo
    }
  }, [])
  const value = useMemo<I18nValue>(() => ({ lang: state.lang, t: (k, v) => translate(state.dict, k, v), setLang }), [state, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
