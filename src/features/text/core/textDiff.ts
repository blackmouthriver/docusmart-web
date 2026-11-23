/**
 * Comparar dos textos (W-113): diferencias palabra por palabra (o línea por línea) con el
 * algoritmo de Myers de Comparar PDF, conservando los espacios y saltos originales para
 * mostrar el texto completo con lo agregado y lo borrado marcado en su lugar.
 */
import { myersDiff } from '../../pdf/core/pdfCompare'

export type DiffPart = { type: 'same' | 'del' | 'ins'; text: string }
export type DiffOptions = { by: 'words' | 'lines'; ignoreCase: boolean; ignoreSpaces: boolean; ignoreAccents?: boolean }
export type TextDiff = {
  parts: DiffPart[]
  identical: boolean
  /** Palabras agregadas y borradas. */
  added: number
  removed: number
  /** Parecido en porcentaje (palabras en común sobre el total). */
  similarity: number
  /** Demasiados cambios para compararlos en detalle: se muestran los dos textos enteros. */
  tooDifferent: boolean
}

export const DEFAULT_DIFF: DiffOptions = { by: 'words', ignoreCase: false, ignoreSpaces: false, ignoreAccents: false }
// La traza de Myers ocupa ~d² enteros; más cambios que esto no se marcan en detalle.
const MAX_WORD_EDITS = 4000
const MAX_LINE_EDITS = 3000

// Espacios, palabras (con apóstrofos o guiones internos) y cada signo por separado: así
// "duerme." y "duerme" comparten la palabra y solo cambia el punto.
const WORD_TOKENS = /\s+|[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu
const tokenize = (text: string, by: DiffOptions['by']) => (by === 'words' ? (text.match(WORD_TOKENS) ?? []) : text.split(/(?<=\n)/).filter(Boolean))

function keyOf(token: string, o: DiffOptions): string {
  let k = token
  if (o.by === 'words') {
    if (/^\s+$/.test(k)) return o.ignoreSpaces ? ' ' : k
  } else {
    k = k.replace(/\r?\n$/, '')
    if (o.ignoreSpaces) k = k.replace(/\s+/g, ' ').trim()
  }
  // "Canción" = "Cancion": se quitan las tildes y diéresis (no la ñ, que es otra letra).
  if (o.ignoreAccents) k = k.normalize('NFD').replace(/(?<!n)[\u0300-\u036f]|(?<=n)[\u0300-\u0302\u0304-\u036f]/gi, '').normalize('NFC')
  return o.ignoreCase ? k.toLocaleLowerCase() : k
}

const countWords = (text: string) => text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0

function run(a: string, b: string, o: DiffOptions): DiffPart[] | null {
  const A = tokenize(a, o.by)
  const B = tokenize(b, o.by)
  const ka = A.map((t) => keyOf(t, o))
  const kb = B.map((t) => keyOf(t, o))
  const idx = (n: number) => Array.from({ length: n }, (_, i) => i)
  const ops = myersDiff(idx(A.length), idx(B.length), (i, j) => ka[i] === kb[j], o.by === 'words' ? MAX_WORD_EDITS : MAX_LINE_EDITS)
  if (!ops) return null
  // En "same" vienen los índices del texto A; en "ins", los de B.
  return ops.map((op) => ({ type: op.type, text: op.items.map((i) => (op.type === 'ins' ? B[i] : A[i])).join('') }))
}

export function diffTexts(a: string, b: string, o: DiffOptions = DEFAULT_DIFF): TextDiff {
  let parts = run(a, b, o)
  // Demasiados cambios palabra por palabra: se prueba línea por línea.
  if (!parts && o.by === 'words') parts = run(a, b, { ...o, by: 'lines' })
  const tooDifferent = !parts
  if (!parts) parts = [{ type: 'del', text: a }, { type: 'ins', text: b }].filter((p) => p.text) as DiffPart[]
  // Lo que solo difiere en espacios (si se ignoran) no cuenta como cambio.
  const merged: DiffPart[] = []
  for (const p of parts) {
    const last = merged[merged.length - 1]
    if (last?.type === p.type) last.text += p.text
    else if (p.text) merged.push({ ...p })
  }
  const added = merged.filter((p) => p.type === 'ins').reduce((n, p) => n + countWords(p.text), 0)
  const removed = merged.filter((p) => p.type === 'del').reduce((n, p) => n + countWords(p.text), 0)
  const same = merged.filter((p) => p.type === 'same').reduce((n, p) => n + countWords(p.text), 0)
  const total = countWords(a) + countWords(b)
  const changed = merged.some((p) => p.type !== 'same' && (/\S/.test(p.text) || !o.ignoreSpaces))
  return {
    parts: merged,
    identical: !changed,
    added,
    removed,
    // Con algún cambio, nunca 100 % (el redondeo lo decía con 60 cambios en 30 000 palabras).
    similarity: total ? Math.min(Math.round(((same * 2) / total) * 100), changed ? 99 : 100) : 100,
    tooDifferent,
  }
}

/** Informe en texto plano: [-borrado-] y {+agregado+}, como las herramientas de diferencias. */
export function diffReport(d: TextDiff): string {
  return d.parts.map((p) => (p.type === 'del' ? `[-${p.text}-]` : p.type === 'ins' ? `{+${p.text}+}` : p.text)).join('')
}

/**
 * Diferencias por letra (auditoría W-146.12): una palabra borrada seguida de su reemplazo
 * ("contrato" → "contratos") se muestra con lo común sin marcar y solo la letra que cambió.
 * Es solo para mostrar: los conteos de palabras no cambian.
 */
export function refineParts(parts: readonly DiffPart[]): DiffPart[] {
  const out: DiffPart[] = []
  const push = (type: DiffPart['type'], text: string) => {
    if (text) out.push({ type, text })
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    const q = parts[i + 1]
    // La primera palabra de cada lado ("ano" y "anos.\nSe permite…" → "ano" y "anos").
    const da = p.type === 'del' && q?.type === 'ins' ? LEAD_WORD.exec(p.text)?.[0] : undefined
    const db = da ? LEAD_WORD.exec(q.text)?.[0] : undefined
    if (da && db) {
      const a = Array.from(da)
      const b = Array.from(db)
      let pre = 0
      while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++
      let suf = 0
      while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++
      // Solo si comparten una parte apreciable; si no, se ve mejor la palabra entera.
      if (pre + suf >= Math.ceil(Math.min(a.length, b.length) / 2)) {
        push('same', a.slice(0, pre).join(''))
        push('del', a.slice(pre, a.length - suf).join(''))
        push('ins', b.slice(pre, b.length - suf).join(''))
        push('same', a.slice(a.length - suf).join(''))
        push('del', p.text.slice(da.length))
        push('ins', q.text.slice(db.length))
        i++
        continue
      }
    }
    out.push(p)
  }
  return out
}
const LEAD_WORD = /^[\p{L}\p{N}'’\-]+/u

export type SideCell = { n: number; parts: DiffPart[] }
export type SideRow = { left: SideCell | null; right: SideCell | null; changed: boolean }

/**
 * Vista lado a lado (auditoría W-146.12, como Diffchecker): filas alineadas por línea, con el
 * número de cada una. Una línea cambiada se empareja con su reemplazo y dentro se marcan las
 * palabras y letras que cambiaron; las líneas solo borradas o solo agregadas quedan frente a
 * una celda vacía.
 */
export function sideBySide(a: string, b: string, o: DiffOptions = DEFAULT_DIFF): SideRow[] {
  const lineOpts: DiffOptions = { ...o, by: 'lines' }
  const d = diffTexts(a, b, lineOpts)
  const linesOf = (t: string) => t.replace(/\r?\n$/, '').split(/\r?\n/)
  const rows: SideRow[] = []
  let nl = 0
  let nr = 0
  const cell = (side: 'l' | 'r', parts: DiffPart[]): SideCell => ({ n: side === 'l' ? ++nl : ++nr, parts })
  for (let i = 0; i < d.parts.length; i++) {
    const p = d.parts[i]
    if (p.type === 'same') {
      for (const line of linesOf(p.text)) rows.push({ left: cell('l', [{ type: 'same', text: line }]), right: cell('r', [{ type: 'same', text: line }]), changed: false })
      continue
    }
    const dels = p.type === 'del' ? linesOf(p.text) : []
    const next = d.parts[i + 1]
    const ins = p.type === 'ins' ? linesOf(p.text) : next?.type === 'ins' ? linesOf(next.text) : []
    if (p.type === 'del' && next?.type === 'ins') i++
    for (let k = 0; k < Math.max(dels.length, ins.length); k++) {
      const l = dels[k]
      const r = ins[k]
      if (l !== undefined && r !== undefined) {
        const parts = refineParts(diffTexts(l, r, { ...o, by: 'words' }).parts)
        rows.push({ left: cell('l', parts.filter((x) => x.type !== 'ins')), right: cell('r', parts.filter((x) => x.type !== 'del')), changed: true })
      } else if (l !== undefined) rows.push({ left: cell('l', [{ type: 'del', text: l }]), right: null, changed: true })
      else rows.push({ left: null, right: cell('r', [{ type: 'ins', text: r }]), changed: true })
    }
  }
  return rows
}
