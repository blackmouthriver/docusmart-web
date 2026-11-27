// Analizador de pedidos (W-151.4): pedidos como los escribe la gente → acción del catálogo.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AssistantAction, Options } from '../../../../src/features/assistant/core/actions'
import { buildIndex, type Kb } from '../../../../src/features/assistant/core/engine'
import { parseRequest, type Lexicon } from '../../../../src/features/assistant/core/parser'
import { REQUESTS_OTHER_1 } from './parser-otros-1'
import { REQUESTS_OTHER_2 } from './parser-otros-2'

const MB = 1024 * 1024
const KB = 1024
export type Expect = { tool: string; options?: Options; current?: boolean } | { chain: string[]; options?: Options[] } | { explain: string } | null
export type Case = [request: string, expected: Expect]

const load = (lang: string) => {
  const kb = JSON.parse(readFileSync(join(process.cwd(), 'public', 'assistant', `${lang}.json`), 'utf-8')) as Kb & { parse?: Lexicon }
  return { index: buildIndex(kb), lex: kb.parse }
}

export const REQUESTS_ES: Case[] = [
  ['comprime este pdf a menos de 2 megas', { tool: 'comprimir-pdf', options: { targetSize: 2 * MB }, current: true }],
  ['comprimir pdf a 500 kb', { tool: 'comprimir-pdf', options: { targetSize: 500 * KB } }],
  ['reduce el pdf a un mega y medio', { tool: 'comprimir-pdf' }],
  ['bajale el peso al pdf a 1,5 mb', { tool: 'comprimir-pdf', options: { targetSize: Math.round(1.5 * MB) } }],
  ['comprime el pdf en blanco y negro', { tool: 'comprimir-pdf', options: { grayscale: true } }],
  ['dejar la foto en menos de 200 kb', { tool: 'comprimir-imagen', options: { targetSize: 200 * KB } }],
  ['comprime esta foto a calidad 70', { tool: 'comprimir-imagen', options: { quality: 70 }, current: true }],
  ['comprimir imagen a webp', { tool: 'comprimir-imagen', options: { format: 'webp' } }],
  ['comprime el video a 20 megas para whatsapp', { tool: 'comprimir-video', options: { targetSize: 20 * MB } }],
  ['separa las paginas 3 a 5 del pdf', { tool: 'dividir-pdf', options: { pages: '3-5' } }],
  ['dividir el pdf, paginas 1, 3 y 7', { tool: 'dividir-pdf', options: { pages: '1, 3, 7' } }],
  ['sacar de la pagina 2 a la 4 de un pdf', { tool: 'dividir-pdf', options: { pages: '2-4' } }],
  ['quiero solo la pagina dos de este pdf', { tool: 'dividir-pdf', options: { pages: '2' }, current: true }],
  ['gira el pdf 90 grados', { tool: 'rotar-pdf', options: { angle: '90' } }],
  ['girar el pdf a la izquierda', { tool: 'rotar-pdf', options: { angle: '270' } }],
  ['el pdf quedó al revés, voltéalo', { tool: 'rotar-pdf', options: { angle: '180' } }],
  ['rota la pagina 3 del pdf a la derecha', { tool: 'rotar-pdf', options: { pages: '3', angle: '90' } }],
  ['girar esta foto 180 grados', { tool: 'rotar-imagen', options: { angle: '180' }, current: true }],
  ['pasa el pdf a jpg a 300 ppp', { tool: 'pdf-a-jpg', options: { dpi: 300 } }],
  ['convertir las paginas 1 a 3 del pdf a imagen', { tool: 'pdf-a-jpg', options: { pages: '1-3' } }],
  ['pdf a png', { tool: 'pdf-a-jpg', options: { format: 'png' } }],
  ['redimensiona la imagen a 1080 px de ancho', { tool: 'redimensionar-imagen', options: { width: 1080 } }],
  ['cambiar el tamaño de la foto a 1920x1080', { tool: 'redimensionar-imagen', options: { width: 1920, height: 1080 } }],
  ['redimensiona la imagen al 50 %', { tool: 'redimensionar-imagen', options: { percent: 50 } }],
  ['cambiar el tamaño de una foto a 600 de alto', { tool: 'redimensionar-imagen', options: { height: 600 } }],
  ['redimensionar foto a 800 pixeles', { tool: 'redimensionar-imagen', options: { width: 800 } }],
  ['reconoce el texto de este pdf escaneado en ingles', { tool: 'ocr-pdf', options: { language: 'en' }, current: true }],
  ['ocr en frances de las paginas 2 a 3', { tool: 'ocr-pdf', options: { language: 'fr', pages: '2-3' } }],
  ['pasar un audio en portugues a texto', { tool: 'audio-a-texto', options: { language: 'pt' } }],
  ['copiar el texto de una foto en aleman', { tool: 'imagen-a-texto', options: { language: 'de' } }],
  ['ponle una marca de agua que diga CONFIDENCIAL al pdf', { tool: 'marca-de-agua-pdf', options: { text: 'CONFIDENCIAL' } }],
  ['marca de agua "Borrador" abajo a la derecha en el pdf', { tool: 'marca-de-agua-pdf', options: { text: 'Borrador', position: 'bottom-right' } }],
  ['numerar las paginas del pdf abajo al centro', { tool: 'numerar-paginas-pdf', options: { position: 'bottom-center' } }],
  ['pon mi nombre como marca de agua en la foto en el centro', { tool: 'marca-de-agua-imagen', options: { position: 'center' } }],
  ['convierte las fotos heic a png', { tool: 'heic-a-jpg', options: { format: 'png' } }],
  ['pasar fotos del iphone a jpg calidad 90', { tool: 'heic-a-jpg', options: { quality: 90 } }],
  ['convertir el video a webm', { tool: 'convertir-video', options: { format: 'webm' } }],
  ['comprimir estos archivos en 7z', { tool: 'comprimir-archivos', options: { format: '7z' }, current: true }],
  ['poner la foto en blanco y negro', { tool: 'ajustar-imagen', options: { grayscale: true } }],
  ['une estos pdf', { tool: 'unir-pdf', current: true }],
  ['firmar este contrato', { tool: 'firmar-pdf', current: true }],
  ['pasar este pdf a word', { tool: 'pdf-a-word', current: true }],
  ['ponle clave a este pdf', { tool: 'proteger-pdf', current: true }],
  ['quitar el fondo de esta foto', { tool: 'quitar-fondo', current: true }],
  // Ambiguo (¿unir y después comprimir?): hoy sale Comprimir; queda como fallo conocido.
  ['une estos pdf a 2 megas', { tool: 'unir-pdf', current: true }],
  // Encadenados.
  ['une estos pdf y luego comprimelos a 1 mega', { chain: ['unir-pdf', 'comprimir-pdf'], options: [{}, { targetSize: MB }] }],
  ['escanea el documento, despues unelo y luego firmalo', { chain: ['escanear-documento', 'unir-pdf', 'firmar-pdf'] }],
  // Preguntas que no son pedidos: se responden con la base.
  ['es gratis?', { explain: 'precio' }],
  ['mis archivos se suben a internet', { explain: 'privacidad' }],
  ['que hora es', null],
]

export const REQUESTS_EN: Case[] = [
  ['compress this pdf to under 2 mb', { tool: 'comprimir-pdf', options: { targetSize: 2 * MB }, current: true }],
  ['compress a pdf to 500 kb', { tool: 'comprimir-pdf', options: { targetSize: 500 * KB } }],
  ['make the pdf smaller, 1.5 megabytes max', { tool: 'comprimir-pdf', options: { targetSize: Math.round(1.5 * MB) } }],
  ['compress the pdf in black and white', { tool: 'comprimir-pdf', options: { grayscale: true } }],
  ['get the photo under 200 kb', { tool: 'comprimir-imagen', options: { targetSize: 200 * KB } }],
  ['compress this image at quality 70', { tool: 'comprimir-imagen', options: { quality: 70 }, current: true }],
  ['compress an image to webp', { tool: 'comprimir-imagen', options: { format: 'webp' } }],
  ['compress the video to 20 mb for whatsapp', { tool: 'comprimir-video', options: { targetSize: 20 * MB } }],
  ['split pages 3 to 5 from the pdf', { tool: 'dividir-pdf', options: { pages: '3-5' } }],
  ['split the pdf, pages 1, 3 and 7', { tool: 'dividir-pdf', options: { pages: '1, 3, 7' } }],
  ['extract pages 2-4 of a pdf', { tool: 'dividir-pdf', options: { pages: '2-4' } }],
  ['i only want page two of this pdf', { tool: 'dividir-pdf', options: { pages: '2' }, current: true }],
  ['rotate the pdf 90 degrees', { tool: 'rotar-pdf', options: { angle: '90' } }],
  ['rotate the pdf to the left', { tool: 'rotar-pdf', options: { angle: '270' } }],
  ['the pdf is upside down, flip it', { tool: 'rotar-pdf', options: { angle: '180' } }],
  ['rotate page 3 of the pdf clockwise', { tool: 'rotar-pdf', options: { pages: '3', angle: '90' } }],
  ['rotate this photo 180 degrees', { tool: 'rotar-imagen', options: { angle: '180' }, current: true }],
  ['convert the pdf to jpg at 300 dpi', { tool: 'pdf-a-jpg', options: { dpi: 300 } }],
  ['turn pages 1 to 3 of the pdf into images', { tool: 'pdf-a-jpg', options: { pages: '1-3' } }],
  ['pdf to png', { tool: 'pdf-a-jpg', options: { format: 'png' } }],
  ['resize the image to 1080 px wide', { tool: 'redimensionar-imagen', options: { width: 1080 } }],
  ['resize the photo to 1920x1080', { tool: 'redimensionar-imagen', options: { width: 1920, height: 1080 } }],
  ['resize the image to 50 %', { tool: 'redimensionar-imagen', options: { percent: 50 } }],
  ['resize a photo to 600 tall', { tool: 'redimensionar-imagen', options: { height: 600 } }],
  ['resize photo to 800 pixels', { tool: 'redimensionar-imagen', options: { width: 800 } }],
  ['recognize the text of this scanned pdf in spanish', { tool: 'ocr-pdf', options: { language: 'es' }, current: true }],
  ['ocr in french for pages 2 to 3', { tool: 'ocr-pdf', options: { language: 'fr', pages: '2-3' } }],
  ['transcribe an audio in portuguese', { tool: 'audio-a-texto', options: { language: 'pt' } }],
  ['copy text from a photo in german', { tool: 'imagen-a-texto', options: { language: 'de' } }],
  ['add a watermark that says CONFIDENTIAL to the pdf', { tool: 'marca-de-agua-pdf', options: { text: 'CONFIDENTIAL' } }],
  ['watermark "Draft" bottom right on the pdf', { tool: 'marca-de-agua-pdf', options: { text: 'Draft', position: 'bottom-right' } }],
  ['number the pages of the pdf at the bottom', { tool: 'numerar-paginas-pdf', options: { position: 'bottom-center' } }],
  ['put my name as a watermark on the photo in the center', { tool: 'marca-de-agua-imagen', options: { position: 'center' } }],
  ['convert heic photos to png', { tool: 'heic-a-jpg', options: { format: 'png' } }],
  ['iphone photos to jpg at quality 90', { tool: 'heic-a-jpg', options: { quality: 90 } }],
  ['convert the video to webm', { tool: 'convertir-video', options: { format: 'webm' } }],
  ['compress these files into 7z', { tool: 'comprimir-archivos', options: { format: '7z' }, current: true }],
  ['make the photo black and white', { tool: 'ajustar-imagen', options: { grayscale: true } }],
  ['merge these pdfs', { tool: 'unir-pdf', current: true }],
  ['sign this contract', { tool: 'firmar-pdf', current: true }],
  ['turn this pdf into word', { tool: 'pdf-a-word', current: true }],
  ['password protect this pdf', { tool: 'proteger-pdf', current: true }],
  ['remove the background from this photo', { tool: 'quitar-fondo', current: true }],
  ['merge these pdfs to 2 mb', { tool: 'unir-pdf', current: true }],
  ['merge these pdfs and then compress them to 1 mb', { chain: ['unir-pdf', 'comprimir-pdf'], options: [{}, { targetSize: MB }] }],
  ['scan the document, then merge it and then sign it', { chain: ['escanear-documento', 'unir-pdf', 'firmar-pdf'] }],
  ['is it free?', { explain: 'precio' }],
  ['are my files uploaded to a server', { explain: 'privacidad' }],
  ['what time is it', null],
  ['pizza recipe', null],
]

/** Compara lo que salió con lo esperado; devuelve el motivo si no coincide. */
export function mismatch(got: { action: AssistantAction } | null, want: Expect): string | null {
  if (want === null) return got ? `no debía entender nada y salió ${JSON.stringify(got.action)}` : null
  if (!got) return 'no entendió'
  const a = got.action
  if ('explain' in want) return a.kind === 'explain' && a.entry === want.explain ? null : `esperaba explain ${want.explain}, salió ${JSON.stringify(a)}`
  if ('chain' in want) {
    if (a.kind !== 'chain') return `esperaba un encadenado, salió ${JSON.stringify(a)}`
    const tools = a.steps.map((s) => s.tool)
    if (JSON.stringify(tools) !== JSON.stringify(want.chain)) return `pasos ${tools.join(' → ')}`
    for (const [i, o] of (want.options ?? []).entries()) for (const [k, v] of Object.entries(o)) if (a.steps[i].options?.[k as keyof Options] !== v) return `paso ${i + 1}: ${k}=${a.steps[i].options?.[k as keyof Options]}`
    return null
  }
  if (a.kind !== 'openTool') return `esperaba ${want.tool}, salió ${JSON.stringify(a)}`
  if (a.tool !== want.tool) return `herramienta ${a.tool}`
  for (const [k, v] of Object.entries(want.options ?? {})) if (a.options?.[k as keyof Options] !== v) return `${k}=${JSON.stringify(a.options?.[k as keyof Options])} (esperaba ${JSON.stringify(v)})`
  if (want.current !== undefined && Boolean(a.useCurrentFile) !== want.current) return `useCurrentFile=${a.useCurrentFile}`
  return null
}

describe('analizador de pedidos (W-151.4)', () => {
  for (const [lang, cases] of [['es', REQUESTS_ES], ['en', REQUESTS_EN]] as const) {
    it(`${lang}: entiende al menos 45 de ${cases.length} pedidos`, () => {
      const { index, lex } = load(lang)
      expect(cases.length).toBeGreaterThanOrEqual(50)
      const misses = cases.map(([q, want]) => [q, mismatch(parseRequest(index, lex, q), want)] as const).filter(([, m]) => m)
      expect(cases.length - misses.length, misses.map(([q, m]) => `${q} → ${m}`).join('\n')).toBeGreaterThanOrEqual(45)
    })
  }

  // Los otros 10 idiomas: 20 pedidos cada uno, con su propio léxico.
  for (const [lang, cases] of Object.entries({ ...REQUESTS_OTHER_1, ...REQUESTS_OTHER_2 })) {
    it(`${lang}: entiende al menos 16 de ${cases.length} pedidos`, () => {
      const { index, lex } = load(lang)
      expect(lex, `${lang}: falta el léxico parse`).toBeTruthy()
      expect(cases.length).toBeGreaterThanOrEqual(20)
      const misses = cases.map(([q, want]) => [q, mismatch(parseRequest(index, lex, q), want)] as const).filter(([, m]) => m)
      expect(cases.length - misses.length, misses.map(([q, m]) => `${q} → ${m}`).join('\n')).toBeGreaterThanOrEqual(16)
    })
  }

  it('nunca toma la contraseña del chat', () => {
    const { index, lex } = load('es')
    const r = parseRequest(index, lex, 'ponle la clave "Secreta123" a este pdf')
    expect(JSON.stringify(r)).not.toContain('Secreta123')
    expect(r?.action).toMatchObject({ kind: 'openTool', tool: 'proteger-pdf' })
  })

  it('informa las opciones que la herramienta no acepta', () => {
    const { index, lex } = load('es')
    const r = parseRequest(index, lex, 'firma este pdf a 300 ppp')
    expect(r?.action).toMatchObject({ kind: 'openTool', tool: 'firmar-pdf' })
    expect(r?.dropped).toEqual(['dpi'])
  })

  it('sin léxico (idioma todavía sin él) no intenta entender pedidos', () => {
    const { index } = load('es')
    expect(parseRequest(index, undefined, 'comprime este pdf')).toBeNull()
  })
})
