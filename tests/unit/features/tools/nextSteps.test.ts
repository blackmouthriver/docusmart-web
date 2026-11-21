import { describe, expect, it } from 'vitest'
import { CATALOG } from '../../../../src/features/tools/core/catalog'
import { resultKind, suggestNextSteps } from '../../../../src/features/tools/core/nextSteps'

const keys = (kind: Parameters<typeof suggestNextSteps>[0], tool: string) => suggestNextSteps(kind, tool).map((c) => c.key)
const file = (name: string, type = '') => ({ name, type })

describe('resultKind', () => {
  it('reconoce el tipo por MIME o por extensión', () => {
    expect(resultKind(file('a.pdf', 'application/pdf'))).toBe('pdf')
    expect(resultKind(file('A.PDF'))).toBe('pdf')
    expect(resultKind(file('x.png', 'image/png'))).toBe('image')
    expect(resultKind(file('x.HEIC'))).toBe('image')
    expect(resultKind(file('c.docx'))).toBe('word')
    expect(resultKind(file('t.xlsx'))).toBe('excel')
    expect(resultKind(file('todo.zip', 'application/zip'))).toBe('other')
    expect(resultKind(file('notas.txt', 'text/plain'))).toBe('other')
  })
})

describe('suggestNextSteps', () => {
  it('después de unir: comprimir, firmar y proteger (el flujo del backlog)', () => {
    expect(keys('pdf', 'merge')).toEqual(['pdf/comprimir', 'pdf/firmar', 'pdf/proteger'])
  })

  it('nunca sugiere la herramienta que acaba de usarse', () => {
    for (const tool of ['merge', 'compress', 'sign', 'unlock', 'repair', 'ocr', 'scan', 'rotate', 'number_pages', 'watermark', 'crop', 'redact', 'edit', 'form']) {
      const current = { merge: 'pdf/unir', compress: 'pdf/comprimir', sign: 'pdf/firmar', unlock: 'pdf/desbloquear', repair: 'pdf/reparar', ocr: 'pdf/ocr', scan: 'pdf/escanear', rotate: 'pdf/rotar', number_pages: 'pdf/numerar', watermark: 'pdf/marca', crop: 'pdf/recortar', redact: 'pdf/censurar', edit: 'pdf/editar', form: 'pdf/formulario' }[tool]
      expect(keys('pdf', tool)).not.toContain(current)
    }
  })

  it('siempre completa 3 sugerencias para un PDF', () => {
    for (const tool of ['merge', 'compress', 'sign', 'unlock', 'repair', 'ocr', 'scan', 'rotate', 'reorder_pages', 'number_pages', 'watermark', 'crop', 'redact', 'edit', 'form', 'pdfa', 'word-pdf', 'img-pdf']) {
      expect(keys('pdf', tool), tool).toHaveLength(3)
    }
  })

  it('sin repetidos', () => {
    for (const tool of ['merge', 'compress', 'unknown']) {
      const k = keys('pdf', tool)
      expect(new Set(k).size).toBe(k.length)
    }
  })

  it('un PDF protegido o los resultados que no siguen en otra herramienta no sugieren nada', () => {
    for (const tool of ['protect', 'compare', 'extract_images', 'split', 'qr', 'study_notes', 'study_agenda', 'archive_create', 'archive_extract', 'hash']) {
      expect(keys('pdf', tool), tool).toEqual([])
    }
  })

  it('una imagen sugiere convertir a PDF y herramientas de imagen', () => {
    expect(keys('image', 'crop_image')).toEqual(['convertir/img-pdf', 'imagen/comprimir', 'imagen/redimensionar'])
    expect(keys('image', 'id_photo')).toContain('convertir/img-pdf')
  })

  it('Word y Excel sugieren su conversión a PDF; otros archivos, nada', () => {
    expect(keys('word', 'convert')).toEqual(['convertir/word-pdf'])
    expect(keys('excel', 'convert')).toEqual(['convertir/excel-pdf'])
    expect(keys('other', 'convert')).toEqual([])
  })

  it('respeta el límite pedido', () => {
    expect(suggestNextSteps('pdf', 'merge', 2)).toHaveLength(2)
    expect(suggestNextSteps('pdf', 'merge', 1)).toHaveLength(1)
  })

  it('todas las claves que sugiere existen en el catálogo y llevan a una pantalla', () => {
    const all = new Set<string>()
    for (const kind of ['pdf', 'image', 'word', 'excel'] as const) {
      for (const tool of ['merge', 'compress', 'sign', 'unlock', 'repair', 'ocr', 'scan', 'rotate', 'number_pages', 'watermark', 'crop', 'redact', 'edit', 'form', 'pdfa', 'crop_image', 'id_photo', 'x']) {
        suggestNextSteps(kind, tool, 99).forEach((c) => all.add(c.key))
      }
    }
    expect(all.size).toBeGreaterThan(5)
    for (const key of all) {
      const t = CATALOG.find((c) => c.key === key)
      expect(t, key).toBeDefined()
      expect(t!.section && t!.sub).toBeTruthy()
    }
  })
})
