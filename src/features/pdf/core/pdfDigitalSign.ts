/**
 * Firma digital con certificado (W-141): firma el PDF con el certificado del usuario
 * (.p12/.pfx) en formato PKCS#7 desprendido (adbe.pkcs7.detached), el que validan Adobe
 * Acrobat y la mayoría de lectores. Todo pasa en el navegador: el certificado, su clave y la
 * contraseña nunca salen del equipo ni se guardan.
 *
 * El PDF se guarda con un hueco reservado para la firma (/Contents) y su /ByteRange; se
 * calcula el SHA-256 de todo menos el hueco, se firma con la clave del certificado y la firma
 * se escribe en el hueco.
 */
import forge from 'node-forge'
import { placementToPdf, type Placement } from './pdfSign'
import { PDFArray, PDFDict, PDFHexString, PDFName, PDFNumber, PDFSignature, PDFString, type PDFRef } from 'pdf-lib'
import { loadPdf } from '../../security/core/openPdf'

export type CertInfo = { name: string; issuer: string; email?: string; notBefore: Date; notAfter: Date }
export type Certificate = { key: forge.pki.rsa.PrivateKey; cert: forge.pki.Certificate; chain: forge.pki.Certificate[]; info: CertInfo }

/** `password`: contraseña incorrecta; `nokey`: sin clave RSA utilizable; `format`: no es un .p12/.pfx. */
export class CertError extends Error {
  constructor(readonly code: 'password' | 'nokey' | 'format') {
    super(code)
    this.name = 'CertError'
  }
}

const binary = (b: Uint8Array) => {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return s
}
const fromBinary = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0))

function attr(cert: forge.pki.Certificate, side: 'subject' | 'issuer', ...names: string[]): string | undefined {
  for (const n of names) {
    const a = cert[side].getField(n)
    if (a?.value) return String(a.value)
  }
  return undefined
}

/** Lee el certificado y su clave de un .p12/.pfx con su contraseña. */
export function readCertificate(bytes: Uint8Array, password: string): Certificate {
  let p12: forge.pkcs12.Pkcs12Pfx
  try {
    const asn1 = forge.asn1.fromDer(binary(bytes))
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password)
    } catch (e) {
      throw /password|MAC|decrypt|Invalid/i.test(String((e as Error)?.message)) ? new CertError('password') : new CertError('format')
    }
  } catch (e) {
    throw e instanceof CertError ? e : new CertError('format')
  }
  const keyBags = [...(p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? []), ...(p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ?? [])]
  const key = keyBags.map((b) => b.key).find((k): k is forge.pki.rsa.PrivateKey => !!k && 'n' in k)
  const certs = (p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? []).map((b) => b.cert).filter((c): c is forge.pki.Certificate => !!c)
  if (!key || !certs.length) throw new CertError('nokey')
  // El certificado de la clave (mismo módulo); el resto es la cadena.
  const cert = certs.find((c) => (c.publicKey as forge.pki.rsa.PublicKey).n?.equals(key.n)) ?? certs[0]
  return {
    key,
    cert,
    chain: certs.filter((c) => c !== cert),
    info: {
      name: attr(cert, 'subject', 'CN', 'O') ?? '',
      issuer: attr(cert, 'issuer', 'CN', 'O') ?? '',
      email: attr(cert, 'subject', 'E') ?? (cert.subject.getField({ name: 'emailAddress' })?.value as string | undefined),
      notBefore: cert.validity.notBefore,
      notAfter: cert.validity.notAfter,
    },
  }
}

/** Bytes reservados para la firma (la firma con la cadena de certificados cabe de sobra). */
const SIG_BYTES = 16384
const BYTE_RANGE_PLACEHOLDER = 9999999999

export type SignOptions = {
  reason?: string
  location?: string
  /** Rectángulo visible de la firma (página en base 0, en puntos del PDF); sin él, firma invisible. */
  rect?: { page: number; x: number; y: number; width: number; height: number }
  /** O la posición de la firma dibujada (fracciones de la página vista, como en Firmar PDF). */
  placement?: Placement
  date?: Date
}

/** Firma el PDF con el certificado. Devuelve el PDF firmado. */
export async function signWithCertificate(bytes: ArrayBuffer | Uint8Array, cert: Certificate, opts: SignOptions = {}): Promise<Uint8Array> {
  const doc = await loadPdf(bytes)
  const ctx = doc.context
  const date = opts.date ?? new Date()
  if (opts.placement && !opts.rect) {
    const pg = doc.getPage(opts.placement.page)
    opts = { ...opts, rect: { page: opts.placement.page, ...placementToPdf(opts.placement, pg.getCropBox(), pg.getRotation().angle) } }
  }
  const pageIndex = opts.rect?.page ?? 0
  const page = doc.getPage(pageIndex)

  const sig = ctx.obj({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange: [0, BYTE_RANGE_PLACEHOLDER, BYTE_RANGE_PLACEHOLDER, BYTE_RANGE_PLACEHOLDER],
    Contents: PDFHexString.of('0'.repeat(SIG_BYTES * 2)),
    M: PDFString.fromDate(date),
    ...(cert.info.name ? { Name: PDFString.of(cert.info.name) } : {}),
    ...(opts.reason ? { Reason: PDFString.of(opts.reason) } : {}),
    ...(opts.location ? { Location: PDFString.of(opts.location) } : {}),
  })
  const sigRef = ctx.register(sig)
  const r = opts.rect
  const rect = r ? [r.x, r.y, r.x + r.width, r.y + r.height] : [0, 0, 0, 0]
  // Apariencia vacía: lo visible (la firma dibujada) ya está en la página.
  const ap = ctx.register(ctx.stream('', { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, Math.max(0, rect[2] - rect[0]), Math.max(0, rect[3] - rect[1])] }))
  const existing = doc.getForm().getFields().filter((f) => f instanceof PDFSignature).length
  const widget = ctx.obj({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    Rect: rect,
    V: sigRef,
    T: PDFString.of(`Firma ${existing + 1}`),
    F: 4,
    P: page.ref,
    AP: { N: ap },
  })
  const widgetRef = ctx.register(widget)
  const annots = page.node.lookup(PDFName.of('Annots'))
  if (annots instanceof PDFArray) annots.push(widgetRef)
  else page.node.set(PDFName.of('Annots'), ctx.obj([widgetRef]))
  const acro = doc.catalog.lookup(PDFName.of('AcroForm'))
  const form = acro instanceof PDFDict ? acro : ctx.obj({})
  if (!(acro instanceof PDFDict)) doc.catalog.set(PDFName.of('AcroForm'), ctx.register(form))
  const fields = form.lookup(PDFName.of('Fields'))
  if (fields instanceof PDFArray) fields.push(widgetRef)
  else form.set(PDFName.of('Fields'), ctx.obj([widgetRef as PDFRef]))
  form.set(PDFName.of('SigFlags'), PDFNumber.of(3))

  // Sin object streams, para encontrar el hueco y el ByteRange en el archivo.
  const pdf = await doc.save({ useObjectStreams: false })
  const text = new TextDecoder('latin1').decode(pdf)
  const holder = `/Contents <${'0'.repeat(SIG_BYTES * 2)}>`
  const at = text.lastIndexOf(holder)
  if (at < 0) throw new Error('No se pudo preparar la firma.')
  const start = at + '/Contents '.length
  const end = start + SIG_BYTES * 2 + 2
  const range = [0, start, end, pdf.length - end]
  const rangeRe = new RegExp(`/ByteRange\\s*\\[\\s*0\\s+${BYTE_RANGE_PLACEHOLDER}\\s+${BYTE_RANGE_PLACEHOLDER}\\s+${BYTE_RANGE_PLACEHOLDER}\\s*\\]`)
  const m = rangeRe.exec(text)
  if (!m) throw new Error('No se pudo preparar la firma.')
  const value = `/ByteRange [${range.join(' ')}]`.padEnd(m[0].length, ' ')
  pdf.set(fromBinary(value), m.index)

  // Firma PKCS#7 desprendida del contenido (todo menos el hueco).
  const data = new Uint8Array(range[1] + range[3])
  data.set(pdf.subarray(0, range[1]), 0)
  data.set(pdf.subarray(range[2]), range[1])
  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(binary(data))
  p7.addCertificate(cert.cert)
  for (const c of cert.chain) p7.addCertificate(c)
  p7.addSigner({
    key: cert.key,
    certificate: cert.cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: date as unknown as string },
    ],
  })
  p7.sign({ detached: true })
  const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
  const hex = forge.util.bytesToHex(der)
  if (hex.length > SIG_BYTES * 2) throw new Error('La firma no cabe en el espacio reservado.')
  pdf.set(fromBinary(hex.padEnd(SIG_BYTES * 2, '0')), start + 1)
  return pdf
}

export type SignatureCheck = { name: string; signedAt?: Date; intact: boolean; coversWholeFile: boolean }

/**
 * Verifica las firmas del PDF: que el contenido firmado no cambió (el hash coincide) y que la
 * firma corresponde a la clave del certificado. No comprueba la confianza en el emisor.
 */
/**
 * La firma (DER) sin el relleno de ceros del hueco reservado. Se lee su largo de la propia
 * cabecera DER: quitar los ceros del final cortaba la firma cuando sus últimos bytes eran 00
 * (pasaba en ~1 de cada 40 firmas y una firma buena salía como inválida).
 */
export function signatureDer(bytes: string): string {
  if (bytes.charCodeAt(0) !== 0x30 || bytes.length < 2) return bytes
  const first = bytes.charCodeAt(1)
  if (first < 0x80) return bytes.slice(0, 2 + first)
  const n = first & 0x7f
  if (n === 0 || n > 4 || bytes.length < 2 + n) return bytes
  let len = 0
  for (let i = 0; i < n; i++) len = len * 256 + bytes.charCodeAt(2 + i)
  return bytes.slice(0, 2 + n + len)
}

export function verifySignatures(pdf: Uint8Array): SignatureCheck[] {
  const text = new TextDecoder('latin1').decode(pdf)
  const out: SignatureCheck[] = []
  const re = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g
  for (let m; (m = re.exec(text)); ) {
    const [a, b, c, d] = m.slice(1).map(Number)
    const hex = text.slice(b + 1, c - 1)
    let intact = false
    let name = ''
    let signedAt: Date | undefined
    try {
      const data = new Uint8Array(b + d)
      data.set(pdf.subarray(a, a + b), 0)
      data.set(pdf.subarray(c, c + d), b)
      const md = forge.md.sha256.create()
      md.update(binary(data))
      const p7 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(signatureDer(forge.util.hexToBytes(hex.length % 2 ? hex + '0' : hex)))) as forge.pkcs7.PkcsSignedData & {
        rawCapture: { authenticatedAttributes: forge.asn1.Asn1[]; signature: string }
      }
      const cert = p7.certificates[0]
      name = attr(cert, 'subject', 'CN', 'O') ?? ''
      const attrs = p7.rawCapture.authenticatedAttributes
      let digestOk = false
      for (const at of attrs) {
        const oid = forge.asn1.derToOid((at.value as forge.asn1.Asn1[])[0].value as string)
        const val = ((at.value as forge.asn1.Asn1[])[1].value as forge.asn1.Asn1[])[0]
        if (oid === forge.pki.oids.messageDigest) digestOk = val.value === md.digest().getBytes()
        if (oid === forge.pki.oids.signingTime) signedAt = forge.asn1.utcTimeToDate(val.value as string)
      }
      // La firma es sobre el SET de atributos firmados (DER).
      const set = forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SET, true, attrs)
      const attrMd = forge.md.sha256.create()
      attrMd.update(forge.asn1.toDer(set).getBytes())
      const sigOk = (cert.publicKey as forge.pki.rsa.PublicKey).verify(attrMd.digest().getBytes(), p7.rawCapture.signature)
      intact = digestOk && sigOk
    } catch {
      intact = false
    }
    out.push({ name, signedAt, intact, coversWholeFile: c + d === pdf.length })
  }
  return out
}
