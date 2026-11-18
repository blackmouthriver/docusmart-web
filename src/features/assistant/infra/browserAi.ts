/**
 * Conexión con la IA integrada del navegador (W-70f): la Prompt API (`LanguageModel`, Gemini Nano
 * en Chrome). Corre en el dispositivo: lo que escribe el usuario no sale del equipo. Solo se usa si
 * el modelo YA está disponible (nunca dispara una descarga) y para idiomas soportados. Cualquier
 * falla devuelve null y el panel muestra la respuesta fija de la base.
 */
import { AI_FIRST_CHUNK_MS, AI_TOTAL_MS, aiLangSupported, aiSystemPrompt, aiUserPrompt, cleanAiOutput } from '../core/localAi'

type Session = {
  promptStreaming: (input: string, opts?: { signal?: AbortSignal }) => ReadableStream<string>
  clone?: (opts?: { signal?: AbortSignal }) => Promise<Session>
  destroy?: () => void
}
type LanguageModelApi = {
  availability: (opts?: object) => Promise<string>
  create: (opts?: object) => Promise<Session>
}

export type LocalAi = {
  /** Reescribe la respuesta de referencia para la pregunta; avisa cada avance. null si no sirve. */
  rephrase: (question: string, reference: string, onText: (partial: string) => void) => Promise<string | null>
}

const languageOptions = (lang: string) => ({
  expectedInputs: [{ type: 'text', languages: [lang] }],
  expectedOutputs: [{ type: 'text', languages: [lang] }],
})

const cache = new Map<string, Promise<LocalAi | null>>()

/** La IA del navegador para un idioma, o null si no hay, no está descargada o no lo soporta. */
export function localAiFor(lang: string): Promise<LocalAi | null> {
  let p = cache.get(lang)
  if (!p) {
    p = detect(lang).catch(() => null)
    cache.set(lang, p)
  }
  return p
}

async function detect(lang: string): Promise<LocalAi | null> {
  const api = (globalThis as { LanguageModel?: LanguageModelApi }).LanguageModel
  if (!api || !aiLangSupported(lang)) return null
  if ((await api.availability(languageOptions(lang))) !== 'available') return null
  // Sesión base con las instrucciones; cada pregunta usa una copia limpia (sin arrastrar contexto).
  const base = await api.create({ ...languageOptions(lang), initialPrompts: [{ role: 'system', content: aiSystemPrompt(lang) }] })
  const fresh = async (signal: AbortSignal): Promise<Session> => (base.clone ? base.clone({ signal }) : api.create({ ...languageOptions(lang), signal, initialPrompts: [{ role: 'system', content: aiSystemPrompt(lang) }] }))

  return {
    async rephrase(question, reference, onText) {
      const ctrl = new AbortController()
      let firstChunk = false
      const firstTimer = setTimeout(() => !firstChunk && ctrl.abort(), AI_FIRST_CHUNK_MS)
      const totalTimer = setTimeout(() => ctrl.abort(), AI_TOTAL_MS)
      let session: Session | null = null
      try {
        session = await fresh(ctrl.signal)
        const reader = session.promptStreaming(aiUserPrompt(question, reference), { signal: ctrl.signal }).getReader()
        // Al vencer el tiempo, también se corta la lectura (por si la IA no respeta la señal y se queda colgada).
        ctrl.signal.addEventListener('abort', () => void reader.cancel().catch(() => {}))
        if (ctrl.signal.aborted) return null
        let text = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          firstChunk = true
          text += value
          onText(text)
        }
        return ctrl.signal.aborted ? null : cleanAiOutput(text, reference)
      } catch {
        return null
      } finally {
        clearTimeout(firstTimer)
        clearTimeout(totalTimer)
        session?.destroy?.()
      }
    },
  }
}
