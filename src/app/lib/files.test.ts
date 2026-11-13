import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { baseName, download, formatBytes, isOwnBlobUrl, kindOf, parsePageRanges, safeFilename, safeMimeType } from './files'

const file = (name: string, type = '') => new File([''], name, { type })

describe('files', () => {
  it('interpreta rangos de páginas en base 0, ordenados y sin repetir', () => {
    expect(parsePageRanges('1-3, 5', 6)).toEqual([0, 1, 2, 4])
    expect(parsePageRanges('4-', 6)).toEqual([3, 4, 5])
    expect(parsePageRanges('-2', 6)).toEqual([0, 1])
    expect(parsePageRanges('2, 2, 1', 6)).toEqual([0, 1])
  })

  it('rechaza rangos fuera del documento o mal escritos', () => {
    expect(parsePageRanges('9', 6)).toBeNull()
    expect(parsePageRanges('3-1', 6)).toBeNull()
    expect(parsePageRanges('0', 6)).toBeNull()
    expect(parsePageRanges('a-b', 6)).toBeNull()
    expect(parsePageRanges(' , ', 6)).toBeNull()
  })

  it('reconoce el tipo de archivo por MIME o por extensión', () => {
    expect(kindOf(file('a.bin', 'application/pdf'))).toBe('pdf')
    expect(kindOf(file('scan.PDF'))).toBe('pdf')
    expect(kindOf(file('foto.webp'))).toBe('image')
    expect(kindOf(file('notas.md'))).toBe('text')
    expect(kindOf(file('hoja.xlsx'))).toBe('other')
  })

  it('formatea tamaños y quita la extensión', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(baseName('informe.final.pdf')).toBe('informe.final')
  })
})

describe('descargas seguras', () => {
  it('conserva solo los tipos que el sitio genera; el resto se descarga como binario', () => {
    expect(safeMimeType('application/pdf')).toBe('application/pdf')
    expect(safeMimeType('text/plain;charset=utf-8')).toBe('text/plain;charset=utf-8')
    expect(safeMimeType('IMAGE/PNG')).toBe('IMAGE/PNG')
    expect(safeMimeType('text/html')).toBe('application/octet-stream')
    expect(safeMimeType('image/svg+xml')).toBe('application/octet-stream')
    expect(safeMimeType('')).toBe('application/octet-stream')
  })

  it('limpia nombres de archivo con rutas o caracteres de control', () => {
    expect(safeFilename('informe.pdf')).toBe('informe.pdf')
    expect(safeFilename('../../etc/passwd')).toBe('.._.._etc_passwd')
    expect(safeFilename('a<b>:c?.txt')).toBe('a_b__c_.txt')
    expect(safeFilename('  ')).toBe('archivo')
    expect(safeFilename('x'.repeat(300))).toHaveLength(180)
  })

  it('solo acepta URLs blob: del propio sitio', () => {
    const origin = 'https://docusmart.online'
    expect(isOwnBlobUrl('blob:https://docusmart.online/1234', origin)).toBe(true)
    expect(isOwnBlobUrl('blob:https://evil.example/1234', origin)).toBe(false)
    expect(isOwnBlobUrl('javascript:alert(1)', origin)).toBe(false)
    expect(isOwnBlobUrl('https://docusmart.online/x', origin)).toBe(false)
  })

  describe('download()', () => {
    const anchors: Array<Record<string, unknown>> = []
    let created: Blob | null = null
    beforeEach(() => {
      anchors.length = 0
      vi.stubGlobal('location', { origin: 'https://docusmart.online' })
      vi.stubGlobal('document', {
        createElement: () => {
          const a: Record<string, unknown> = { click: vi.fn(), remove: vi.fn() }
          anchors.push(a)
          return a
        },
        body: { appendChild: vi.fn() },
      })
      vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => {
        created = b as Blob
        return 'blob:https://docusmart.online/abc'
      })
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    })
    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    it('descarga con tipo seguro, nombre limpio y rel=noopener', () => {
      download(new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'x/y.html')
      expect(created?.type).toBe('application/octet-stream')
      expect(anchors[0]).toMatchObject({ href: 'blob:https://docusmart.online/abc', download: 'x_y.html', rel: 'noopener' })
      expect(anchors[0].click).toHaveBeenCalled()
    })

    it('mantiene el tipo de los formatos esperados', () => {
      download(new Uint8Array([1, 2, 3]), 'a.pdf', 'application/pdf')
      expect(created?.type).toBe('application/pdf')
    })

    it('se niega si la URL no es un blob del propio sitio', () => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('javascript:alert(1)')
      expect(() => download(new Uint8Array([1]), 'a.pdf', 'application/pdf')).toThrow()
      expect(anchors).toHaveLength(0)
    })
  })
})
