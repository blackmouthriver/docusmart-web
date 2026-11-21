// Imágenes de prueba compartidas por varias pruebas de punta a punta.
import { Buffer } from 'node:buffer'

// 200 × 200: una "manzana" roja con tallo sobre fondo claro.
export const APPLE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACyElEQVR42u3dPVICURCFUegichHmBOSsysW4KnICcldAMsYuwLLEKhnovueLCea9OdMz/Fhul+W6kf67sgUCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAksCS2Bpbjtb8FPn/fGWlx0uJ3v1va1/IPBXSZyBtZ4nwsC6Oym8cmGtQCqcVxyslUnF8gqC9UBSgbwiYD0JqSheRZWjAmvU+Ztta+ytsNFpG3lbLKocLVhjz9M8W0WVIwdr+LmZZKuosgqwIq71GWspZ8KKwAr6mLH7usruWx1YAssFnb3GsuNWCpbAchFnr7fsslWDJbBcuNlrN7EUDyt5XLXbARNL2bCMq177YGIpGJZx1W43TCyBJbDcB8P3xMRSJCzjqunOmFgCS2AJLI8RHrNMLJlYAkuKgeUBq/UumVgCS2AJLAksgeUtYfJemVgCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLGk0rMPl5Ny03isTS2AJLIElgSWwvDFM3iUTS2AJLIHlAcIDloklE0tgSWGwPGY13RkTS6mwDK2Oe2JiCSyB5W4YvhsmlrJhGVq99sHEUjwsQ6vRDphYAit7aPVau4klsIKHVrtVl122XrAElos4e6Vlx60RLIHlgs5eXdl96wIrxdaAFZUzYS1gzT8fY66Qcgdx/GBNPjfDnhTL+ynHfI+2y3Id+Xb9vD/e8rL318/7HcPbx0vsJya7zWbyp4s38jKo3ArnnLnZXxuU73EdlVvhhNtiyA9+ImA9Ca+oH74GwXogr8Df6cfBWplX7N+rlT8spgosgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYmt7YfyAgE0tgSWAJLIElgSWwBJb0W1905uns+XOssQAAAABJRU5ErkJggg==', 'base64')

// 64 × 48 en HEIC (como las fotos del iPhone): rojo arriba a la izquierda, verde arriba a la derecha,
// azul abajo a la izquierda y amarillo abajo a la derecha. Hecha con libheif + x265.
export const HEIC_SQUARES = Buffer.from('AAAAHGZ0eXBoZWljAAAAAG1pZjFoZWljbWlhZgAAAX1tZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAABoQABAAAAAAAAARQAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABodmMxAAAAAA5waXRtAAAAAAABAAAA/WlwcnAAAADdaXBjbwAAAHZodmNDAQNwAAAAkAAAAAAAHvAA/P34+AAADwNgAAEAGEABDAH//wNwAAADAJAAAAMAAAMAHroCQGEAAQAqQgEBA3AAAAMAkAAAAwAAAwAeoCCBBZbq5Ka5uAhoMCAAAAMDIAAAAwAhYgABAAZEAcFzwIkAAAATY29scm5jbHgAAQANAAaAAAAAFGlzcGUAAAAAAAAAQAAAAEAAAAAoY2xhcAAAAEAAAAABAAAAMAAAAAEAAAAAAAAAAv////AAAAACAAAAEHBpeGkAAAAAAwgICAAAABhpcG1hAAAAAAAAAAEAAQWBAgMFhAAAARxtZGF0AAABECgBrwY4Wve238Sk///2Rz6H9VP6J0VvxpWNqr0Crffm5R//lhiO0Xbp/8zzdFdYFsrA4/sb7HzfD/+aN91US/9ux9El82STPowNtRun2TkEEqclBVFs/XP9c4//1Uj/+tyUi1hJbOd9wXP/r9P69Rr5Ae3Rr/tGfj8Er7ELz8MCcnxubkyhSTCY+GY4FzAgLa0ADDAL1nxPgWohwDDRac6p6av4BW2Wy9SeBzAM03bDCa2wcN3e3ddUmcCVtQAc7d/iw4D9nHT+kj/mSRAAHzB1YHrHEWyuInWs5EdpbAFwIhQPbj3mWdRvXgEJNNUChdrPbTJI2Z0znACY94QxN/Jc/3n9IVZnrZYYJErMezWf', 'base64')

/**
 * TIFF RGB de 8 bits sin compresión (Intel), de un solo color, para probar la apertura de TIFF
 * (W-124) sin depender de archivos externos.
 */
export function tinyTiff(width: number, height: number, [r, g, b]: [number, number, number]): Buffer {
  const pixels = width * height * 3
  const tags: Array<[number, number, number, number]> = [
    // [etiqueta, tipo (3 = SHORT, 4 = LONG), cantidad, valor o posición]
    [256, 4, 1, width], // ImageWidth
    [257, 4, 1, height], // ImageLength
    [258, 3, 3, 0], // BitsPerSample (8, 8, 8) → se escribe aparte
    [259, 3, 1, 1], // Compression: ninguna
    [262, 3, 1, 2], // PhotometricInterpretation: RGB
    [273, 4, 1, 0], // StripOffsets → se calcula
    [277, 3, 1, 3], // SamplesPerPixel
    [278, 4, 1, height], // RowsPerStrip
    [279, 4, 1, pixels], // StripByteCounts
  ]
  const ifdAt = 8
  const ifdSize = 2 + tags.length * 12 + 4
  const bpsAt = ifdAt + ifdSize
  const dataAt = bpsAt + 6
  const out = Buffer.alloc(dataAt + pixels)
  out.write('II', 0, 'latin1')
  out.writeUInt16LE(42, 2)
  out.writeUInt32LE(ifdAt, 4)
  out.writeUInt16LE(tags.length, ifdAt)
  tags.forEach(([tag, type, count, value], i) => {
    const at = ifdAt + 2 + i * 12
    out.writeUInt16LE(tag, at)
    out.writeUInt16LE(type, at + 2)
    out.writeUInt32LE(count, at + 4)
    const v = tag === 258 ? bpsAt : tag === 273 ? dataAt : value
    if (type === 3 && count === 1) out.writeUInt16LE(v, at + 8)
    else out.writeUInt32LE(v, at + 8)
  })
  out.writeUInt32LE(0, ifdAt + 2 + tags.length * 12) // sin más páginas
  for (let i = 0; i < 3; i++) out.writeUInt16LE(8, bpsAt + i * 2)
  for (let p = 0; p < width * height; p++) {
    out[dataAt + p * 3] = r
    out[dataAt + p * 3 + 1] = g
    out[dataAt + p * 3 + 2] = b
  }
  return out
}

/** Un SVG sencillo: cuadrado azul de 64 × 32 sobre fondo transparente, con un círculo rojo. */
export const SVG_LOGO = Buffer.from(
  '<?xml version="1.0" encoding="UTF-8"?>\n<!-- logo de prueba -->\n<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32"><rect x="0" y="0" width="32" height="32" fill="#1d4ed8"/><circle cx="48" cy="16" r="12" fill="#dc2626"/></svg>',
  'utf-8',
)
