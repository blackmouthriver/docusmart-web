/** Una línea de texto de una página de PDF: su texto, su altura en la página (y) y la altura de la letra (h). */
export type TextLine = { text: string; y: number; h: number }

/**
 * Une las líneas de una página. Donde hay un espacio vertical claramente mayor que el
 * interlineado (un párrafo o un título nuevo) deja una línea en blanco, para que el
 * lector por párrafos los separe aunque el párrafo anterior termine al borde de la línea.
 */
export function linesToText(lines: readonly TextLine[]): string {
  const out: string[] = []
  lines.forEach((line, i) => {
    const prev = lines[i - 1]
    if (prev && line.text.trim() && prev.text.trim()) {
      const gap = prev.y - line.y
      if (gap > Math.max(prev.h, line.h, 1) * 1.9) out.push('')
    }
    out.push(line.text)
  })
  return out.join('\n').trim()
}
