import { describe, expect, it } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import forge from 'node-forge'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { CertError, readCertificate, signWithCertificate, verifySignatures } from '../../../../../src/features/pdf/core/pdfDigitalSign'

/** Certificado de prueba autofirmado en un .p12 (generado aquí: no es de nadie). */
function testP12(password: string, algorithm: '3des' | 'aes256' = '3des', days = 365) {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const key = forge.pki.privateKeyFromPem(privateKey.export({ type: 'pkcs1', format: 'pem' }).toString())
  const cert = forge.pki.createCertificate()
  cert.publicKey = forge.pki.setRsaPublicKey(key.n, key.e)
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date(Date.now() - 86400000)
  cert.validity.notAfter = new Date(Date.now() + days * 86400000)
  const attrs = [{ name: 'commonName', value: 'Ana Prueba' }, { name: 'countryName', value: 'CO' }, { name: 'emailAddress', value: 'ana@example.com' }]
  cert.setSubject(attrs)
  cert.setIssuer([{ name: 'commonName', value: 'CA de prueba DocuSmart' }])
  cert.sign(key, forge.md.sha256.create())
  const der = forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(key, [cert], password, { algorithm })).getBytes()
  return Uint8Array.from(der, (c) => c.charCodeAt(0))
}

async function samplePdf(pages = 2) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]).drawText(`Contrato, página ${i + 1}`, { x: 60, y: 760, size: 14, font })
  return doc.save()
}

describe('readCertificate', () => {
  it('lee el titular, el emisor y la vigencia (3DES y AES)', () => {
    for (const alg of ['3des', 'aes256'] as const) {
      const c = readCertificate(testP12('clave-prueba', alg), 'clave-prueba')
      expect(c.info).toMatchObject({ name: 'Ana Prueba', issuer: 'CA de prueba DocuSmart', email: 'ana@example.com' })
      expect(c.info.notAfter.getTime()).toBeGreaterThan(Date.now())
    }
  })

  it('distingue contraseña incorrecta de archivo que no es un certificado', () => {
    const p12 = testP12('clave-prueba')
    expect(() => readCertificate(p12, 'otra')).toThrow(CertError)
    try {
      readCertificate(p12, 'otra')
    } catch (e) {
      expect((e as CertError).code).toBe('password')
    }
    try {
      readCertificate(new TextEncoder().encode('no soy un certificado'), 'x')
    } catch (e) {
      expect((e as CertError).code).toBe('format')
    }
  })
})

describe('signWithCertificate', () => {
  it('firma el PDF: la firma es válida, cubre todo el archivo y se rompe si el archivo cambia', async () => {
    const cert = readCertificate(testP12('clave-prueba'), 'clave-prueba')
    const signed = await signWithCertificate(await samplePdf(), cert, { reason: 'Aprobación', location: 'Bogotá', rect: { page: 1, x: 60, y: 80, width: 180, height: 60 } })
    const checks = verifySignatures(signed)
    expect(checks).toHaveLength(1)
    expect(checks[0]).toMatchObject({ name: 'Ana Prueba', intact: true, coversWholeFile: true })
    expect(checks[0].signedAt).toBeInstanceOf(Date)

    // El PDF sigue abriendo, con el campo de firma en la página indicada.
    const doc = await PDFDocument.load(signed)
    expect(doc.getPageCount()).toBe(2)
    const raw = new TextDecoder('latin1').decode(signed)
    expect(raw).toContain('/SubFilter /adbe.pkcs7.detached')
    expect(raw).toContain('/Reason (Aprobaci')

    // Un byte cambiado dentro del contenido firmado invalida la firma.
    const tampered = signed.slice()
    const i = raw.indexOf('/MediaBox') + 12
    tampered[i] = tampered[i] === 48 ? 49 : 48
    expect(verifySignatures(tampered)[0].intact).toBe(false)
  })

  it('firma invisible (sin rectángulo) y una segunda firma no rompe el formulario', async () => {
    const cert = readCertificate(testP12('clave-prueba'), 'clave-prueba')
    const once = await signWithCertificate(await samplePdf(1), cert)
    expect(verifySignatures(once)[0].intact).toBe(true)
    const twice = await signWithCertificate(once, cert)
    const checks = verifySignatures(twice)
    // Sin actualización incremental, la segunda firma reescribe el archivo: la última es la válida.
    expect(checks.at(-1)).toMatchObject({ intact: true, coversWholeFile: true })
    expect((await PDFDocument.load(twice)).getForm().getFields().length).toBe(2)
  })
})
