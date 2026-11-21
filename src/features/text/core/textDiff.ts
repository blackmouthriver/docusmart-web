/**
 * Comparar dos textos (W-113): diferencias palabra por palabra (o línea por línea) con el
 * algoritmo de Myers de Comparar PDF, conservando los espacios y saltos originales para
 * mostrar el texto completo con lo agregado y lo borrado marcado en su lugar.
 */
import { myersDiff } from '../../pdf/core/pdfCompare'

export type DiffPart = { type: 'same' | 'del' | 'ins'; text: string }
export type DiffOptions = { by: 'words' | 'lines'; ignoreCase: boolean; ignoreSpaces: boolean }
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

export const DEFAULT_DIFF: DiffOptions = { by: 'words', ignoreCase: false, ignoreSpaces: false }
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
  return {
    parts: merged,
    identical: !merged.some((p) => p.type !== 'same' && (/\S/.test(p.text) || !o.ignoreSpaces)),
    added,
    removed,
    similarity: total ? Math.round(((same * 2) / total) * 100) : 100,
    tooDifferent,
  }
}

/** Informe en texto plano: [-borrado-] y {+agregado+}, como las herramientas de diferencias. */
export function diffReport(d: TextDiff): string {
  return d.parts.map((p) => (p.type === 'del' ? `[-${p.text}-]` : p.type === 'ins' ? `{+${p.text}+}` : p.text)).join('')
}
