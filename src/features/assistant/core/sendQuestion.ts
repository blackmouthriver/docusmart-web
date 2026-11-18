/**
 * "Enviar esta pregunta" (W-70g): cuando el asistente no sabe responder, arma un correo a soporte con
 * la pregunta ya escrita. Solo abre la app de correo del usuario: nada se envía solo y el usuario
 * decide si lo manda. Así conocemos las preguntas reales para mejorar la base (docs/CHATBOT.md §8).
 */
import type { KbAction } from './engine'

/** Más largo que esto no aporta y alarga demasiado el enlace `mailto:`. */
export const MAX_QUESTION_CHARS = 500

export type QuestionMailTexts = {
  /** Texto del botón. */
  label: string
  /** Asunto del correo. */
  subject: string
  /** Primera línea del cuerpo, antes de la pregunta. */
  intro: string
}

/**
 * Acción con el `mailto:` listo. `page` es la ruta donde se hizo la pregunta (solo el camino, sin
 * parámetros ni `#`, para no incluir nada más que lo que el usuario escribió).
 */
export function questionMail(question: string, texts: QuestionMailTexts, to: string, page = ''): KbAction {
  const q = question.trim().replace(/\s+/g, ' ')
  const short = q.length > MAX_QUESTION_CHARS ? `${q.slice(0, MAX_QUESTION_CHARS - 1)}…` : q
  const path = page.split(/[?#]/)[0]
  const body = [texts.intro, '', `“${short}”`, ...(path ? ['', `— ${path}`] : [])].join('\n')
  // encodeURIComponent (no URLSearchParams): los clientes de correo esperan %20, no "+".
  const href = `mailto:${to}?subject=${encodeURIComponent(texts.subject)}&body=${encodeURIComponent(body)}`
  return { kind: 'link', label: texts.label, href }
}
