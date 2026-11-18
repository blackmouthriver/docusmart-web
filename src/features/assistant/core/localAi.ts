/**
 * IA del propio navegador para redactar respuestas (W-70f), por ejemplo Gemini Nano en Chrome
 * (Prompt API). Reglas: la IA no elige ni inventa la respuesta — la elige el motor y la IA solo la
 * reescribe con naturalidad a partir de ese texto; corre en el dispositivo (nada sale del equipo);
 * ante cualquier duda (idioma no soportado, salida vacía o rara, demora) se usa la respuesta fija.
 */

/** Idiomas en los que la Prompt API redacta hoy. Los demás usan siempre la respuesta fija. */
export const AI_LANGS = ['en', 'es', 'ja'] as const

export const aiLangSupported = (lang: string): boolean => (AI_LANGS as readonly string[]).includes(lang)

/** Tiempo máximo para la primera parte de la respuesta: si tarda más, se muestra la fija. */
export const AI_FIRST_CHUNK_MS = 2500
/** Tiempo máximo total. */
export const AI_TOTAL_MS = 9000
/** Más largo que esto suele ser divagación: se descarta y se usa la fija. */
export const AI_MAX_CHARS = 700

const LANG_NAME: Record<string, string> = { es: 'español', en: 'English', ja: '日本語' }

/** Instrucciones para la IA: tono, idioma, largo y, sobre todo, ceñirse al texto de referencia. */
export function aiSystemPrompt(lang: string): string {
  const name = LANG_NAME[lang] ?? 'English'
  return [
    'You are the assistant of DocuSmart, an app and website for documents (PDF, images, QR codes, study mode).',
    `Always answer in ${name}.`,
    'Rewrite the REFERENCE ANSWER so it directly answers the user question, in a warm and natural tone, in at most 3 short sentences or a short numbered list if it has steps.',
    'Use ONLY facts from the reference answer. Do not add features, prices, links, numbers or promises that are not in it. If the reference does not answer the question, just restate the reference.',
    'Plain text only: no markdown, no headings, no emojis.',
  ].join('\n')
}

/** Mensaje del usuario para la IA: su pregunta y la respuesta de referencia de la base. */
export function aiUserPrompt(question: string, reference: string): string {
  return `USER QUESTION:\n${question.trim().slice(0, 300)}\n\nREFERENCE ANSWER:\n${reference.trim()}`
}

/**
 * Limpia lo que devuelve la IA y decide si sirve: sin markdown, sin espacios de más; null si queda
 * vacío, si es demasiado largo o si menciona enlaces o correos que no están en la referencia.
 */
export function cleanAiOutput(text: string, reference: string): string | null {
  const out = text
    .replace(/\*\*|__|`/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!out || out.length > AI_MAX_CHARS) return null
  const refs = new Set((reference.match(/\S+@\S+|https?:\/\/\S+/g) ?? []).map((s) => s.replace(/[.,;)]+$/, '')))
  const mentions = (out.match(/\S+@\S+|https?:\/\/\S+/g) ?? []).map((s) => s.replace(/[.,;)]+$/, ''))
  if (mentions.some((m) => !refs.has(m))) return null
  return out
}
