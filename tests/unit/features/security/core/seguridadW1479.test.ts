// W-147.9: hash de archivos grandes por partes, verificar listas SHA256SUMS y rescatar las páginas
// de un PDF cortado.
import { resolve } from 'node:path'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { beforeAll, describe, expect, it } from 'vitest'
import { hashBytes, hashFile, matchChecksumFiles, parseChecksumList, STREAM_FROM, type HashAlgorithm } from '../../../../../src/features/integrity/core/hash'
import { CHUNK, createHasher, hashBlob } from '../../../../../src/features/integrity/core/hashStream'
import { repair } from '../../../../../src/features/security/core/pdfSecurity'
import { SalvageError, fixLength, inflatePartial, objectStreamObjects, salvagePdf, scanObjects, valueOf } from '../../../../../src/features/security/core/pdfSalvage'
import { setQpdfWasmUrl } from '../../../../../src/features/security/infra/qpdf'
import { zlibSync } from 'fflate'

const ALGOS: HashAlgorithm[] = ['SHA-256', 'SHA-1', 'SHA-512', 'MD5']
const data = (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 131 + (i >> 7)) & 255)

describe('hash por partes', () => {
  it('da lo mismo que Web Crypto con cualquier corte, en los cuatro algoritmos', async () => {
    for (const n of [0, 1, 55, 56, 64, 111, 112, 128, 1000, 70_003]) {
      const d = data(n)
      for (const a of ALGOS) {
        const h = createHasher(a)
        let at = 0
        for (const step of [1, 63, 64, 129, 1000]) {
          h.update(d.subarray(at, Math.min(n, at + step)))
          at = Math.min(n, at + step)
        }
        h.update(d.subarray(at))
        expect(h.digest(), `${a} ${n}`).toBe(await hashBytes(d, a))
      }
    }
  })

  it('vectores conocidos', () => {
    const run = (a: HashAlgorithm, s: string) => {
      const h = createHasher(a)
      h.update(new TextEncoder().encode(s))
      return h.digest()
    }
    expect(run('SHA-256', 'abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(run('SHA-1', 'abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect(run('MD5', 'abc')).toBe('900150983cd24fb0d6963f7d28e17f72')
    expect(run('SHA-512', 'abc')).toBe('ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f')
  })

  it('un archivo se lee de a pedazos, con avance y se puede cancelar', async () => {
    const blob = new Blob([data(2 * CHUNK + 123)])
    const seen: number[] = []
    expect(await hashBlob(blob, 'SHA-256', (done) => seen.push(done))).toBe(await hashBytes(data(2 * CHUNK + 123), 'SHA-256'))
    expect(seen).toEqual([CHUNK, 2 * CHUNK, 2 * CHUNK + 123])
    const ctrl = new AbortController()
    ctrl.abort()
    await expect(hashBlob(blob, 'MD5', undefined, ctrl.signal)).rejects.toThrow()
  }, 20_000) // 16 MB en JavaScript: con la máquina cargada pasa de los 5 s por defecto

  it('hashFile: Web Crypto para los chicos, por partes para MD5 (y los grandes)', async () => {
    const small = new Blob([data(5000)])
    const progress: number[] = []
    expect(await hashFile(small, 'SHA-512', (d) => progress.push(d))).toBe(await hashBytes(data(5000), 'SHA-512'))
    expect(progress).toEqual([5000])
    expect(await hashFile(small, 'MD5')).toBe(await hashBytes(data(5000), 'MD5'))
    expect(STREAM_FROM).toBeGreaterThan(CHUNK)
  })
})

describe('listas de sumas', () => {
  const a = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  it('formato de sha256sum, binario (*), BSD/macOS, comentarios y líneas que no se entienden', () => {
    const text = `# lista\n${a}  dist/app.zip\n${a.toUpperCase()} *Instalador v2.exe\nSHA256 (notas (final).txt) = ${a}\nMD5 (x.bin) = d41d8cd98f00b204e9800998ecf8427e\nSHA1 (malo.bin) = ${a}\nesto no es una suma\n`
    const r = parseChecksumList(text)
    expect(r.entries).toEqual([
      { hash: a, name: 'dist/app.zip', algorithm: 'SHA-256' },
      { hash: a, name: 'Instalador v2.exe', algorithm: 'SHA-256' },
      { hash: a, name: 'notas (final).txt', algorithm: 'SHA-256' },
      { hash: 'd41d8cd98f00b204e9800998ecf8427e', name: 'x.bin', algorithm: 'MD5' },
    ])
    expect(r.invalid).toBe(2)
  })

  it('cada línea con su archivo por el nombre (sin carpetas, y sin importar mayúsculas)', () => {
    const { entries } = parseChecksumList(`${a}  dist/app.zip\n${a}  LEEME.txt\n${a}  falta.bin`)
    const r = matchChecksumFiles(entries, ['leeme.TXT', 'otro.pdf', 'app.zip'])
    expect(r.pairs.map((p) => p.file)).toEqual([2, 0, null])
    expect(r.extra).toEqual([1])
  })
})

/* ───────────── Rescatar un PDF cortado ───────────── */

beforeAll(() => setQpdfWasmUrl(resolve(process.cwd(), 'node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm')))

/** PDF de n páginas con "Pagina k" y texto que lo hace pesado; las páginas del medio heredan el tamaño. */
async function sample(n: number, objectStreams = false) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < n; i++) {
    const p = doc.addPage([300 + i, 400])
    for (let l = 0; l < 25; l++) p.drawText(`Pagina ${i + 1} linea ${l} ${'x'.repeat(30)}`, { x: 10, y: 380 - l * 14, size: 8, font, color: rgb(0, 0, 0) })
  }
  return doc.save({ useObjectStreams: objectStreams })
}

async function pageTexts(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice() })
  const doc = await task.promise
  const out: string[] = []
  for (let i = 1; i <= doc.numPages; i++) out.push(((await (await doc.getPage(i)).getTextContent()).items[0] as { str: string }).str.slice(0, 9))
  await task.destroy()
  return out
}

describe('rescatar un PDF cortado', () => {
  it('recupera las páginas que llegaron completas, en orden y con su texto', async () => {
    const full = await sample(6)
    const cut = full.slice(0, Math.floor(full.length * 0.6))
    await expect(PDFDocument.load(cut)).rejects.toThrow()
    const r = await repair(cut)
    expect(r.rescued).toEqual({ pages: 3, expected: 6 })
    expect(r.hadProblems).toBe(true)
    expect(await pageTexts(r.bytes)).toEqual(['Pagina 1 ', 'Pagina 2 ', 'Pagina 3 '])
    // Cada página conserva su tamaño.
    expect((await PDFDocument.load(r.bytes)).getPages().map((p) => p.getWidth())).toEqual([300, 301, 302])
  })

  it('con flujos de objetos: descomprime lo que llegó del flujo cortado', async () => {
    const full = await sample(6, true)
    const r = await repair(full.slice(0, Math.floor(full.length * 0.97)))
    expect(r.rescued!.pages).toBeGreaterThan(0)
    expect((await pageTexts(r.bytes))[0]).toBe('Pagina 1 ')
  })

  it('un PDF sano no pasa por el rescate', async () => {
    const r = await repair(await sample(2))
    expect(r.rescued).toBeUndefined()
  })

  it('sin páginas completas, o cifrado, avisa', async () => {
    const full = await sample(3)
    await expect(repair(full.slice(0, 300))).rejects.toThrow()
    expect(() => salvagePdf(new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<< /Filter /Standard /V 2 >>\nendobj\n'))).toThrow(SalvageError)
    try {
      salvagePdf(new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n'))
    } catch (e) {
      expect((e as SalvageError).reason).toBe('nothing')
    }
  })

  it('piezas: objetos, valores, largo de los flujos y descompresión parcial', () => {
    const text = '1 0 obj\n<< /Type /Page /MediaBox [0 0 10 10] /Resources << /Font << /F1 5 0 R >> >> /Parent 2 0 R /Rotate 90 >>\nendobj\n3 0 obj\n<< /Length 9 0 R >>\nstream\nendobj!!\nendstream\nendobj\n4 0 obj\n<< /Ty'
    const cut = { obj: null as null | { num: number; body: string } }
    const objs = scanObjects(text, cut)
    expect([...objs.keys()]).toEqual([1, 3])
    expect(cut.obj?.num).toBe(4)
    const page = objs.get(1)!.body
    expect(valueOf(page, 'MediaBox')).toBe('[0 0 10 10]')
    expect(valueOf(page, 'Resources')).toBe('<< /Font << /F1 5 0 R >> >>')
    expect(valueOf(page, 'Parent')).toBe('2 0 R')
    expect(valueOf(page, 'Rotate')).toBe('90')
    expect(valueOf(page, 'Type')).toBe('/Page')
    expect(valueOf(page, 'Contents')).toBeNull()
    expect(fixLength(objs.get(3)!.body)).toContain('/Length 8 >>')
    const payload = new TextEncoder().encode('1 0 2 12 << /A 1 >> << /B 2 >>'.repeat(200))
    const z = zlibSync(payload)
    expect(new TextDecoder().decode(inflatePartial(z))).toBe(new TextDecoder().decode(payload))
    expect(inflatePartial(z.subarray(0, z.length / 2)).length).toBeLessThan(payload.length)
    const objStm = `<< /Type /ObjStm /N 2 /First 9 /Length 21 >>\nstream\n1 0 2 11 << /A 1 >> << /B 2 >>\nendstream`
    expect(objectStreamObjects(objStm).map((o) => [o.num, o.body])).toEqual([[1, '<< /A 1 >>'], [2, '<< /B 2 >>']])
  })
})
