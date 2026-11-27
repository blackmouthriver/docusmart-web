// Tipos de tools/guide-images.mjs (capturas dentro de las guías, W-100).
export interface GuideImage {
  section: number
  after: number
  shot: string
  alt: Record<string, string>
  /** Es la captura que se usa al compartir la guía (W-102). */
  og?: boolean
}

export const GUIDE_IMAGES: Record<string, GuideImage[]>

export function ogShot(slug: string): string | undefined
