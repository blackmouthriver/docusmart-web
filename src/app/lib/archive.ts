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

export const EXTRACTABLE = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'tbz2', 'txz'] as const
export const EXTRACT_ACCEPT = EXTRACTABLE.map((e) => '.' + e).join(',')

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
// Sin contraseña se manda una de relleno: un archivo sin cifrar la ignora y uno
// cifrado responde "Wrong password", que se traduce en pedir la clave.
const NO_PASSWORD = 'docusmart-sin-clave'
const passwordArg = (password: string) => `-p${password || NO_PASSWORD}`

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
    throw new ArchiveError('No se pudo procesar el archivo comprimido.')
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
export const ZIP_PASSWORD_HINT =
  'En ZIP la contraseña solo puede tener letras sin tildes, números y símbolos. Para usar tildes o ñ, elige el formato 7Z.'

const LEVEL_FLAG: Record<ArchiveLevel, string> = { rapida: '-mx=1', normal: '-mx=5', maxima: '-mx=9' }

export async function createArchive(
  files: ArchiveInput[],
  opts: { format: ArchiveFormat; level?: ArchiveLevel; password?: string },
): Promise<Uint8Array> {
  if (files.length === 0) throw new ArchiveError('Agrega al menos un archivo.')
  if (opts.password && opts.format === 'zip' && !isZipSafePassword(opts.password)) {
    throw new ArchiveError(ZIP_PASSWORD_HINT)
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
  const text = run(z, [...args, out, ...top], messages)
  try {
    return z.FS.readFile(out)
  } catch {
    throw new ArchiveError(/ERROR/i.test(text) ? 'No se pudo crear el archivo comprimido.' : 'No se generó el archivo comprimido.')
  }
}

function writeArchive(z: SevenZipModule, name: string, data: Uint8Array) {
  const path = '/' + safeEntryPath(name).replace(/\//g, '_')
  z.FS.writeFile(path, data)
  return path
}

/** Lista el contenido. Con 7Z de nombres cifrados hace falta la contraseña. */
export async function listArchive(name: string, data: Uint8Array, password = ''): Promise<ArchiveEntry[]> {
  const messages: string[] = []
  const z = await instance(messages)
  const path = writeArchive(z, name, data)
  const text = run(z, ['l', '-slt', passwordArg(password), path], messages, data)
  if (/Can not open the file as archive|Cannot open the file as archive|is not archive/i.test(text)) {
    throw new ArchiveError('El archivo no es un comprimido válido o está dañado.')
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

function collect(fs: SevenZipFS, dir: string, prefix = ''): ArchiveInput[] {
  const out: ArchiveInput[] = []
  for (const name of fs.readdir(dir)) {
    if (name === '.' || name === '..') continue
    const full = `${dir}/${name}`
    const rel = prefix ? `${prefix}/${name}` : name
    if (fs.isDir(fs.stat(full).mode)) out.push(...collect(fs, full, rel))
    else out.push({ path: rel, data: fs.readFile(full) })
  }
  return out
}

/**
 * Extrae todo el contenido. Un .tar.gz/.tgz se abre en dos pasos: si el
 * resultado es un único .tar, también se extrae.
 */
export async function extractArchive(name: string, data: Uint8Array, password = ''): Promise<ArchiveInput[]> {
  const messages: string[] = []
  const z = await instance(messages)
  const path = writeArchive(z, name, data)
  const text = run(z, ['x', passwordArg(password), '-y', '-o/x', path], messages, data)
  if (/Can not open the file as archive|Cannot open the file as archive|is not archive/i.test(text)) {
    throw new ArchiveError('El archivo no es un comprimido válido o está dañado.')
  }
  let files: ArchiveInput[]
  try {
    files = collect(z.FS, '/x')
  } catch {
    files = []
  }
  if (files.length === 1 && /\.tar$/i.test(files[0].path)) return extractArchive(files[0].path, files[0].data)
  if (files.length === 0 && /ERROR/i.test(text)) throw new ArchiveError('No se pudo extraer el archivo: puede estar dañado.')
  return files
}
