/**
 * Tarjeta «Hacer / Cambiar» del asistente (W-151.5): decide cuándo un pedido se puede dejar listo en una
 * herramienta y arma las líneas que se muestran («Tamaño máximo: 2 MB»). La navegación y el traspaso de
 * opciones los hace el panel (con `setToolOptions`, sin pasar por la URL).
 */
import { TOOLS_RECEIVING_OPTIONS } from '../../../shared/files/toolOptions'
import type { OpenToolAction, OptionKey } from './actions'
import type { Index, Kb, KbEntry } from './engine'
import { parseRequest, type Lexicon } from './parser'

/** Pedido que se puede dejar listo: una herramienta que ya recibe opciones, con al menos una opción. */
export type Plan = { action: OpenToolAction; entry: KbEntry }

export function planFor(index: Index, kb: Kb & { parse?: Lexicon }, text: string): Plan | null {
  const r = parseRequest(index, kb.parse, text)
  if (!r || r.action.kind !== 'openTool') return null
  const a = r.action
  if (!TOOLS_RECEIVING_OPTIONS.has(a.tool) || !a.options || !Object.keys(a.options).length) return null
  const entry = index.byId.get(`tool:${a.tool}`)
  return entry ? { action: a, entry } : null
}

/** Opciones que se muestran en la tarjeta, en este orden, con la clave de su etiqueta en `ui`. */
const SHOWN: Array<[OptionKey, string]> = [
  ['targetSize', 'optTargetSize'],
  ['pages', 'optPages'],
  ['angle', 'optAngle'],
  ['width', 'optWidth'],
  ['height', 'optHeight'],
  ['percent', 'optPercent'],
  ['grayscale', 'optGrayscale'],
]

/** «2 MB», «1,5 MB», «500 KB», con la coma o el punto decimal del idioma. */
export function formatSize(bytes: number, lang: string): string {
  const mb = bytes / 1024 / 1024
  const n = (v: number) => new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(v)
  return mb >= 1 ? `${n(mb)} MB` : `${n(Math.round(bytes / 1024))} KB`
}

/** Líneas de la tarjeta: «Tamaño máximo: 2 MB», «Páginas: 3-5», «Giro: 90°»… */
export function planLines(action: OpenToolAction, ui: Record<string, string>, lang: string): string[] {
  const o = action.options ?? {}
  const value = (k: OptionKey): string => {
    const v = o[k]
    if (k === 'targetSize') return formatSize(Number(v), lang)
    if (k === 'angle') return `${v}°`
    if (k === 'width' || k === 'height') return `${v} px`
    if (k === 'percent') return `${v} %`
    if (k === 'grayscale') return ui.yes
    return String(v)
  }
  return SHOWN.filter(([k]) => o[k] !== undefined).map(([k, label]) => `${ui[label]}: ${value(k)}`)
}
