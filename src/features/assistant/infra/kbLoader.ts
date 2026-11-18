/**
 * Carga la base de conocimiento del asistente (W-70c): el JSON estático del idioma
 * (public/assistant/<idioma>.json), solo al abrir el chat, una vez por idioma.
 */
import { buildIndex, type Index, type Kb } from '../core/engine'
import { kbLangFor } from '../core/reply'

const cache = new Map<string, Promise<{ kb: Kb; index: Index }>>()

export function loadKb(lang: string): Promise<{ kb: Kb; index: Index }> {
  const kbLang = kbLangFor(lang)
  let p = cache.get(kbLang)
  if (!p) {
    p = fetch(`/assistant/${kbLang}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`assistant ${kbLang}: ${r.status}`)
        return r.json() as Promise<Kb>
      })
      .then((kb) => ({ kb, index: buildIndex(kb) }))
    // Si falla (sin conexión), se reintenta la próxima vez.
    p.catch(() => cache.delete(kbLang))
    cache.set(kbLang, p)
  }
  return p
}
