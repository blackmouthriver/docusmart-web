/**
 * Abrir un PDF con pdf-lib aunque traiga restricciones.
 *
 * Muchos PDF (extractos de banco, facturas, documentos oficiales y los que DocuSmart protege en
 * modo "Solo restricciones") están cifrados sin contraseña de apertura: cualquiera los abre, pero
 * llevan permisos como "no imprimir". pdf-lib se niega a cargar cualquier PDF cifrado y las
 * herramientas decían "Este PDF tiene contraseña" aunque no la tuviera.
 *
 * Aquí, solo cuando pdf-lib dice que está cifrado, se descifra con qpdf sin contraseña (lo mismo
 * que hace un lector al abrirlo). Si de verdad pide una contraseña para abrirse, se sigue avisando
 * que la tiene. Los PDF normales no pasan por qpdf.
 */
import { EncryptedPDFError, PDFDocument, type LoadOptions } from 'pdf-lib'
import { QPDF_ERROR, runQpdf } from '../infra/qpdf'

/** Un PDF que pide contraseña para abrirse (el mensaje lo reconoce errorMessage). */
export class LockedPdfError extends Error {
  constructor() {
    super('Encrypted PDF: a password is required to open it')
    this.name = 'LockedPdfError'
  }
}

const toBytes = (b: ArrayBuffer | Uint8Array) => (b instanceof Uint8Array ? b : new Uint8Array(b))
const isEncryptedError = (e: unknown) => e instanceof EncryptedPDFError || (e instanceof Error && /is encrypted/i.test(e.message))

/**
 * Los bytes del PDF sin el cifrado de solo restricciones. Si no estaba cifrado, devuelve los
 * mismos bytes; si pide contraseña para abrirse, lanza LockedPdfError.
 */
export async function withoutRestrictions(bytes: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const input = toBytes(bytes)
  const r = await runQpdf(['--decrypt', '{in}', '{out}'], input)
  if (r.code === QPDF_ERROR || !r.output) {
    if (r.messages.length === 0 || r.messages.some((m) => /password/i.test(m))) throw new LockedPdfError()
    throw new Error(r.messages[0] ?? 'qpdf')
  }
  return r.output
}

/** PDFDocument.load que también abre los PDF con restricciones (sin contraseña de apertura). */
export async function loadPdf(bytes: ArrayBuffer | Uint8Array, options?: LoadOptions): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, options)
  } catch (e) {
    if (!isEncryptedError(e)) throw e
    let plain: Uint8Array
    try {
      plain = await withoutRestrictions(bytes)
    } catch (err) {
      // Si qpdf no pudo (no cargó, sin conexión la primera vez…), se queda el error original de
      // "cifrado": nunca peor que antes.
      throw err instanceof LockedPdfError ? err : e
    }
    return PDFDocument.load(plain, options)
  }
}

/** Qué tan protegido está: sin cifrar, solo con restricciones (se abre sin contraseña) o con contraseña de apertura. */
export type PdfLock = 'none' | 'restrictions' | 'password'

export async function pdfLock(bytes: ArrayBuffer | Uint8Array): Promise<PdfLock> {
  const doc = await PDFDocument.load(toBytes(bytes), { ignoreEncryption: true, updateMetadata: false })
  if (!doc.isEncrypted) return 'none'
  try {
    await withoutRestrictions(bytes)
    return 'restrictions'
  } catch (e) {
    if (e instanceof LockedPdfError) return 'password'
    throw e
  }
}
