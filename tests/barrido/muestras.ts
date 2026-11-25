// Barrido de herramientas: archivos de muestra por tipo de entrada. Todo se genera aquí (o sale de
// tests/fixtures): ningún documento real.
import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import { zipSync } from 'fflate'
import { writeXlsx } from '../../src/features/convert/core/pdfExcel'
import { writeDocx } from '../../src/features/convert/core/pdfWord'
import { APPLE, HEIC_SQUARES, SVG_LOGO, tinyTiff } from '../e2e/fixtures'
import { recordVideo } from '../e2e/mediaClips'

export type Muestra = { name: string; mimeType: string; buffer: Buffer }

/** PDF "realista": 4 páginas con texto, una imagen, una página girada, otra horizontal y un campo. */
export async function pdfRico(): Promise<Buffer> {
  const d = await PDFDocument.create()
  d.setTitle('Informe de prueba')
  const font = await d.embedFont(StandardFonts.Helvetica)
  const png = await d.embedPng(APPLE)
  const lines = ['Informe trimestral de ventas', 'Resumen: las ventas subieron un 12 % frente al trimestre anterior.', 'Contacto: ventas@ejemplo.com, teléfono 300 123 4567.', 'Cuenta: 0123-4567-89.']
  for (let i = 0; i < 4; i++) {
    const p = d.addPage(i === 2 ? [842, 595] : [595, 842])
    if (i === 3) p.setRotation(degrees(90))
    let y = p.getHeight() - 70
    for (const l of lines) {
      p.drawText(`${l} (página ${i + 1})`, { x: 50, y, size: 12, font, color: rgb(0.1, 0.1, 0.1) })
      y -= 22
    }
    if (i === 0) p.drawImage(png, { x: 50, y: y - 220, width: 200, height: 200 })
  }
  d.getForm().createTextField('Nombre').addToPage(d.getPage(0), { x: 300, y: 600, width: 200, height: 24 })
  return Buffer.from(await d.save())
}

/** PDF de muchas páginas (para ver que no se cuelga ni se desordena la vista). */
export async function pdfLargo(paginas = 120): Promise<Buffer> {
  const d = await PDFDocument.create()
  const font = await d.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < paginas; i++) d.addPage([595, 842]).drawText(`Página ${i + 1} de ${paginas}`, { x: 50, y: 780, size: 14, font })
  return Buffer.from(await d.save())
}

/** JPEG y WebP hechos por el navegador (una foto de una hoja con texto). */
export async function imagenes(page: Page): Promise<{ jpg: Buffer; webp: Buffer }> {
  const [jpg, webp] = await page.evaluate(async () => {
    const c = document.createElement('canvas')
    c.width = 900
    c.height = 1200
    const g = c.getContext('2d')!
    g.fillStyle = '#7a5a3a'
    g.fillRect(0, 0, 900, 1200)
    g.fillStyle = '#fbfbf8'
    g.fillRect(80, 80, 740, 1040)
    g.fillStyle = '#222'
    g.font = '32px sans-serif'
    g.fillText('Documento de prueba', 130, 180)
    g.font = '22px sans-serif'
    for (let i = 0; i < 14; i++) g.fillText(`Línea de texto número ${i + 1} para probar el OCR.`, 130, 250 + i * 50)
    const enc = async (type: string) => {
      const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), type, 0.9))
      const u = new Uint8Array(await b.arrayBuffer())
      let s = ''
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
      return btoa(s)
    }
    return [await enc('image/jpeg'), await enc('image/webp')]
  })
  return { jpg: Buffer.from(jpg, 'base64'), webp: Buffer.from(webp, 'base64') }
}

const run = (text: string, o = {}) => ({ text, bold: false, italic: false, size: 11, family: 'serif' as const, ...o })
const office = {
  docx: () =>
    Buffer.from(
      writeDocx({
        page: { width: 612, height: 792 },
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        bodySize: 11,
        bodyFamily: 'serif',
        bodyFont: 'Times New Roman',
        blocks: [
          { kind: 'para', runs: [run('Informe de prueba', { size: 18, bold: true })], align: 'center', heading: 1, bullet: false, indent: 0 },
          { kind: 'para', runs: [run('Un párrafo con texto para convertir a PDF, con tildes y eñes: año, canción.')], align: 'left', heading: 0, bullet: false, indent: 0 },
          { kind: 'table', rows: [[[run('Mes', { bold: true })], [run('Total', { bold: true })]], [[run('Enero')], [run('1.200')]]], widths: [200, 100] },
        ],
      }),
    ),
  xlsx: () =>
    Buffer.from(
      writeXlsx([
        { name: 'Ventas', rows: [[{ v: 'Producto', bold: true }, { v: 'Cantidad', bold: true }, { v: 'Precio', bold: true }], [{ v: 'Lápiz' }, { v: 10 }, { v: 1200 }], [{ v: 'Cuaderno' }, { v: 4 }, { v: 5600.5 }]] },
      ]),
    ),
}

/** Muestra buena para la herramienta (o null si no recibe archivos). */
export async function muestraPara(slug: string, page: Page): Promise<Muestra[] | null> {
  const pdf = (name = 'informe.pdf'): Muestra => ({ name, mimeType: 'application/pdf', buffer: Buffer.alloc(0) })
  const fillPdf = async (m: Muestra) => ({ ...m, buffer: await pdfRico() })
  const png: Muestra = { name: 'foto.png', mimeType: 'image/png', buffer: APPLE }
  switch (slug) {
    case 'escanear-documento':
    case 'imagen-a-texto':
    case 'quitar-metadatos':
    case 'foto-tamano-documento': {
      const { jpg } = await imagenes(page)
      return [{ name: 'foto.jpg', mimeType: 'image/jpeg', buffer: jpg }]
    }
    case 'heic-a-jpg':
      return [{ name: 'foto.heic', mimeType: 'image/heic', buffer: HEIC_SQUARES }]
    case 'svg-a-png':
      return [{ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: SVG_LOGO }]
    case 'tiff-a-jpg':
      return [{ name: 'escaneo.tif', mimeType: 'image/tiff', buffer: tinyTiff(320, 240, [30, 120, 200]) }]
    case 'imagen-a-webp':
    case 'png-a-jpg':
    case 'jpg-a-png':
    case 'imagen-a-gif':
    case 'imagen-a-avif':
    case 'png-a-ico':
    case 'imagen-a-pdf':
    case 'comprimir-imagen':
    case 'redimensionar-imagen':
    case 'recortar-imagen':
    case 'rotar-imagen':
    case 'quitar-fondo':
    case 'marca-de-agua-imagen':
    case 'ajustar-imagen':
    case 'leer-codigo-qr':
      return [png]
    case 'video-a-mp3':
    case 'convertir-video':
    case 'recortar-audio-video':
    case 'comprimir-video': {
      const v = await recordVideo(page, 2)
      return [{ name: 'clip.webm', mimeType: v.type, buffer: v.buffer }]
    }
    case 'audio-a-texto':
      return [{ name: 'voz.wav', mimeType: 'audio/wav', buffer: await readFile('tests/fixtures/audio/voz-es.wav') }]
    case 'word-a-pdf':
      return [{ name: 'informe.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: office.docx() }]
    case 'excel-a-pdf':
    case 'excel-a-csv':
      return [{ name: 'ventas.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: office.xlsx() }]
    case 'powerpoint-a-pdf':
      return [{ name: 'presentacion.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: await readFile('tests/fixtures/office/presentacion.pptx') }]
    case 'csv-a-excel':
      return [{ name: 'clientes.csv', mimeType: 'text/csv', buffer: Buffer.from('Nombre;Ciudad;Saldo\nAna;Bogotá;1200,50\nLuis;Medellín;300\n', 'utf8') }]
    case 'comprimir-archivos':
    case 'calcular-hash':
      return [png, await fillPdf(pdf())]
    case 'descomprimir-archivos':
      return [{ name: 'documentos.zip', mimeType: 'application/zip', buffer: Buffer.from(zipSync({ 'carta.txt': new TextEncoder().encode('Hola'), 'fotos/foto.png': new Uint8Array(APPLE) })) }]
    case 'cuenta-de-cobro':
    case 'hoja-de-vida':
    case 'contador-de-palabras':
    case 'comparar-textos':
    case 'generador-de-contrasenas':
    case 'crear-codigo-qr':
      return null
    case 'unir-pdf':
      return [await fillPdf(pdf('contrato.pdf')), await fillPdf(pdf('anexo.pdf'))]
    default:
      return [await fillPdf(pdf())]
  }
}

/** Una muestra mala: el nombre y el tipo que la herramienta acepta, pero el contenido no sirve. */
export function muestraMala(buena: Muestra, vacia: boolean): Muestra {
  const ext = buena.name.slice(buena.name.lastIndexOf('.'))
  return { name: `${vacia ? 'vacio' : 'danado'}${ext}`, mimeType: buena.mimeType, buffer: vacia ? Buffer.alloc(0) : Buffer.from('Esto no es un archivo de verdad, solo texto con la extensión cambiada.\n'.repeat(20)) }
}
