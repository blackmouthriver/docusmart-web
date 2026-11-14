/**
 * Comprimir (sin pérdida), proteger, desbloquear y reparar PDF con qpdf.
 * Todo ocurre en el navegador: el archivo nunca sale del equipo.
 */
import { PDFDocument } from 'pdf-lib'
import { QPDF_ERROR, QPDF_OK, QPDF_WARNINGS, runQpdf } from './qpdf'

export class WrongPasswordError extends Error {
  constructor() {
    super('Contraseña incorrecta')
    this.name = 'WrongPasswordError'
  }
}

export class QpdfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QpdfError'
  }
}

const toBytes = (b: ArrayBuffer | Uint8Array) => (b instanceof Uint8Array ? b : new Uint8Array(b))

/** ¿El PDF está cifrado (con contraseña de apertura o solo con restricciones)? */
export async function isEncrypted(bytes: ArrayBuffer | Uint8Array): Promise<boolean> {
  const doc = await PDFDocument.load(toBytes(bytes), { ignoreEncryption: true, updateMetadata: false })
  return doc.isEncrypted
}

export type CompressResult = { bytes: Uint8Array; before: number; after: number; improved: boolean }

/**
 * Compresión sin pérdida: reagrupa objetos, recomprime flujos al máximo y
 * descarta lo que no se usa. No toca la calidad. Si el resultado no es más
 * chico (PDF ya optimizado), devuelve el original.
 */
export async function compressLossless(bytes: ArrayBuffer | Uint8Array): Promise<CompressResult> {
  const input = toBytes(bytes)
  const r = await runQpdf(
    ['{in}', '--object-streams=generate', '--compress-streams=y', '--recompress-flate', '--compression-level=9', '{out}'],
    input,
  )
  if (!r.output) throw new QpdfError('No se pudo comprimir el PDF.')
  const improved = r.output.length < input.length
  return { bytes: improved ? r.output : input, before: input.length, after: improved ? r.output.length : input.length, improved }
}

export type ProtectOptions = {
  /** Contraseña para abrir el PDF. */
  userPassword: string
  /** Contraseña de propietario; si falta se genera una aleatoria para que las restricciones valgan. */
  ownerPassword?: string
  allowPrint?: boolean
  allowCopy?: boolean
  allowModify?: boolean
}

function randomPassword() {
  const b = crypto.getRandomValues(new Uint8Array(18))
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** Cifra con AES-256 (lo que leen Adobe, Chrome, Edge y la app de DocuSmart). */
export async function protect(bytes: ArrayBuffer | Uint8Array, opts: ProtectOptions): Promise<Uint8Array> {
  if (!opts.userPassword) throw new QpdfError('Falta la contraseña.')
  const owner = opts.ownerPassword || randomPassword()
  const perms = [
    `--print=${opts.allowPrint === false ? 'none' : 'full'}`,
    `--modify=${opts.allowModify === false ? 'none' : 'all'}`,
    `--extract=${opts.allowCopy === false ? 'n' : 'y'}`,
  ]
  const r = await runQpdf(['--encrypt', opts.userPassword, owner, '256', ...perms, '--', '{in}', '{out}'], toBytes(bytes))
  if (r.code !== QPDF_OK && r.code !== QPDF_WARNINGS) {
    if (r.code === QPDF_ERROR && r.messages.some((m) => /password/i.test(m))) throw new WrongPasswordError()
    throw new QpdfError('No se pudo proteger el PDF. Si ya tiene contraseña, quítala primero.')
  }
  if (!r.output) throw new QpdfError('No se pudo proteger el PDF.')
  return r.output
}

/** Quita la contraseña y las restricciones. `password` puede ir vacía si el PDF solo tiene restricciones. */
export async function unlock(bytes: ArrayBuffer | Uint8Array, password: string): Promise<Uint8Array> {
  const r = await runQpdf([`--password=${password}`, '--decrypt', '{in}', '{out}'], toBytes(bytes))
  if (r.code === QPDF_ERROR) {
    // qpdf solo distingue el motivo por el mensaje; si no lo capturó, una
    // salida 2 al descifrar casi siempre es contraseña incorrecta.
    if (r.messages.length === 0 || r.messages.some((m) => /password/i.test(m))) throw new WrongPasswordError()
    throw new QpdfError('No se pudo desbloquear el PDF.')
  }
  if (!r.output) throw new QpdfError('No se pudo desbloquear el PDF.')
  return r.output
}

export type RepairResult = { bytes: Uint8Array; hadProblems: boolean }

/**
 * Reconstruye la estructura del PDF (tabla de referencias, trailer, posiciones).
 * Lo hace pdf-lib, que lee el archivo objeto por objeto sin depender de la tabla
 * de referencias; el modo de recuperación de qpdf no funciona en su versión wasm.
 * qpdf solo se usa para diagnosticar si el archivo tenía problemas (`--check`).
 */
export async function repair(bytes: ArrayBuffer | Uint8Array): Promise<RepairResult> {
  const input = toBytes(bytes)
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(input, { ignoreEncryption: true, throwOnInvalidObject: false, updateMetadata: false })
  } catch {
    throw new QpdfError('El archivo está demasiado dañado para recuperarlo.')
  }
  if (doc.isEncrypted) throw new QpdfError('El PDF tiene contraseña: desbloquéalo primero.')
  if (doc.getPageCount() === 0) throw new QpdfError('No se encontraron páginas para recuperar.')
  const check = await runQpdf(['--check', '{in}'], input)
  return { bytes: await doc.save(), hadProblems: check.code !== QPDF_OK }
}
