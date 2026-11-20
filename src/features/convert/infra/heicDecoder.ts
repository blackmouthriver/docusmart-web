// Decodifica fotos HEIC (W-107). Safari ya las abre por sí mismo; en los demás navegadores se usa
// libheif compilado a wasm (LGPL-3.0, servido sin modificar desde /heic/ con su licencia).
// Excluido de la cobertura como los demás adaptadores que usan wasm, red y canvas.
import { fileToCanvas } from '../core/convert'
import { isHeic } from '../core/heic'
import { tr } from '../../../shared/i18n/translate'

type HeifImage = {
  get_width(): number
  get_height(): number
  is_primary(): boolean
  display(target: ImageData, done: (result: ImageData | null) => void): void
  free(): void
}
type HeifDecoder = { decoder: unknown; decode(data: Uint8Array): HeifImage[] }
type LibHeif = { HeifDecoder: new () => HeifDecoder; heif_context_free(ctx: unknown): void }

const WASM_URL = '/heic/libheif.wasm'

let lib: Promise<LibHeif> | null = null
function loadLib(): Promise<LibHeif> {
  lib ??= (async () => {
    const [mod, wasm] = await Promise.all([
      import('libheif-js/libheif-wasm/libheif.js') as Promise<unknown>,
      fetch(WASM_URL).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.arrayBuffer()
      }),
    ])
    const factory = ((mod as { default?: unknown }).default ?? mod) as (o: { wasmBinary: ArrayBuffer }) => LibHeif | Promise<LibHeif>
    return await factory({ wasmBinary: wasm })
  })().catch((e: unknown) => {
    // Sin conexión la primera vez: el próximo intento vuelve a descargarlo.
    lib = null
    throw e
  })
  return lib
}

export class HeicError extends Error {
  constructor() {
    super(tr('conv.heicBad'))
    this.name = 'HeicError'
  }
}

/** La foto HEIC dibujada en un canvas, ya derecha (libheif aplica el giro guardado en el archivo). */
export async function heicToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!isHeic(bytes.subarray(0, 64))) throw new HeicError()
  // Safari (y cualquier navegador que ya entienda HEIC) la abre sin descargar nada.
  try {
    return await fileToCanvas(file)
  } catch {
    // El navegador no la entiende: se usa libheif.
  }
  const heif = await loadLib()
  const decoder = new heif.HeifDecoder()
  let images: HeifImage[] = []
  try {
    images = decoder.decode(bytes)
    const image = images.find((i) => i.is_primary()) ?? images[0]
    if (!image) throw new HeicError()
    const canvas = document.createElement('canvas')
    canvas.width = image.get_width()
    canvas.height = image.get_height()
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas no disponible')
    const pixels = ctx.createImageData(canvas.width, canvas.height)
    await new Promise<void>((resolve, reject) => image.display(pixels, (r) => (r ? resolve() : reject(new HeicError()))))
    ctx.putImageData(pixels, 0, 0)
    return canvas
  } finally {
    for (const i of images) i.free()
    if (decoder.decoder) heif.heif_context_free(decoder.decoder)
  }
}
