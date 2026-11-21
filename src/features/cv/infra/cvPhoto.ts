// Foto de la hoja de vida (W-131): recorte 3 × 4 en el centro (un poco más arriba, donde suele estar
// la cara), a 600 × 800 px y en PNG (lo piden el PDF y el Word). Abre también HEIC, SVG y TIFF.
// Excluido de la cobertura como los demás archivos con canvas.
import { canvasToBlob } from '../../../shared/pdf/pdf'
import { portraitCrop } from '../../image/core/idPhoto'
import { cropPixels } from '../../image/core/imageTools'
import { loadImage } from '../../image/infra/imageCanvas'
import type { CvPhoto } from '../core/cv'

export async function preparePhoto(file: Blob): Promise<CvPhoto & { url: string }> {
  const img = await loadImage(file)
  try {
    const crop = cropPixels(img.width, img.height, portraitCrop(img.width, img.height, 3 / 4))
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 800
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 600, 800)
    ctx.drawImage(img.bmp, crop.x, crop.y, crop.width, crop.height, 0, 0, 600, 800)
    const blob = await canvasToBlob(canvas, 'image/png')
    canvas.width = canvas.height = 0
    return { data: new Uint8Array(await blob.arrayBuffer()), width: 600, height: 800, url: URL.createObjectURL(blob) }
  } finally {
    img.bmp.close()
  }
}
