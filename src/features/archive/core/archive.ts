/**
 * Compresor y extractor de archivos con 7-Zip compilado a WebAssembly
 * (7z-wasm, LGPL + restricción unRAR). Todo ocurre en el navegador.
 *
 * - Crear: ZIP o 7Z, con contraseña AES-256 opcional (en 7Z también se
 *   cifran los nombres de los archivos).
 * - Extraer: ZIP, RAR, 7Z, TAR, GZ, BZ2, XZ y TAR.GZ (en dos pasos).
 * - No se pueden CREAR archivos .rar: el formato es propietario y su licencia
 *   lo prohíbe. 7Z es la alternativa libre.
 *
 * Cada operación usa una instancia nueva del módulo (un programa de
 * Emscripten no puede ejecutar `main` dos veces); el .wasm queda en caché.
 */
import { unzipSync } from 'fflate'
import { tr } from '../../../shared/i18n/translate'

interface SevenZipFS {
  mkdir: (p: string) => void
  writeFile: (p: string, d: Uint8Array) => void
  readFile: (p: string) => Uint8Array
  readdir: (p: string) => string[]
  stat: (p: string) => { mode: number }
  isDir: (mode: number) => boolean
  chdir: (p: string) => void
}
interface SevenZipModule {
  FS: SevenZipFS
  callMain: (args: string[]) => void
}
type Factory = (opts: { locateFile: () => string; print: (s: string) => void; printErr: (s: string) => void }) => Promise<SevenZipModule>

export class WrongArchivePasswordError extends Error {
  constructor() {
    super('Contraseña incorrecta')
    this.name = 'WrongArchivePasswordError'
  }
}

export class ArchiveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArchiveError'
  }
}

export type ArchiveFormat = 'zip' | '7z'
export type ArchiveLevel = 'rapida' | 'normal' | 'maxima'
export type ArchiveInput = { path: string; data: Uint8Array }
export type ArchiveEntry = { path: string; size: number; isDir: boolean; encrypted: boolean }

/** Formatos que se abren (7-Zip lee muchos más que los de uso diario: imágenes de disco, instaladores…). */
export const EXTRACTABLE = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'tbz2', 'txz', 'iso', 'cab', 'wim', 'arj', 'lzh', 'lha', 'z', 'lzma', 'cpio', 'deb', 'rpm', 'zst'] as const
/** Partes de un archivo dividido: .001…, .z01…, .r00… (el selector no admite comodines). */
const VOLUME_EXT = [
  ...Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(3, '0')),
  ...Array.from({ length: 20 }, (_, i) => 'z' + String(i + 1).padStart(2, '0')),
  ...Array.from({ length: 20 }, (_, i) => 'r' + String(i).padStart(2, '0')),
]
export const EXTRACT_ACCEPT = [...EXTRACTABLE, ...VOLUME_EXT].map((e) => '.' + e).join(',')

let wasmUrl = '/7z/7zz.wasm'
/** Solo para pruebas en Node. */
export function setSevenZipWasmUrl(url: string) {
  wasmUrl = url
}

async function instance(messages: string[]): Promise<SevenZipModule> {
  const mod = (await import('7z-wasm')) as unknown as { default: Factory }
  return mod.default({ locateFile: () => wasmUrl, print: (s) => messages.push(s), printErr: (s) => messages.push(s) })
}

// Con "-p" vacío 7-Zip intenta pedir la clave por teclado (no hay en el navegador).
// Sin contraseña se manda un valor aleatorio de relleno: un archivo sin cifrar lo
// ignora y uno cifrado lo rechaza, lo que se traduce en pedir la clave.
function placeholderPassword() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')
}
const passwordArg = (password: string) => `-p${password || placeholderPassword()}`

const SEVEN_Z_SIGNATURE = [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]
const AES_CODER_ID = [0x06, 0xf1, 0x07, 0x01]

/**
 * ¿Es un 7Z con la cabecera (los nombres) cifrada? La cabecera codificada va al
 * final del archivo y declara el códec AES (06 F1 07 01).
 */
export function hasEncrypted7zHeader(data: Uint8Array): boolean {
  if (data.length < 32 || SEVEN_Z_SIGNATURE.some((b, i) => data[i] !== b)) return false
  const tail = data.subarray(Math.max(0, data.length - 512))
  for (let i = 0; i + AES_CODER_ID.length <= tail.length; i++) {
    if (AES_CODER_ID.every((b, j) => tail[i + j] === b)) return true
  }
  return false
}

/** `archive`: el comprimido sobre el que se trabaja, para interpretar una caída de 7-Zip. */
function run(z: SevenZipModule, args: string[], messages: string[], archive?: Uint8Array) {
  let crashed = false
  try {
    z.callMain(args)
  } catch (e) {
    // ExitStatus: el resultado real se decide leyendo los mensajes.
    // Un número es una excepción interna de C++ de 7-Zip: pasa, por ejemplo,
    // con un 7Z de nombres cifrados y la clave incorrecta, DESPUÉS de avisar
    // "Wrong password". Por eso primero se revisan los mensajes.
    if (typeof e === 'number') crashed = true
    else if (typeof (e as { status?: number })?.status !== 'number') throw e
  }
  const text = messages.join('\n')
  if (/Wrong password|Cannot open encrypted archive|Data Error in encrypted file/i.test(text)) throw new WrongArchivePasswordError()
  if (crashed) {
    // Con un 7Z de nombres cifrados y la clave incorrecta, 7-Zip se cae antes de
    // escribir "Wrong password": la causa se deduce del propio archivo.
    if (archive && hasEncrypted7zHeader(archive)) throw new WrongArchivePasswordError()
    throw new ArchiveError(tr('libErr.archProcess'))
  }
  return text
}

/** Ruta segura dentro del archivo: sin "..", sin raíz y con "/" como separador. */
export function safeEntryPath(path: string): string {
  const parts = path
    .replace(/\\/g, '/')
    .split('/')
    .filter((p) => p && p !== '.' && p !== '..')
    // eslint-disable-next-line no-control-regex
    .map((p) => p.replace(/[\u0000-\u001f:*?"<>|]/g, '_'))
  return parts.join('/') || 'archivo'
}

function mkdirp(fs: SevenZipFS, dir: string) {
  let cur = ''
  for (const part of dir.split('/').filter(Boolean)) {
    cur += '/' + part
    try {
      fs.mkdir(cur)
    } catch {
      /* ya existe */
    }
  }
}

/** El formato ZIP no define cómo guardar letras fuera del inglés en la contraseña: 7-Zip las rechaza. */
export const isZipSafePassword = (password: string) => /^[ -~]+$/.test(password)
const LEVEL_FLAG: Record<ArchiveLevel, string> = { rapida: '-mx=1', normal: '-mx=5', maxima: '-mx=9' }

export async function createArchive(
  files: ArchiveInput[],
  opts: { format: ArchiveFormat; level?: ArchiveLevel; password?: string },
): Promise<Uint8Array> {
  return (await createArchiveParts(files, opts))[0].data
}

/** Tamaños de parte más usados (límites de adjuntos del correo), en MB. */
export const VOLUME_SIZES = [10, 20, 25] as const

/**
 * Crea el archivo; con `volumeBytes`, dividido en partes de ese tamaño ("nombre.zip.001",
 * ".002"…), para mandarlo en varios correos (W-146.10). Sin dividir, una sola parte.
 */
export async function createArchiveParts(
  files: ArchiveInput[],
  opts: { format: ArchiveFormat; level?: ArchiveLevel; password?: string; volumeBytes?: number },
): Promise<ArchivePart[]> {
  if (files.length === 0) throw new ArchiveError(tr('libErr.archAddOne'))
  if (opts.password && opts.format === 'zip' && !isZipSafePassword(opts.password)) {
    throw new ArchiveError(tr('arch.zipKeyHint'))
  }
  const messages: string[] = []
  const z = await instance(messages)
  mkdirp(z.FS, '/in')
  const names = new Set<string>()
  for (const f of files) {
    let path = safeEntryPath(f.path)
    // Nombres repetidos: "foto.jpg", "foto (2).jpg"…
    for (let n = 2; names.has(path); n++) path = path.replace(/(\.[^./]+)?$/, ` (${n})$1`)
    names.add(path)
    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
    if (dir) mkdirp(z.FS, '/in/' + dir)
    z.FS.writeFile('/in/' + path, f.data)
  }
  z.FS.chdir('/in')
  const top = [...new Set([...names].map((p) => p.split('/')[0]))]
  const args = ['a', `-t${opts.format}`, LEVEL_FLAG[opts.level ?? 'normal'], '-y']
  if (opts.password) {
    args.push(`-p${opts.password}`)
    args.push(opts.format === 'zip' ? '-mem=AES256' : '-mhe=on')
  }
  const out = `/salida.${opts.format}`
  const volume = opts.volumeBytes && opts.volumeBytes > 0 ? Math.max(64 * 1024, Math.floor(opts.volumeBytes)) : 0
  if (volume) args.push(`-v${volume}b`)
  const text = run(z, [...args, out, ...top], messages)
  try {
    if (!volume) return [{ name: `salida.${opts.format}`, data: z.FS.readFile(out) }]
    const names = z.FS.readdir('/').filter((n) => n.startsWith(`salida.${opts.format}.`)).sort()
    // Si todo entra en una parte, se entrega como archivo común (sin ".001").
    if (names.length === 1) return [{ name: `salida.${opts.format}`, data: z.FS.readFile('/' + names[0]) }]
    if (!names.length) throw new Error('sin partes')
    return names.map((n) => ({ name: n, data: z.FS.readFile('/' + n) }))
  } catch {
    throw new ArchiveError(/ERROR/i.test(text) ? tr('libErr.archCreate') : tr('libErr.archNoOutput'))
  }
}

/** Una parte de un archivo dividido (además de la primera). */
export type ArchivePart = { name: string; data: Uint8Array }

/** Escribe el archivo (y sus otras partes, con sus nombres, para que 7-Zip las encuentre). */
function writeArchive(z: SevenZipModule, name: string, data: Uint8Array, parts: readonly ArchivePart[] = []) {
  const clean = (n: string) => '/' + safeEntryPath(n).replace(/\//g, '_')
  for (const part of parts) z.FS.writeFile(clean(part.name), part.data)
  const path = clean(name)
  z.FS.writeFile(path, data)
  return path
}

/** Lista el contenido. Con 7Z de nombres cifrados hace falta la contraseña. */
export async function listArchive(name: string, data: Uint8Array, password = '', parts: readonly ArchivePart[] = []): Promise<ArchiveEntry[]> {
  const windows = !parts.length ? legacyZip(data) : null
  if (windows) return windows.map((e) => ({ path: e.path.replace(/\/$/, ''), size: e.size, isDir: e.isDir, encrypted: e.encrypted }))
  const messages: string[] = []
  const z = await instance(messages)
  const path = writeArchive(z, name, data, parts)
  const text = run(z, ['l', '-slt', passwordArg(password), path], messages, data)
  if (/Can not open the file as archive|Cannot open the file as archive|is not archive/i.test(text)) {
    throw new ArchiveError(tr('libErr.archInvalid'))
  }
  // Bloques "Clave = Valor" separados por líneas vacías; el primero es el propio archivo.
  const blocks = text.split(/\n\s*\n/).map((b) => Object.fromEntries(b.split('\n').map((l) => l.split(' = ')).filter((kv) => kv.length === 2)))
  return blocks
    .filter((b) => b.Path && b.Path !== path && b.Path !== path.slice(1) && ('Size' in b || 'Folder' in b || 'Attributes' in b))
    .map((b) => ({
      path: b.Path.replace(/\\/g, '/'),
      size: Number(b.Size || 0),
      isDir: b.Folder === '+' || /^D/.test(b.Attributes || ''),
      encrypted: b.Encrypted === '+',
    }))
}

/** Topes de lo que se descomprime en el navegador (todo queda en memoria). */
export const MAX_EXTRACT_BYTES = 1536 * 1024 * 1024
export const MAX_EXTRACT_FILES = 20_000

export class ArchiveTooBigError extends ArchiveError {
  constructor(
    readonly bytes: number,
    readonly files: number,
  ) {
    super('Archive too big')
    this.name = 'ArchiveTooBigError'
  }
}

/** Falla si lo listado (tamaños declarados) no entra en los topes. */
export function checkExtractLimits(entries: readonly Pick<ArchiveEntry, 'size' | 'isDir'>[], maxBytes = MAX_EXTRACT_BYTES, maxFiles = MAX_EXTRACT_FILES) {
  const files = entries.filter((e) => !e.isDir)
  const bytes = files.reduce((t, e) => t + (Number.isFinite(e.size) && e.size > 0 ? e.size : 0), 0)
  if (bytes > maxBytes || files.length > maxFiles) throw new ArchiveTooBigError(bytes, files.length)
}

/** Una carpeta vacía va como una entrada con "/" al final y sin datos (W-146.10). */
export const isFolderEntry = (f: ArchiveInput) => f.path.endsWith('/') && f.data.length === 0

function collect(fs: SevenZipFS, dir: string, prefix = '', acc = { bytes: 0, files: 0 }): ArchiveInput[] {
  const out: ArchiveInput[] = []
  for (const name of fs.readdir(dir)) {
    if (name === '.' || name === '..') continue
    const full = `${dir}/${name}`
    const rel = prefix ? `${prefix}/${name}` : name
    if (fs.isDir(fs.stat(full).mode)) {
      const inside = collect(fs, full, rel, acc)
      out.push(...(inside.length ? inside : [{ path: rel + '/', data: new Uint8Array() }]))
    }
    else {
      const data = fs.readFile(full)
      acc.bytes += data.length
      acc.files++
      if (acc.bytes > MAX_EXTRACT_BYTES || acc.files > MAX_EXTRACT_FILES) throw new ArchiveTooBigError(acc.bytes, acc.files)
      out.push({ path: rel, data })
    }
  }
  return out
}

/* ───────────── ZIP de Windows con nombres en CP850 (W-146.10) ───────────── */

/** Los 128 caracteres altos de la página de códigos 850 (la del Explorador de Windows en español). */
const CP850_HIGH =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´\u00ad±‗¾¶§÷¸°¨·¹³²■\u00a0'

/** Bytes de un nombre en CP850 a texto. */
export function decodeCp850(bytes: Uint8Array): string {
  let out = ''
  for (const b of bytes) out += b < 0x80 ? String.fromCharCode(b) : CP850_HIGH[b - 0x80]
  return out
}

export type ZipDirEntry = { path: string; raw: Uint8Array; utf8: boolean; method: number; size: number; isDir: boolean; encrypted: boolean }

/** Las entradas del directorio central de un ZIP (null si no lo es o está dañado). */
export function zipDirectory(data: Uint8Array): ZipDirEntry[] | null {
  if (data.length < 22 || data[0] !== 0x50 || data[1] !== 0x4b) return null
  const v = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let end = -1
  for (let i = data.length - 22; i >= Math.max(0, data.length - 22 - 65535); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      end = i
      break
    }
  }
  if (end < 0) return null
  const count = v.getUint16(end + 10, true)
  let at = v.getUint32(end + 16, true)
  const out: ZipDirEntry[] = []
  for (let n = 0; n < count; n++) {
    if (at + 46 > data.length || v.getUint32(at, true) !== 0x02014b50) return null
    const flags = v.getUint16(at + 8, true)
    const nameLen = v.getUint16(at + 28, true)
    const raw = data.subarray(at + 46, at + 46 + nameLen)
    const utf8 = (flags & 0x0800) !== 0
    const path = utf8 ? new TextDecoder().decode(raw) : decodeCp850(raw)
    out.push({ path, raw, utf8, method: v.getUint16(at + 10, true), size: v.getUint32(at + 24, true), isDir: path.endsWith('/'), encrypted: (flags & 1) !== 0 })
    at += 46 + nameLen + v.getUint16(at + 30, true) + v.getUint16(at + 32, true)
  }
  return out
}

/**
 * ¿Es un ZIP con nombres en CP850 que 7-Zip en WebAssembly no puede leer? (sin la marca de UTF-8
 * y con letras fuera del inglés). Solo si se puede abrir aquí: sin cifrar y guardado o con Deflate.
 */
export function legacyZip(data: Uint8Array): ZipDirEntry[] | null {
  const entries = zipDirectory(data)
  if (!entries?.some((e) => !e.utf8 && e.raw.some((b) => b >= 0x80))) return null
  if (entries.some((e) => e.encrypted || (e.method !== 0 && e.method !== 8))) return null
  return entries
}

/** Abre un ZIP de Windows con fflate y le pone los nombres bien (de CP850 a texto). */
function extractLegacyZip(data: Uint8Array, entries: ZipDirEntry[]): ArchiveInput[] {
  checkExtractLimits(entries)
  // fflate lee los nombres sin la marca de UTF-8 como latin1: un carácter por byte.
  const byLatin1 = new Map(entries.map((e) => [e.utf8 ? e.path : String.fromCharCode(...e.raw), e.path]))
  const files = unzipSync(data)
  return Object.entries(files).map(([name, bytes]) => {
    const path = byLatin1.get(name) ?? name
    return path.endsWith('/') ? { path: safeEntryPath(path) + '/', data: new Uint8Array() } : { path: safeEntryPath(path), data: bytes }
  })
}

/* ───────────── Archivos en varias partes (W-146.10) ───────────── */

/**
 * De un grupo de archivos elegidos, cuál es la parte principal (la que se abre) y cuáles las
 * demás: "x.7z.001" (y .002…), "x.zip" con "x.z01"…, "x.part1.rar" (y part2…), "x.rar" con "x.r00"….
 * null si no forman un archivo dividido.
 */
export function splitVolumes(names: readonly string[]): { main: string; others: string[] } | null {
  if (names.length < 2) return null
  const lower = names.map((n) => n.toLowerCase())
  const pick = (i: number) => ({ main: names[i], others: names.filter((_, j) => j !== i) })
  const stems = new Set(lower.map((n) => n.replace(/(\.part\d+\.rar|\.\d{3}|\.z\d{2}|\.zip|\.r\d{2}|\.rar)$/, '')))
  if (stems.size !== 1) return null
  let i = lower.findIndex((n) => /\.0*1$/.test(n) && /\.\d{3}$/.test(n))
  if (i >= 0) return pick(i)
  i = lower.findIndex((n) => /\.part0*1\.rar$/.test(n))
  if (i >= 0) return pick(i)
  if (lower.some((n) => /\.z\d{2}$/.test(n))) {
    i = lower.findIndex((n) => n.endsWith('.zip'))
    if (i >= 0) return pick(i)
  }
  if (lower.some((n) => /\.r\d{2}$/.test(n))) {
    i = lower.findIndex((n) => n.endsWith('.rar'))
    if (i >= 0) return pick(i)
  }
  return null
}

/**
 * Extrae todo el contenido. Un .tar.gz/.tgz se abre en dos pasos: si el
 * resultado es un único .tar, también se extrae.
 */
export async function extractArchive(name: string, data: Uint8Array, password = '', depth = 0, parts: readonly ArchivePart[] = []): Promise<ArchiveInput[]> {
  // ZIP del Explorador de Windows con tildes o eñes: 7-Zip en WebAssembly no lo lee (W-146.10).
  const windows = !parts.length ? legacyZip(data) : null
  if (windows) return extractLegacyZip(data, windows)
  // Antes de descomprimir: los tamaños declarados no pueden superar lo que cabe en memoria ("bomba ZIP").
  let listed: ArchiveEntry[] | null = null
  try {
    listed = await listArchive(name, data, password, parts)
  } catch (e) {
    if (e instanceof WrongArchivePasswordError) throw e
    /* sin lista (formato que no la da): se controla al recoger los archivos */
  }
  if (listed) checkExtractLimits(listed)
  const messages: string[] = []
  const z = await instance(messages)
  const path = writeArchive(z, name, data, parts)
  const text = run(z, ['x', passwordArg(password), '-y', '-o/x', path], messages, data)
  if (/Can not open the file as archive|Cannot open the file as archive|is not archive/i.test(text)) {
    throw new ArchiveError(tr('libErr.archInvalid'))
  }
  let files: ArchiveInput[]
  try {
    files = collect(z.FS, '/x')
  } catch (e) {
    if (e instanceof ArchiveTooBigError) throw e
    files = []
  }
  // .tar.gz: un nivel más (con tope, por si un .tar trae otro .tar adentro una y otra vez).
  if (files.length === 1 && /\.tar$/i.test(files[0].path) && depth < 2) return extractArchive(files[0].path, files[0].data, '', depth + 1)
  // Si la parte principal está pero faltan otras, 7-Zip lo dice así.
  if (files.length === 0 && /Unexpected end of archive|There are some data after the end|Missing volume/i.test(text)) throw new ArchiveError(tr('libErr.archMissingPart'))
  if (files.length === 0 && /ERROR/i.test(text)) throw new ArchiveError(tr('libErr.archExtract'))
  return files
}
