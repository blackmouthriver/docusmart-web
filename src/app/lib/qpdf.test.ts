import { afterEach, describe, expect, it, vi } from 'vitest'

// Módulo de Emscripten simulado: permite provocar los caminos de error de runQpdf.
type Fake = { callMain: (args: string[]) => number; readFile: (p: string) => Uint8Array }
let fake: Fake

vi.mock('@neslinesli93/qpdf-wasm', () => ({
  default: async (opts: { print: (s: string) => void; printErr: (s: string) => void }) => {
    opts.print('salida normal')
    opts.printErr('aviso')
    return {
      callMain: (args: string[]) => fake.callMain(args),
      FS: { writeFile: vi.fn(), readFile: (p: string) => fake.readFile(p) },
    }
  },
}))

const load = () => import('./qpdf')

afterEach(() => vi.resetModules())

describe('runQpdf', () => {
  it('reemplaza {in} y {out}, devuelve la salida y los mensajes', async () => {
    const seen: string[][] = []
    fake = { callMain: (a) => (seen.push(a), 0), readFile: () => new Uint8Array([1, 2]) }
    const { runQpdf, QPDF_OK } = await load()
    const r = await runQpdf(['{in}', '--x', '{out}'], new Uint8Array([9]), 'r.pdf')
    expect(seen[0]).toEqual(['/in.pdf', '--x', '/r.pdf'])
    expect(r).toEqual({ code: QPDF_OK, output: new Uint8Array([1, 2]), messages: ['salida normal', 'aviso'] })
  })

  it('toma el código de salida cuando Emscripten lanza ExitStatus', async () => {
    fake = {
      callMain: () => {
        throw { name: 'ExitStatus', status: 3 }
      },
      readFile: () => new Uint8Array([7]),
    }
    const { runQpdf, QPDF_WARNINGS } = await load()
    const r = await runQpdf(['{in}', '{out}'], new Uint8Array())
    expect(r.code).toBe(QPDF_WARNINGS)
    expect(r.output).toEqual(new Uint8Array([7]))
  })

  it('relanza errores que no son una salida del programa', async () => {
    fake = {
      callMain: () => {
        throw new Error('wasm roto')
      },
      readFile: () => new Uint8Array(),
    }
    const { runQpdf } = await load()
    await expect(runQpdf(['{in}'], new Uint8Array())).rejects.toThrow('wasm roto')
  })

  it('sin archivo de salida devuelve output null', async () => {
    fake = {
      callMain: () => 0,
      readFile: () => {
        throw new Error('ENOENT')
      },
    }
    const { runQpdf } = await load()
    expect((await runQpdf(['--check', '{in}'], new Uint8Array())).output).toBeNull()
  })

  it('con error no intenta leer la salida', async () => {
    const readFile = vi.fn(() => new Uint8Array())
    fake = { callMain: () => 2, readFile }
    const { runQpdf, QPDF_ERROR } = await load()
    const r = await runQpdf(['{in}', '{out}'], new Uint8Array())
    expect(r.code).toBe(QPDF_ERROR)
    expect(r.output).toBeNull()
    expect(readFile).not.toHaveBeenCalled()
  })
})
