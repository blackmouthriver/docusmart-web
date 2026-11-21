// Tipos mínimos de gifenc (MIT), que no trae los suyos: solo lo que usa Convertir a GIF (W-124).
declare module 'gifenc' {
  export type Palette = number[][]
  export type Format = 'rgb565' | 'rgb444' | 'rgba4444'
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: { format?: Format; oneBitAlpha?: boolean | number; clearAlpha?: boolean }): Palette
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: Format): Uint8Array
  export function GIFEncoder(): {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: { palette?: Palette; transparent?: boolean; transparentIndex?: number }): void
    finish(): void
    bytes(): Uint8Array
  }
}
