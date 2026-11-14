/**
 * qpdf compilado a WebAssembly (https://qpdf.sourceforge.io), todo en el navegador.
 * El .wasm se sirve desde /qpdf/ (scripts/copy-wasm-assets.mjs).
 *
 * Cada operación usa una instancia nueva: un programa de Emscripten no puede
 * ejecutar `main` dos veces. El navegador guarda el .wasm compilado en caché,
 * así que crear la instancia es barato tras la primera vez.
 */

/** Lo que usamos del módulo de Emscripten (los tipos del paquete están incompletos). */
interface QpdfInstance {
  callMain: (args: string[]) => number
  FS: {
    writeFile: (path: string, data: Uint8Array) => void
    readFile: (path: string) => Uint8Array
  }
}

type CreateModule = (opts: {
  locateFile: () => string
  noInitialRun: boolean
  print?: (s: string) => void
  printErr?: (s: string) => void
}) => Promise<QpdfInstance>

/** Códigos de salida de qpdf: 0 bien, 2 error, 3 terminó con advertencias (hay salida). */
export const QPDF_OK = 0
export const QPDF_ERROR = 2
export const QPDF_WARNINGS = 3

export type QpdfResult = { code: number; output: Uint8Array | null; messages: string[] }

let wasmUrl = '/qpdf/qpdf.wasm'
/** Solo para pruebas en Node: ruta del .wasm en node_modules. */
export function setQpdfWasmUrl(url: string) {
  wasmUrl = url
}

export async function runQpdf(args: string[], input: Uint8Array, outName = 'out.pdf'): Promise<QpdfResult> {
  const { default: createModule } = (await import('@neslinesli93/qpdf-wasm')) as unknown as { default: CreateModule }
  const messages: string[] = []
  const qpdf = await createModule({
    locateFile: () => wasmUrl,
    noInitialRun: true,
    print: (s) => messages.push(s),
    printErr: (s) => messages.push(s),
  })
  qpdf.FS.writeFile('/in.pdf', input)
  let code: number
  try {
    code = qpdf.callMain(args.map((a) => (a === '{in}' ? '/in.pdf' : a === '{out}' ? `/${outName}` : a)))
  } catch (e) {
    // Emscripten lanza ExitStatus cuando el programa llama a exit().
    const status = (e as { status?: number })?.status
    if (typeof status !== 'number') throw e
    code = status
  }
  let output: Uint8Array | null = null
  if (code === QPDF_OK || code === QPDF_WARNINGS) {
    try {
      output = qpdf.FS.readFile(`/${outName}`)
    } catch {
      output = null
    }
  }
  return { code, output, messages }
}
