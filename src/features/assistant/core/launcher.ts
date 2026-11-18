/**
 * Botón flotante del asistente (W-70d): textos (disponibles antes de descargar la base) y cuándo
 * llamar la atención. Regla de UX: la burbuja de bienvenida sale una vez por visita y, cuando el
 * usuario ya abrió el asistente, se apagan los destellos (ya lo descubrió; no hay que insistir).
 */

export const LAUNCHER_TEXT: Readonly<Record<string, { label: string; teaser: string; dismiss: string }>> = {
  es: { label: 'Asistente de DocuSmart', teaser: '¿Necesitas ayuda? Pregúntame 👋', dismiss: 'Cerrar' },
  en: { label: 'DocuSmart assistant', teaser: 'Need help? Ask me 👋', dismiss: 'Close' },
  pt: { label: 'Assistente do DocuSmart', teaser: 'Precisa de ajuda? Pergunte-me 👋', dismiss: 'Fechar' },
  fr: { label: 'Assistant DocuSmart', teaser: "Besoin d'aide ? Demande-moi 👋", dismiss: 'Fermer' },
  it: { label: 'Assistente di DocuSmart', teaser: 'Ti serve aiuto? Chiedimi 👋', dismiss: 'Chiudi' },
  de: { label: 'DocuSmart-Assistent', teaser: 'Brauchst du Hilfe? Frag mich 👋', dismiss: 'Schließen' },
  ca: { label: 'Assistent de DocuSmart', teaser: 'Necessites ajuda? Pregunta’m 👋', dismiss: 'Tancar' },
  eu: { label: 'DocuSmart laguntzailea', teaser: 'Laguntza behar duzu? Galdetu 👋', dismiss: 'Itxi' },
  ru: { label: 'Помощник DocuSmart', teaser: 'Нужна помощь? Спросите меня 👋', dismiss: 'Закрыть' },
  ja: { label: 'DocuSmart アシスタント', teaser: 'お困りですか？聞いてください 👋', dismiss: '閉じる' },
  ko: { label: 'DocuSmart 도우미', teaser: '도움이 필요하세요? 물어보세요 👋', dismiss: '닫기' },
  zh: { label: 'DocuSmart 助手', teaser: '需要帮助吗？问我吧 👋', dismiss: '关闭' },
}

export const launcherText = (lang: string) => LAUNCHER_TEXT[lang] ?? LAUNCHER_TEXT.en

/** Clave en sessionStorage: '' (nada), 'teased' (ya vio la burbuja) u 'opened' (ya abrió el asistente). */
export const SEEN_KEY = 'ds-assistant-seen'

type Store = Pick<Storage, 'getItem' | 'setItem'> | null | undefined

function read(store: Store): string {
  try {
    return store?.getItem(SEEN_KEY) ?? ''
  } catch {
    return ''
  }
}

/** Qué llamados de atención mostrar en esta visita. */
export function attentionState(store: Store): { teaser: boolean; sparkle: boolean } {
  const seen = read(store)
  return { teaser: seen === '', sparkle: seen !== 'opened' }
}

/** Recuerda (solo en esta visita) que ya vio la burbuja o que abrió el asistente. */
export function markSeen(store: Store, what: 'teased' | 'opened'): void {
  if (what === 'teased' && read(store) === 'opened') return
  try {
    store?.setItem(SEEN_KEY, what)
  } catch {
    /* almacenamiento bloqueado: solo se repetirá la burbuja */
  }
}

/** Tiempos de la burbuja: aparece tras un momento y se va sola. */
export const TEASER_DELAY_MS = 3500
export const TEASER_VISIBLE_MS = 8000

/**
 * Pausa de "escribiendo…" antes de mostrar una respuesta: la conversación se siente atendida, no
 * instantánea. Crece con el largo de la respuesta, con un mínimo y un tope para que no aburra.
 */
export const TYPING_MIN_MS = 700
export const TYPING_MAX_MS = 1700
export function typingDelay(answerLength: number): number {
  return Math.round(Math.min(TYPING_MAX_MS, TYPING_MIN_MS + Math.max(0, answerLength) * 4))
}
