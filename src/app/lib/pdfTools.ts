/** Herramientas PDF con pdf-lib: mismas operaciones que la pestaña PDF de la app. */
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'

const load = (bytes: ArrayBuffer | Uint8Array) => PDFDocument.load(bytes, { ignoreEncryption: false })

export async function pageCount(bytes: ArrayBuffer): Promise<number> {
  return (await load(bytes)).getPageCount()
}

export async function merge(files: ArrayBuffer[]): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  for (const bytes of files) {
    const src = await load(bytes)
    const pages = await out.copyPages(src, src.getPageIndices())
    pages.forEach((p) => out.addPage(p))
  }
  return out.save()
}

/** Un PDF nuevo con solo las páginas indicadas (base 0), en ese orden. */
export async function extractPages(bytes: ArrayBuffer, indices: number[]): Promise<Uint8Array> {
  const src = await load(bytes)
  const out = await PDFDocument.create()
  const pages = await out.copyPages(src, indices)
  pages.forEach((p) => out.addPage(p))
  return out.save()
}

/** Cada página como un PDF independiente. */
export async function splitEach(bytes: ArrayBuffer): Promise<Uint8Array[]> {
  const src = await load(bytes)
  const result: Uint8Array[] = []
  for (const i of src.getPageIndices()) {
    const out = await PDFDocument.create()
    const [p] = await out.copyPages(src, [i])
    out.addPage(p)
    result.push(await out.save())
  }
  return result
}

/** Rota las páginas indicadas (base 0) sumando `angle` a su rotación actual. */
export async function rotate(bytes: ArrayBuffer, indices: number[], angle: 90 | 180 | 270): Promise<Uint8Array> {
  const doc = await load(bytes)
  for (const i of indices) {
    const page = doc.getPage(i)
    page.setRotation(degrees((page.getRotation().angle + angle) % 360))
  }
  return doc.save()
}

export async function numberPages(
  bytes: ArrayBuffer,
  opts: { position: 'bottom-center' | 'bottom-right'; format: 'n' | 'n-of-total' },
): Promise<Uint8Array> {
  const doc = await load(bytes)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const total = doc.getPageCount()
  doc.getPages().forEach((page, i) => {
    const { width } = page.getSize()
    const text = opts.format === 'n' ? String(i + 1) : `${i + 1} / ${total}`
    const size = 10
    const tw = font.widthOfTextAtSize(text, size)
    const x = opts.position === 'bottom-center' ? (width - tw) / 2 : width - tw - 36
    page.drawText(text, { x, y: 24, size, font, color: rgb(0.33, 0.33, 0.33) })
  })
  return doc.save()
}

// Las fuentes estándar de PDF solo cubren WinAnsi (latín): se descarta lo demás.
export const sanitizeWinAnsi = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, '').trim()

export async function watermark(bytes: ArrayBuffer, text: string, opacity = 0.18): Promise<Uint8Array> {
  const doc = await load(bytes)
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const clean = sanitizeWinAnsi(text) || 'DocuSmart'
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()
    const size = Math.min(width, height) / Math.max(6, clean.length * 0.62)
    const tw = font.widthOfTextAtSize(clean, size)
    const angle = Math.atan2(height, width)
    page.drawText(clean, {
      x: width / 2 - (tw / 2) * Math.cos(angle),
      y: height / 2 - (tw / 2) * Math.sin(angle),
      size,
      font,
      color: rgb(0.15, 0.39, 0.92),
      opacity,
      rotate: degrees((angle * 180) / Math.PI),
    })
  }
  return doc.save()
}
