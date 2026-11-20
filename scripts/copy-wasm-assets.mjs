// Copia a public/ los recursos que las librerías descargan en tiempo de
// ejecución, para servirlos desde el propio dominio en vez de un CDN (la CSP
// solo permite 'self'). Se ejecuta antes de `dev` y `build`; las carpetas
// generadas no se versionan.
//  - public/pdfjs/: fuentes estándar, mapas de caracteres, perfiles ICC y
//    decodificadores wasm de pdf.js.
//  - public/qpdf/: qpdf compilado a wasm (comprimir, proteger, desbloquear y
//    reparar PDF).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
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

// ── 7-Zip ───────────────────────────────────────────────────────────
// LGPL + restricción unRAR: se distribuye sin modificar y con su licencia.
const sevenZip = join(modules, '7z-wasm')
const sevenZipOut = fresh(join(pub, '7z'))
cpSync(join(sevenZip, '7zz.wasm'), join(sevenZipOut, '7zz.wasm'))
cpSync(join(sevenZip, 'License.txt'), join(sevenZipOut, 'License.txt'))

// ── Tesseract (OCR) ────────────────────────────────────────────────
// public/ocr-worker.js (versionado) instala la política de Trusted Types y carga
// este worker. Solo las variantes LSTM del motor (las que usa el OCR moderno) y
// los modelos compactos "best_int" de español e inglés (~2 MB cada uno).
const ocrOut = fresh(join(pub, 'ocr'))
cpSync(join(modules, 'tesseract.js', 'dist', 'worker.min.js'), join(ocrOut, 'tesseract-worker.min.js'))
cpSync(join(modules, 'tesseract.js', 'LICENSE.md'), join(ocrOut, 'LICENSE-tesseract.js.txt'))
mkdirSync(join(ocrOut, 'core'))
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) {
  cpSync(join(modules, 'tesseract.js-core', f), join(ocrOut, 'core', f))
}
cpSync(join(modules, 'tesseract.js-core', 'LICENSE'), join(ocrOut, 'LICENSE-tesseract-core.txt'))
mkdirSync(join(ocrOut, 'lang'))
for (const lang of ['spa', 'eng']) {
  cpSync(join(modules, '@tesseract.js-data', lang, '4.0.0_best_int', `${lang}.traineddata.gz`), join(ocrOut, 'lang', `${lang}.traineddata.gz`))
}

// ── onnxruntime-web (Quitar fondo, W-121) ──────────────────────────
// Solo el motor wasm sin hilos extra ni WebGPU: el modelo (public/models/isnet/) se carga aparte.
const ort = join(modules, 'onnxruntime-web')
const ortOut = fresh(join(pub, 'ort'))
for (const f of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) cpSync(join(ort, 'dist', f), join(ortOut, f))
// El paquete no trae el archivo LICENSE (su package.json declara MIT): se escribe el aviso.
writeFileSync(
  join(ortOut, 'LICENSE.txt'),
  `onnxruntime-web - MIT License

Copyright (c) Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
`,
)

for (const f of [
  join(ortOut, 'ort-wasm-simd-threaded.wasm'),
  join(pdfjsOut, 'standard_fonts'),
  join(qpdfOut, 'qpdf.wasm'),
  join(sevenZipOut, '7zz.wasm'),
  join(ocrOut, 'core', 'tesseract-core-lstm.wasm.js'),
  join(ocrOut, 'lang', 'spa.traineddata.gz'),
]) {
  if (!existsSync(f)) throw new Error(`Falta un recurso: ${f}`)
}
console.log('Recursos wasm copiados a public/pdfjs/, public/qpdf/, public/7z/, public/ocr/ y public/ort/')
