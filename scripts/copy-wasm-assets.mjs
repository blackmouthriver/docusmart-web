// Copia a public/ los recursos que las librerías descargan en tiempo de
// ejecución, para servirlos desde el propio dominio en vez de un CDN (la CSP
// solo permite 'self'). Se ejecuta antes de `dev` y `build`; las carpetas
// generadas no se versionan.
//  - public/pdfjs/: fuentes estándar, mapas de caracteres, perfiles ICC y
//    decodificadores wasm de pdf.js.
//  - public/qpdf/: qpdf compilado a wasm (comprimir, proteger, desbloquear y
//    reparar PDF).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const modules = join(root, 'node_modules')
const pub = join(root, 'public')

function fresh(dir) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  return dir
}

// ── pdf.js ──────────────────────────────────────────────────────────
const pdfjs = join(modules, 'pdfjs-dist')
const pdfjsOut = fresh(join(pub, 'pdfjs'))
for (const dir of ['standard_fonts', 'cmaps', 'iccs']) cpSync(join(pdfjs, dir), join(pdfjsOut, dir), { recursive: true })
// Sin el motor de scripts de PDF (quickjs): no se ejecuta JavaScript embebido en PDFs.
mkdirSync(join(pdfjsOut, 'wasm'))
for (const f of readdirSync(join(pdfjs, 'wasm'))) {
  if (!f.startsWith('quickjs')) cpSync(join(pdfjs, 'wasm', f), join(pdfjsOut, 'wasm', f))
}

// ── qpdf ────────────────────────────────────────────────────────────
const qpdf = join(modules, '@neslinesli93', 'qpdf-wasm')
const qpdfOut = fresh(join(pub, 'qpdf'))
cpSync(join(qpdf, 'dist', 'qpdf.wasm'), join(qpdfOut, 'qpdf.wasm'))
cpSync(join(qpdf, 'LICENSE'), join(qpdfOut, 'LICENSE.txt'))

for (const f of [join(pdfjsOut, 'standard_fonts'), join(qpdfOut, 'qpdf.wasm')]) {
  if (!existsSync(f)) throw new Error(`Falta un recurso: ${f}`)
}
console.log('Recursos wasm copiados a public/pdfjs/ y public/qpdf/')
