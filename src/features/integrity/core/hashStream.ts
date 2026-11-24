/**
 * Hash por partes (W-147.9): Web Crypto solo calcula el hash de todo el archivo en memoria, lo que
 * no sirve para archivos de varios GB (sobre todo en el celular). Aquí SHA-256, SHA-1, SHA-512 y
 * MD5 se calculan de a pedazos: el archivo se lee de a 8 MB y nunca está entero en memoria.
 *
 * Las constantes de SHA se calculan (raíces cuadradas y cúbicas de los primeros primos, con
 * enteros exactos) en vez de copiarlas: así no puede haber una cifra mal escrita.
 */
import type { HashAlgorithm } from './hash'

export interface Hasher {
  update(data: Uint8Array): void
  /** El hash en hexadecimal (minúsculas). Después ya no se puede usar. */
  digest(): string
}

const hex = (words: Uint32Array | number[], littleEndian = false) => {
  let s = ''
  for (const w of words) {
    const v = littleEndian ? ((w & 255) << 24) | (((w >>> 8) & 255) << 16) | (((w >>> 16) & 255) << 8) | (w >>> 24) : w
    s += (v >>> 0).toString(16).padStart(8, '0')
  }
  return s
}

/* ───────────── Constantes ───────────── */

function primes(n: number): number[] {
  const out: number[] = []
  for (let x = 2; out.length < n; x++) if (out.every((p) => x % p)) out.push(x)
  return out
}

/** Raíz entera (piso) de orden k de n, con Newton sobre enteros grandes. */
function iroot(n: bigint, k: bigint): bigint {
  if (n < 2n) return n
  let x = 1n << (BigInt(n.toString(2).length) / k + 1n)
  for (;;) {
    const y = ((k - 1n) * x + n / x ** (k - 1n)) / k
    if (y >= x) return x
    x = y
  }
}

/** Los primeros `bits` bits de la parte fraccionaria de la raíz de orden k de cada primo. */
function fractions(count: number, k: bigint, bits: bigint): bigint[] {
  const mask = (1n << bits) - 1n
  return primes(count).map((p) => iroot(BigInt(p) << (bits * k), k) & mask)
}

const K256 = Uint32Array.from(fractions(64, 3n, 32n), Number)
const H256 = Uint32Array.from(fractions(8, 2n, 32n), Number)
const split64 = (list: bigint[]) => {
  const out = new Uint32Array(list.length * 2)
  list.forEach((v, i) => {
    out[2 * i] = Number(v >> 32n)
    out[2 * i + 1] = Number(v & 0xffffffffn)
  })
  return out
}
const K512 = split64(fractions(80, 3n, 64n))
const H512 = split64(fractions(8, 2n, 64n))

/* ───────────── Base: bloques de 64 o 128 bytes ───────────── */

abstract class BlockHasher implements Hasher {
  protected buf: Uint8Array
  private used = 0
  private total = 0
  constructor(private readonly block: number) {
    this.buf = new Uint8Array(block)
  }
  protected abstract compress(b: Uint8Array, off: number): void
  protected abstract result(): string

  update(data: Uint8Array) {
    this.total += data.length
    let i = 0
    if (this.used) {
      const n = Math.min(this.block - this.used, data.length)
      this.buf.set(data.subarray(0, n), this.used)
      this.used += n
      i = n
      if (this.used < this.block) return
      this.compress(this.buf, 0)
      this.used = 0
    }
    for (; i + this.block <= data.length; i += this.block) this.compress(data, i)
    if (i < data.length) {
      this.buf.set(data.subarray(i), 0)
      this.used = data.length - i
    }
  }

  /** Relleno: 0x80, ceros y el largo en bits (big-endian, o little-endian en MD5). */
  digest(littleEndianLength = false): string {
    const lenBytes = this.block === 128 ? 16 : 8
    const bits = this.total * 8
    const tail = new Uint8Array((this.used + 1 + lenBytes > this.block ? 2 : 1) * this.block - this.used)
    tail[0] = 0x80
    const hi = Math.floor(bits / 2 ** 32)
    const lo = bits >>> 0
    const v = new DataView(tail.buffer)
    if (littleEndianLength) {
      v.setUint32(tail.length - 8, lo, true)
      v.setUint32(tail.length - 4, hi, true)
    } else {
      v.setUint32(tail.length - 8, hi)
      v.setUint32(tail.length - 4, lo)
    }
    const total = this.total
    this.update(tail)
    this.total = total
    return this.result()
  }
}

/* ───────────── SHA-256 ───────────── */

class Sha256 extends BlockHasher {
  private h = H256.slice()
  private w = new Uint32Array(64)
  constructor() {
    super(64)
  }
  protected compress(b: Uint8Array, off: number) {
    const w = this.w
    for (let t = 0; t < 16; t++) {
      const p = off + t * 4
      w[t] = (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]
    }
    for (let t = 16; t < 64; t++) {
      const a = w[t - 15]
      const c = w[t - 2]
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3)
      const s1 = ((c >>> 17) | (c << 15)) ^ ((c >>> 19) | (c << 13)) ^ (c >>> 10)
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0
    }
    const h = this.h
    let a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7]
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const t1 = (hh + S1 + ((e & f) ^ (~e & g)) + K256[t] + w[t]) >>> 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const t2 = (S0 + ((a & bb) ^ (a & c) ^ (bb & c))) >>> 0
      hh = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = bb
      bb = a
      a = (t1 + t2) >>> 0
    }
    h[0] += a
    h[1] += bb
    h[2] += c
    h[3] += d
    h[4] += e
    h[5] += f
    h[6] += g
    h[7] += hh
  }
  protected result() {
    return hex(this.h)
  }
  override digest() {
    return super.digest(false)
  }
}

/* ───────────── SHA-1 ───────────── */

class Sha1 extends BlockHasher {
  private h = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0])
  private w = new Uint32Array(80)
  constructor() {
    super(64)
  }
  protected compress(b: Uint8Array, off: number) {
    const w = this.w
    for (let t = 0; t < 16; t++) {
      const p = off + t * 4
      w[t] = (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]
    }
    for (let t = 16; t < 80; t++) {
      const x = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]
      w[t] = (x << 1) | (x >>> 31)
    }
    const h = this.h
    let a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4]
    for (let t = 0; t < 80; t++) {
      const f = t < 20 ? (bb & c) | (~bb & d) : t < 40 ? bb ^ c ^ d : t < 60 ? (bb & c) | (bb & d) | (c & d) : bb ^ c ^ d
      const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6
      const tmp = (((a << 5) | (a >>> 27)) + f + e + k + w[t]) >>> 0
      e = d
      d = c
      c = (bb << 30) | (bb >>> 2)
      bb = a
      a = tmp
    }
    h[0] += a
    h[1] += bb
    h[2] += c
    h[3] += d
    h[4] += e
  }
  protected result() {
    return hex(this.h)
  }
  override digest() {
    return super.digest(false)
  }
}

/* ───────────── SHA-512 (64 bits en pares de 32) ───────────── */

class Sha512 extends BlockHasher {
  private h = H512.slice()
  private w = new Uint32Array(160)
  constructor() {
    super(128)
  }
  protected compress(b: Uint8Array, off: number) {
    const w = this.w
    for (let t = 0; t < 32; t++) {
      const p = off + t * 4
      w[t] = (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]
    }
    for (let t = 16; t < 80; t++) {
      // σ0(w[t-15]) = rotr1 ^ rotr8 ^ shr7; σ1(w[t-2]) = rotr19 ^ rotr61 ^ shr6
      const xh = w[2 * (t - 15)], xl = w[2 * (t - 15) + 1]
      const s0h = ((xh >>> 1) | (xl << 31)) ^ ((xh >>> 8) | (xl << 24)) ^ (xh >>> 7)
      const s0l = ((xl >>> 1) | (xh << 31)) ^ ((xl >>> 8) | (xh << 24)) ^ ((xl >>> 7) | (xh << 25))
      const yh = w[2 * (t - 2)], yl = w[2 * (t - 2) + 1]
      const s1h = ((yh >>> 19) | (yl << 13)) ^ ((yl >>> 29) | (yh << 3)) ^ (yh >>> 6)
      const s1l = ((yl >>> 19) | (yh << 13)) ^ ((yh >>> 29) | (yl << 3)) ^ ((yl >>> 6) | (yh << 26))
      const lo = (s0l >>> 0) + (s1l >>> 0) + w[2 * (t - 16) + 1] + w[2 * (t - 7) + 1]
      w[2 * t + 1] = lo
      w[2 * t] = (s0h >>> 0) + (s1h >>> 0) + w[2 * (t - 16)] + w[2 * (t - 7)] + Math.floor(lo / 0x100000000)
    }
    const h = this.h
    let ah = h[0], al = h[1], bh = h[2], bl = h[3], ch = h[4], cl = h[5], dh = h[6], dl = h[7]
    let eh = h[8], el = h[9], fh = h[10], fl = h[11], gh = h[12], gl = h[13], hh = h[14], hl = h[15]
    for (let t = 0; t < 80; t++) {
      // Σ1(e) = rotr14 ^ rotr18 ^ rotr41
      const S1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23))
      const S1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23))
      const chh = (eh & fh) ^ (~eh & gh)
      const chl = (el & fl) ^ (~el & gl)
      const t1l = hl + (S1l >>> 0) + (chl >>> 0) + K512[2 * t + 1] + w[2 * t + 1]
      const t1h = hh + (S1h >>> 0) + (chh >>> 0) + K512[2 * t] + w[2 * t] + Math.floor(t1l / 0x100000000)
      // Σ0(a) = rotr28 ^ rotr34 ^ rotr39
      const S0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25))
      const S0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25))
      const mjh = (ah & bh) ^ (ah & ch) ^ (bh & ch)
      const mjl = (al & bl) ^ (al & cl) ^ (bl & cl)
      const t2l = (S0l >>> 0) + (mjl >>> 0)
      const t2h = (S0h >>> 0) + (mjh >>> 0) + Math.floor(t2l / 0x100000000)
      hh = gh
      hl = gl
      gh = fh
      gl = fl
      fh = eh
      fl = el
      const nel = dl + (t1l >>> 0)
      eh = (dh + t1h + Math.floor(nel / 0x100000000)) >>> 0
      el = nel >>> 0
      dh = ch
      dl = cl
      ch = bh
      cl = bl
      bh = ah
      bl = al
      const nal = (t1l >>> 0) + (t2l >>> 0)
      ah = (t1h + t2h + Math.floor(nal / 0x100000000)) >>> 0
      al = nal >>> 0
    }
    const add = (i: number, xh: number, xl: number) => {
      const lo = h[i + 1] + xl
      h[i + 1] = lo
      h[i] = h[i] + xh + Math.floor(lo / 0x100000000)
    }
    add(0, ah, al)
    add(2, bh, bl)
    add(4, ch, cl)
    add(6, dh, dl)
    add(8, eh, el)
    add(10, fh, fl)
    add(12, gh, gl)
    add(14, hh, hl)
  }
  protected result() {
    return hex(this.h)
  }
  override digest() {
    return super.digest(false)
  }
}

/* ───────────── MD5 ───────────── */

const MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21]
const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0)

class Md5 extends BlockHasher {
  private h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]
  private m = new Uint32Array(16)
  constructor() {
    super(64)
  }
  protected compress(b: Uint8Array, off: number) {
    const m = this.m
    for (let i = 0; i < 16; i++) {
      const p = off + i * 4
      m[i] = b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)
    }
    let [a, bb, c, d] = this.h
    for (let i = 0; i < 64; i++) {
      const round = i >> 4
      const f = round === 0 ? (bb & c) | (~bb & d) : round === 1 ? (d & bb) | (~d & c) : round === 2 ? bb ^ c ^ d : c ^ (bb | ~d)
      const g = round === 0 ? i : round === 1 ? (5 * i + 1) & 15 : round === 2 ? (3 * i + 5) & 15 : (7 * i) & 15
      const s = MD5_S[round * 4 + (i & 3)]
      const x = (a + f + MD5_K[i] + m[g]) >>> 0
      a = d
      d = c
      c = bb
      bb = (bb + ((x << s) | (x >>> (32 - s)))) >>> 0
    }
    this.h = [(this.h[0] + a) >>> 0, (this.h[1] + bb) >>> 0, (this.h[2] + c) >>> 0, (this.h[3] + d) >>> 0]
  }
  protected result() {
    return hex(this.h, true)
  }
  override digest() {
    return super.digest(true)
  }
}

export function createHasher(algorithm: HashAlgorithm): Hasher {
  switch (algorithm) {
    case 'SHA-256':
      return new Sha256()
    case 'SHA-1':
      return new Sha1()
    case 'SHA-512':
      return new Sha512()
    default:
      return new Md5()
  }
}

/** Tamaño de cada pedazo que se lee del archivo. */
export const CHUNK = 8 * 1024 * 1024

/**
 * Hash de un archivo de cualquier tamaño, leyéndolo de a pedazos. `onProgress` recibe los bytes
 * leídos; `signal` permite cancelar.
 */
export async function hashBlob(file: Blob, algorithm: HashAlgorithm, onProgress?: (done: number, total: number) => void, signal?: AbortSignal): Promise<string> {
  const h = createHasher(algorithm)
  for (let at = 0; at < file.size; at += CHUNK) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    h.update(new Uint8Array(await file.slice(at, Math.min(file.size, at + CHUNK)).arrayBuffer()))
    onProgress?.(Math.min(file.size, at + CHUNK), file.size)
  }
  return h.digest()
}
