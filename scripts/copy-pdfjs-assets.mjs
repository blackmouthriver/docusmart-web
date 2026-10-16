// Copia a public/pdfjs/ los recursos que pdf.js descarga en tiempo de ejecución
// (fuentes estándar, mapas de caracteres, perfiles ICC y decodificadores wasm),
// para servirlos desde el propio dominio en vez de un CDN. Se ejecuta antes de
// `dev` y `build`; la carpeta generada no se versiona.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const src = join(import.meta.dirname, '..', 'node_modules', 'pdfjs-dist')
const out = join(import.meta.dirname, '..', 'public', 'pdfjs')

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
for (const dir of ['standard_fonts', 'cmaps', 'iccs']) cpSync(join(src, dir), join(out, dir), { recursive: true })

// Sin el motor de scripts de PDF (quickjs): no se ejecuta JavaScript embebido en PDFs.
mkdirSync(join(out, 'wasm'))
for (const f of readdirSync(join(src, 'wasm'))) {
  if (!f.startsWith('quickjs')) cpSync(join(src, 'wasm', f), join(out, 'wasm', f))
}
if (!existsSync(join(out, 'standard_fonts'))) throw new Error('No se copiaron los recursos de pdf.js')
console.log('pdf.js: recursos copiados a public/pdfjs/')
