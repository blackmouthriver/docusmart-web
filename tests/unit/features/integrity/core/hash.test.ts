import { describe, expect, it } from 'vitest'
import { createHash, randomBytes } from 'node:crypto'
import {
  ALGORITHMS,
  checksumFileName,
  checksumText,
  detectAlgorithm,
  hashBytes,
  hashFile,
  hashesMatch,
  md5,
  normalizeHash,
  toHex,
} from '../../../../../src/features/integrity/core/hash'

const enc = (s: string) => new TextEncoder().encode(s)

describe('md5', () => {
  // Vectores de prueba del RFC 1321.
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', '57edf4a22be3c955ac49da2e2107b67a'],
  ])('md5(%j)', (input, expected) => {
    expect(md5(enc(input))).toBe(expected)
  })

  it('coincide con Node en tamaños que cruzan el borde de bloque', () => {
    for (const n of [55, 56, 63, 64, 65, 119, 120, 1000, 100_003]) {
      const data = randomBytes(n)
      expect(md5(data), `n=${n}`).toBe(createHash('md5').update(data).digest('hex'))
    }
  })
})

describe('hashBytes', () => {
  it.each([
    ['SHA-1', 'sha1'],
    ['SHA-256', 'sha256'],
    ['SHA-512', 'sha512'],
    ['MD5', 'md5'],
  ] as const)('%s coincide con Node', async (algo, node) => {
    const data = randomBytes(4097)
    expect(await hashBytes(data, algo)).toBe(createHash(node).update(data).digest('hex'))
  })

  it('hashFile lee el archivo completo', async () => {
    const file = new Blob([enc('DocuSmart')])
    expect(await hashFile(file, 'SHA-256')).toBe(createHash('sha256').update('DocuSmart').digest('hex'))
  })

  it('ofrece SHA-256 primero', () => {
    expect(ALGORITHMS[0]).toBe('SHA-256')
  })
})

describe('comparar hashes', () => {
  const sha = createHash('sha256').update('x').digest('hex')

  it('normalizeHash quita espacios, mayúsculas, prefijos y el nombre de sha256sum', () => {
    expect(normalizeHash(`  ${sha.toUpperCase()}  `)).toBe(sha)
    expect(normalizeHash(`${sha}  contrato.pdf`)).toBe(sha)
    expect(normalizeHash(`sha256:${sha}`)).toBe(sha)
    expect(normalizeHash(`SHA-256=${sha}`)).toBe(sha)
    expect(normalizeHash('')).toBe('')
  })

  it('detectAlgorithm reconoce el algoritmo por el largo', () => {
    expect(detectAlgorithm('d41d8cd98f00b204e9800998ecf8427e')).toBe('MD5')
    expect(detectAlgorithm('a'.repeat(40))).toBe('SHA-1')
    expect(detectAlgorithm(sha)).toBe('SHA-256')
    expect(detectAlgorithm('F'.repeat(128))).toBe('SHA-512')
    expect(detectAlgorithm('abc')).toBeNull()
    expect(detectAlgorithm('z'.repeat(64))).toBeNull()
    expect(detectAlgorithm('')).toBeNull()
  })

  it('hashesMatch ignora mayúsculas y espacios', () => {
    expect(hashesMatch(sha, ` ${sha.toUpperCase()} `)).toBe(true)
    expect(hashesMatch(sha, sha.replace(/.$/, '0') === sha ? sha.replace(/.$/, '1') : sha.replace(/.$/, '0'))).toBe(false)
  })
})

describe('lista de hashes', () => {
  it('usa el formato de sha256sum', () => {
    expect(checksumText([{ name: 'a.pdf', size: 1, hash: 'aa' }, { name: 'b c.jpg', size: 2, hash: 'bb' }])).toBe('aa  a.pdf\nbb  b c.jpg\n')
  })

  it('nombre del archivo según el algoritmo', () => {
    expect(checksumFileName('SHA-256')).toBe('hashes.sha256')
    expect(checksumFileName('MD5')).toBe('hashes.md5')
  })

  it('toHex rellena con ceros', () => {
    expect(toHex(new Uint8Array([0, 15, 255]))).toBe('000fff')
  })
})
