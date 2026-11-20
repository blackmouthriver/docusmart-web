import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  MODEL,
  MODEL_SIZE,
  applyAlpha,
  backgroundOutputName,
  joinParts,
  maskToRgba,
  parseBackground,
  toMask,
  toModelInput,
} from '../../../../../src/features/image/core/background'

describe('entrada del modelo', () => {
  it('pasa de RGBA a 3 planos, divididos por el máximo y centrados en 0', () => {
    // 2 × 2: rojo, verde, azul y gris (el máximo es 255).
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 51, 51, 51, 0])
    const x = toModelInput(rgba, 2)
    expect(x.length).toBe(12)
    expect(Array.from(x.slice(0, 4)).map((v) => +v.toFixed(2))).toEqual([0.5, -0.5, -0.5, -0.3])
    expect(Array.from(x.slice(4, 8)).map((v) => +v.toFixed(2))).toEqual([-0.5, 0.5, -0.5, -0.3])
    expect(Array.from(x.slice(8, 12)).map((v) => +v.toFixed(2))).toEqual([-0.5, -0.5, 0.5, -0.3])
  })

  it('ignora el canal alfa al buscar el máximo', () => {
    const x = toModelInput(new Uint8ClampedArray([100, 50, 0, 255]), 1)
    expect(x[0]).toBeCloseTo(0.5)
    expect(x[1]).toBeCloseTo(0)
  })

  it('rechaza un tamaño distinto', () => {
    expect(() => toModelInput(new Uint8ClampedArray(8), 2)).toThrow()
  })

  it('usa 1024 × 1024 por defecto', () => {
    expect(MODEL_SIZE).toBe(1024)
  })
})

describe('máscara', () => {
  it('normaliza la salida entre 0 y 255', () => {
    expect(Array.from(toMask(new Float32Array([2, 4, 3])))).toEqual([0, 255, 128])
  })

  it('una salida plana no divide por cero', () => {
    expect(Array.from(toMask(new Float32Array([0.7, 0.7])))).toEqual([0, 0])
  })

  it('maskToRgba pone la máscara en el alfa', () => {
    expect(Array.from(maskToRgba(new Uint8ClampedArray([0, 200])))).toEqual([255, 255, 255, 0, 255, 255, 255, 200])
  })

  it('applyAlpha combina la transparencia de la foto con la de la máscara', () => {
    const photo = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 128])
    applyAlpha(photo, new Uint8ClampedArray([0, 0, 0, 255, 0, 0, 0, 0]))
    expect(Array.from(photo)).toEqual([10, 20, 30, 255, 40, 50, 60, 0])
    const half = new Uint8ClampedArray([0, 0, 0, 200])
    applyAlpha(half, new Uint8ClampedArray([0, 0, 0, 128]))
    expect(half[3]).toBe(100)
    expect(() => applyAlpha(new Uint8ClampedArray(4), new Uint8ClampedArray(8))).toThrow()
  })
})

describe('opciones y nombres', () => {
  it('parseBackground acepta solo #rrggbb', () => {
    expect(parseBackground('#FFFFFF')).toEqual({ kind: 'color', color: '#ffffff' })
    expect(parseBackground('')).toEqual({ kind: 'transparent' })
    expect(parseBackground('red')).toEqual({ kind: 'transparent' })
    expect(parseBackground('#fff')).toEqual({ kind: 'transparent' })
  })

  it('el resultado siempre es PNG', () => {
    expect(backgroundOutputName('foto.jpg', 'sin-fondo')).toBe('foto-sin-fondo.png')
    expect(backgroundOutputName('mi.foto.webp', 'sin-fondo')).toBe('mi.foto-sin-fondo.png')
    expect(backgroundOutputName('.jpg', 'sin-fondo')).toBe('imagen-sin-fondo.png')
  })

  it('joinParts une en orden', () => {
    expect(Array.from(joinParts([new Uint8Array([1, 2]), new Uint8Array([]), new Uint8Array([3])]))).toEqual([1, 2, 3])
  })
})

describe('archivos del modelo publicados', () => {
  const dir = resolve(__dirname, '../../../../../public/models/isnet')

  it('las partes existen, pesan lo declarado y juntas dan el SHA-256 esperado', () => {
    const hash = createHash('sha256')
    let total = 0
    for (const p of MODEL.parts) {
      // Se lee una sola vez (sin consultar antes su tamaño) para no abrir una carrera.
      const data = readFileSync(resolve(dir, p.file))
      expect(data.length, p.file).toBe(p.bytes)
      hash.update(data)
      total += p.bytes
    }
    expect(total).toBe(MODEL.bytes)
    expect(hash.digest('hex')).toBe(MODEL.sha256)
  })

  it('cada parte queda por debajo del aviso de GitHub (50 MB)', () => {
    for (const p of MODEL.parts) expect(p.bytes).toBeLessThan(50 * 1024 * 1024)
  })
})
