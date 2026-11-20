import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HEIC_SQUARES } from '../../../../e2e/fixtures'

// Canvas de mentira: registra lo que se dibuja (las pruebas corren en Node, sin canvas real).
type FakeCtx = { calls: string[]; fillStyle: string; globalCompositeOperation: string; fillRect: () => void; drawImage: () => void }
function fakeCanvas() {
  const ctx: FakeCtx = {
    calls: [],
    fillStyle: '',
    globalCompositeOperation: 'source-over',
    fillRect() {
      ctx.calls.push(`fill ${ctx.fillStyle} ${ctx.globalCompositeOperation}`)
    },
    drawImage() {
      ctx.calls.push('draw')
    },
  }
  return { width: 0, height: 0, ctx, getContext: () => ctx }
}

const heicPhoto = fakeCanvas()
const heicToCanvas = vi.fn(async () => {
  heicPhoto.width = 64
  heicPhoto.height = 48
  return heicPhoto
})
vi.mock('../../../../../src/features/convert/infra/heicDecoder', () => ({ heicToCanvas }))

const { openImage } = await import('../../../../../src/features/convert/core/convert')

const JPEG = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1])], { type: 'image/jpeg' })
const HEIC = new Blob([new Uint8Array(HEIC_SQUARES)], { type: 'image/heic' })

describe('openImage (abre también fotos HEIC)', () => {
  let made: ReturnType<typeof fakeCanvas>[]
  beforeEach(() => {
    made = []
    heicPhoto.ctx.calls = []
    heicPhoto.ctx.globalCompositeOperation = 'source-over'
    heicToCanvas.mockClear()
    vi.stubGlobal('document', {
      createElement: () => {
        const c = fakeCanvas()
        made.push(c)
        return c
      },
    })
    // El navegador abre JPG pero no HEIC (como Chrome, Edge o Firefox).
    vi.stubGlobal('createImageBitmap', async (b: Blob) => {
      if (b.type === 'image/heic') throw new DOMException('The source image could not be decoded.', 'InvalidStateError')
      return { width: 10, height: 8, close: () => undefined }
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('una imagen que el navegador abre no carga el decodificador de HEIC', async () => {
    const canvas = (await openImage(JPEG, '#ffffff')) as unknown as ReturnType<typeof fakeCanvas>
    expect(heicToCanvas).not.toHaveBeenCalled()
    expect([canvas.width, canvas.height]).toEqual([10, 8])
    expect(canvas.ctx.calls).toEqual(['fill #ffffff source-over', 'draw'])
  })

  it('una foto HEIC se abre con libheif y, si se pide, con fondo debajo', async () => {
    const canvas = await openImage(HEIC, '#ffffff')
    expect(heicToCanvas).toHaveBeenCalledWith(HEIC)
    expect(canvas).toBe(heicPhoto)
    expect(heicPhoto.ctx.calls).toEqual(['fill #ffffff destination-over'])
  })

  it('sin fondo, la foto HEIC queda tal cual', async () => {
    expect(await openImage(HEIC)).toBe(heicPhoto)
    expect(heicPhoto.ctx.calls).toEqual([])
  })

  it('un archivo dañado que no es HEIC conserva su error', async () => {
    const broken = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/heic' })
    await expect(openImage(broken)).rejects.toThrow('could not be decoded')
    expect(heicToCanvas).not.toHaveBeenCalled()
  })
})
