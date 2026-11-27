// Tipos mínimos de fontkit 3 (MIT), que no trae los suyos: solo lo que usan las fuentes de los PDF.
declare module 'fontkit' {
  export interface FontkitSubset {
    includeGlyph(glyph: unknown): number
    encode(): Uint8Array
  }
  export interface FontkitFont {
    hasGlyphForCodePoint(codePoint: number): boolean
    createSubset(): FontkitSubset
  }
  export function create(data: Uint8Array): FontkitFont
}
