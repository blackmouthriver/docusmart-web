/** En las pruebas (Node, sin servidor) las fuentes de los PDF se leen de public/pdf-fonts. */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setFontLoader } from '../../src/shared/pdf/pdfFonts'

setFontLoader(async (file) => new Uint8Array(await readFile(resolve(__dirname, '../../public/pdf-fonts', file))))
