/**
 * Comparar PDF: diferencias de texto entre dos versiones de un documento.
 * Primero se comparan las líneas (rápido, y sirve de ancla); dentro de cada
 * bloque de líneas distintas se comparan las palabras. Así, un párrafo que solo
 * cambió de salto de línea no cuenta como cambio.
 */

export type DiffType = 'same' | 'del' | 'ins'
export type Op<T> = { type: DiffType; items: T[] }

/**
 * Diferencias mínimas entre dos secuencias (algoritmo de Myers).
 * Devuelve null si hacen falta más de `maxEdits` cambios (documentos muy distintos).
 */
export function myersDiff<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean = (x, y) => x === y, maxEdits = Infinity): Op<T>[] | null {
  let start = 0
  while (start < a.length && start < b.length && eq(a[start], b[start])) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && eq(a[endA - 1], b[endB - 1])) {
    endA--
    endB--
  }
  const A = a.slice(start, endA)
  const B = b.slice(start, endB)
  const core = diffCore(A, B, eq, maxEdits)
  if (!core) return null
  const ops: Op<T>[] = []
  const push = (type: DiffType, items: T[]) => {
    if (!items.length) return
    const last = ops[ops.length - 1]
    if (last?.type === type) last.items.push(...items)
    else ops.push({ type, items: [...items] })
  }
  push('same', a.slice(0, start))
  for (const op of core) push(op.type, op.items)
  push('same', a.slice(endA))
  return ops
}

function diffCore<T>(A: T[], B: T[], eq: (x: T, y: T) => boolean, maxEdits: number): Op<T>[] | null {
  const N = A.length
  const M = B.length
  if (!N && !M) return []
  if (!N) return [{ type: 'ins', items: B }]
  if (!M) return [{ type: 'del', items: A }]
  const max = N + M
  const off = max + 1
  const v = new Int32Array(2 * max + 3)
  // trace[d] guarda v[-d..d] al terminar el paso d (memoria proporcional a d²).
  const trace: Int32Array[] = []
  for (let d = 0; d <= max; d++) {
    if (d > maxEdits) return null
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1
      let y = x - k
      while (x < N && y < M && eq(A[x], B[y])) {
        x++
        y++
      }
      v[off + k] = x
      if (x >= N && y >= M) {
        trace.push(v.slice(off - d, off + d + 1))
        return backtrack(A, B, trace)
      }
    }
    trace.push(v.slice(off - d, off + d + 1))
  }
  /* c8 ignore next */
  return null
}

function backtrack<T>(A: T[], B: T[], trace: Int32Array[]): Op<T>[] {
  const steps: Array<{ type: DiffType; item: T }> = []
  let x = A.length
  let y = B.length
  for (let d = trace.length - 1; d > 0; d--) {
    const prev = trace[d - 1]
    const at = (k: number) => prev[k + d - 1]
    const k = x - y
    const prevK = k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1
    const prevX = at(prevK)
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      x--
      y--
      steps.push({ type: 'same', item: A[x] })
    }
    if (prevK === k + 1) steps.push({ type: 'ins', item: B[prevY] })
    else steps.push({ type: 'del', item: A[prevX] })
    x = prevX
    y = prevY
  }
  while (x > 0 && y > 0) {
    x--
    y--
    steps.push({ type: 'same', item: A[x] })
  }
  const ops: Op<T>[] = []
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]
    const last = ops[ops.length - 1]
    if (last?.type === s.type) last.items.push(s.item)
    else ops.push({ type: s.type, items: [s.item] })
  }
  return ops
}

/* ───────────── Comparar documentos ───────────── */

/** Una línea de texto y la página (base 1) donde está. */
export type Line = { text: string; page: number }
export type Segment = { type: DiffType; text: string }
export type Hunk = {
  pageA: number
  pageB: number
  before: string[]
  segments: Segment[]
  after: string[]
}
export type Comparison = {
  identical: boolean
  hunks: Hunk[]
  added: number
  removed: number
  /** Demasiados cambios para compararlos en detalle. */
  tooDifferent: boolean
}

export const normalizeLine = (s: string) => s.replace(/\s+/g, ' ').trim()
const words = (lines: Line[]) => lines.flatMap((l) => l.text.split(' ')).filter(Boolean)

/** Diferencia palabra por palabra entre dos bloques de líneas. */
function wordSegments(del: Line[], ins: Line[]): Segment[] {
  const a = words(del)
  const b = words(ins)
  const ops = myersDiff(a, b, undefined, 4000) ?? [
    { type: 'del' as const, items: a },
    { type: 'ins' as const, items: b },
  ]
  return ops.filter((o) => o.items.length).map((o) => ({ type: o.type, text: o.items.join(' ') }))
}

export function compareTexts(linesA: Line[], linesB: Line[], context = 2): Comparison {
  const clean = (ls: Line[]) => ls.map((l) => ({ ...l, text: normalizeLine(l.text) })).filter((l) => l.text)
  const A = clean(linesA)
  const B = clean(linesB)
  const ops = myersDiff(A, B, (x, y) => x.text === y.text, 6000)
  if (!ops) return { identical: false, hunks: [], added: words(B).length, removed: words(A).length, tooDifferent: true }

  const hunks: Hunk[] = []
  let added = 0
  let removed = 0
  let posA = 0
  let posB = 0
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    if (op.type === 'same') {
      posA += op.items.length
      posB += op.items.length
      continue
    }
    // Un bloque de cambios: borrados y agregados seguidos.
    const del: Line[] = []
    const ins: Line[] = []
    let j = i
    for (; j < ops.length && ops[j].type !== 'same'; j++) (ops[j].type === 'del' ? del : ins).push(...ops[j].items)
    const segments = wordSegments(del, ins)
    const startA = posA
    const startB = posB
    posA += del.length
    posB += ins.length
    i = j - 1
    // Mismas palabras con otros saltos de línea: no es un cambio.
    if (segments.every((s) => s.type === 'same')) continue
    for (const s of segments) {
      const n = s.text.split(' ').length
      if (s.type === 'ins') added += n
      else if (s.type === 'del') removed += n
    }
    hunks.push({
      pageA: (del[0] ?? A[startA - 1] ?? A[startA])?.page ?? 1,
      pageB: (ins[0] ?? B[startB - 1] ?? B[startB])?.page ?? 1,
      before: A.slice(Math.max(0, startA - context), startA).map((l) => l.text),
      segments,
      after: A.slice(posA, posA + context).map((l) => l.text),
    })
  }
  return { identical: hunks.length === 0, hunks, added, removed, tooDifferent: false }
}

/** Informe en texto plano: "-" lo que se quitó y "+" lo que se agregó. */
export function reportText(c: Comparison, nameA: string, nameB: string): string {
  const out = [`Comparación de "${nameA}" (original) con "${nameB}" (nueva versión)`, '']
  if (c.tooDifferent) out.push('Los documentos son demasiado distintos para compararlos en detalle.')
  else if (c.identical) out.push('El texto de los dos documentos es igual.')
  else {
    out.push(`${c.hunks.length} ${c.hunks.length === 1 ? 'cambio' : 'cambios'}: ${c.added} palabras agregadas y ${c.removed} quitadas.`)
    c.hunks.forEach((h, i) => {
      out.push('', `── Cambio ${i + 1} · página ${h.pageA} del original, ${h.pageB} de la nueva versión`)
      for (const s of h.segments) if (s.type !== 'same') out.push(`${s.type === 'del' ? '-' : '+'} ${s.text}`)
    })
  }
  return out.join('\n') + '\n'
}
