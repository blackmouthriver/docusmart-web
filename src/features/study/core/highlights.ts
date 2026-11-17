/**
 * Párrafos resaltados del Modo Estudio (W-63), como en la app: mientras se escucha se
 * marca el párrafo actual y después aparece en Notas para guardarlo como nota.
 * Se guarda el texto del párrafo: si el documento cambia, el resaltado sigue siendo legible.
 */

export type Highlight = {
  /** Documento del que sale (el mismo id de "Retomar lectura"; 'texto' para lo pegado). */
  docId: string
  docName: string
  /** Índice del párrafo en el documento y su página (0 si no es un PDF). */
  paragraph: number
  page: number
  text: string
  at: number
}

/** Máximo de resaltados guardados, para no llenar el almacenamiento del navegador. */
export const MAX_HIGHLIGHTS = 200

const same = (a: Pick<Highlight, 'docId' | 'paragraph' | 'text'>, b: Pick<Highlight, 'docId' | 'paragraph' | 'text'>) =>
  a.docId === b.docId && a.paragraph === b.paragraph && a.text === b.text

export const isHighlighted = (list: readonly Highlight[], h: Pick<Highlight, 'docId' | 'paragraph' | 'text'>) => list.some((x) => same(x, h))

/** Marca o desmarca un párrafo. Los nuevos van primero; no pasa del máximo. */
export function toggleHighlight(list: readonly Highlight[], h: Highlight, max = MAX_HIGHLIGHTS): Highlight[] {
  if (isHighlighted(list, h)) return list.filter((x) => !same(x, h))
  return [h, ...list].slice(0, max)
}

export const removeHighlight = (list: readonly Highlight[], h: Highlight) => list.filter((x) => !same(x, h))

export const removeDocHighlights = (list: readonly Highlight[], docId: string) => list.filter((x) => x.docId !== docId)

/** Agrupa por documento (el más reciente primero) y, dentro, en el orden del documento. */
export function groupByDoc(list: readonly Highlight[]): Array<{ docId: string; docName: string; items: Highlight[] }> {
  const groups = new Map<string, { docId: string; docName: string; latest: number; items: Highlight[] }>()
  for (const h of list) {
    const g = groups.get(h.docId) ?? { docId: h.docId, docName: h.docName, latest: 0, items: [] }
    g.items.push(h)
    g.latest = Math.max(g.latest, h.at)
    groups.set(h.docId, g)
  }
  return [...groups.values()]
    .sort((a, b) => b.latest - a.latest)
    .map(({ latest: _l, ...g }) => ({ ...g, items: g.items.slice().sort((a, b) => a.paragraph - b.paragraph) }))
}

/** Texto de la nota: la cita entre comillas y, debajo, de dónde sale. */
export const quoteNote = (items: readonly Pick<Highlight, 'text'>[], source: string) => `${items.map((h) => `“${h.text}”`).join('\n\n')}\n— ${source}`

/** Lista guardada a lista válida, descartando lo dañado. */
export function parseHighlights(json: string | null): Highlight[] {
  let raw: unknown
  try {
    raw = JSON.parse(json ?? '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (h): h is Highlight =>
      !!h && typeof h === 'object' && typeof h.docId === 'string' && typeof h.docName === 'string' && typeof h.text === 'string' && !!h.text && Number.isFinite(h.paragraph) && Number.isFinite(h.page) && Number.isFinite(h.at),
  )
}
