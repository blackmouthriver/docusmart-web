/**
 * Lector de XML mínimo para los archivos de Office (W-114): etiquetas, atributos y texto, sin
 * DTD ni espacios de nombres resueltos (se conservan los prefijos: "p:sp", "a:t"…). Funciona
 * igual en el navegador y en las pruebas (Node no tiene DOMParser).
 */

export type XNode = { name: string; attrs: Record<string, string>; children: XNode[]; text: string }

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }
export const decodeXml = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENTITIES[e] ?? m),
  )

export function parseXml(xml: string): XNode {
  const root: XNode = { name: '#root', attrs: {}, children: [], text: '' }
  const stack: XNode[] = [root]
  const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1]
    if (m[1] !== undefined) top.text += m[1]
    else if (m[2]) {
      // Cierre: sube hasta la etiqueta que corresponde (tolera cierres sobrantes).
      const i = stack.map((n) => n.name).lastIndexOf(m[2])
      if (i > 0) stack.length = i
    } else if (m[3]) {
      const attrs: Record<string, string> = {}
      for (const a of m[4].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = decodeXml(a[2] ?? a[3] ?? '')
      const node: XNode = { name: m[3], attrs, children: [], text: '' }
      top.children.push(node)
      if (!m[5]) stack.push(node)
    } else if (m[6] !== undefined) top.text += decodeXml(m[6])
  }
  return root
}

/** Primer hijo directo con ese nombre. */
export const child = (n: XNode | undefined, name: string) => n?.children.find((c) => c.name === name)
/** Hijos directos con ese nombre. */
export const children = (n: XNode | undefined, name: string) => n?.children.filter((c) => c.name === name) ?? []
/** Sigue una ruta de hijos directos: path(sp, 'p:spPr', 'a:xfrm', 'a:off'). */
export function path(n: XNode | undefined, ...names: string[]): XNode | undefined {
  let cur = n
  for (const name of names) cur = child(cur, name)
  return cur
}
/** Primer descendiente (a cualquier profundidad) con ese nombre. */
export function find(n: XNode | undefined, name: string): XNode | undefined {
  if (!n) return undefined
  for (const c of n.children) {
    if (c.name === name) return c
    const deep = find(c, name)
    if (deep) return deep
  }
  return undefined
}
