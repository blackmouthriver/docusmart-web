// Tipos de tools/guide-images.mjs (capturas dentro de las guías, W-100).
export interface GuideImage {
  section: number
  after: number
  shot: string
  alt: Record<string, string>
}

export const GUIDE_IMAGES: Record<string, GuideImage[]>
