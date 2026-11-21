// Firmar PDF con certificado digital (W-141): firma visible + firma PKCS#7 con un .p12 de
// prueba generado aquí (autofirmado, no es de nadie).
import { Buffer } from 'node:buffer'
import { generateKeyPairSync } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import forge from 'node-forge'
import { expect, makePdf, test } from './helpers'
import { verifySignatures } from '../../src/features/pdf/core/pdfDigitalSign'

function testP12(password: string): Buffer {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const key = forge.pki.privateKeyFromPem(privateKey.export({ type: 'pkcs1', format: 'pem' }).toString())
  const cert = forge.pki.createCertificate()
  cert.publicKey = forge.pki.setRsaPublicKey(key.n, key.e)
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date(Date.now() - 86400000)
  cert.validity.notAfter = new Date(Date.now() + 365 * 86400000)
  cert.setSubject([{ name: 'commonName', value: 'Ana Prueba' }])
  cert.setIssuer([{ name: 'commonName', value: 'CA de prueba DocuSmart' }])
  cert.sign(key, forge.md.sha256.create())
  return Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(key, [cert], password, { algorithm: '3des' })).getBytes(), 'binary')
}

test('firma visible y firma digital con certificado .p12', async ({ page }) => {
  await page.goto('/firmar-pdf')
  const tool = page.locator('#tool')
  await tool.locator('input[type=file]').first().setInputFiles({ name: 'contrato.pdf', mimeType: 'application/pdf', buffer: makePdf(1) })
  await tool.getByRole('button', { name: 'Escribir' }).click()
  await tool.getByLabel('Tu nombre').fill('Ana Prueba')
  await tool.getByRole('button', { name: 'Usar esta firma' }).click()

  await tool.getByLabel('Firmar también con mi certificado digital (.p12 o .pfx)').check()
  await tool.locator('input[type=file][accept*=".p12"]').setInputFiles({ name: 'ana.p12', mimeType: 'application/x-pkcs12', buffer: testP12('clave-de-prueba') })
  const password = tool.getByLabel('Contraseña del certificado')
  await password.fill('incorrecta')
  await tool.getByRole('button', { name: 'Abrir certificado' }).click()
  await expect(tool.getByText('La contraseña del certificado no es correcta.')).toBeVisible()
  await password.fill('clave-de-prueba')
  await tool.getByRole('button', { name: 'Abrir certificado' }).click()
  await expect(tool.getByText('Titular: Ana Prueba')).toBeVisible()
  await expect(tool.getByText('Emitido por: CA de prueba DocuSmart')).toBeVisible()
  await tool.getByLabel('Motivo de la firma (opcional)').fill('Aprobación del contrato')

  await tool.getByRole('button', { name: 'Firmar PDF' }).click()
  const wait = page.waitForEvent('download')
  await tool.getByRole('button', { name: 'Descargar', exact: true }).click({ timeout: 60_000 })
  const pdf = new Uint8Array(await readFile((await (await wait).path())!))
  const checks = verifySignatures(pdf)
  expect(checks).toHaveLength(1)
  expect(checks[0]).toMatchObject({ name: 'Ana Prueba', intact: true, coversWholeFile: true })
  expect(Buffer.from(pdf).toString('latin1')).toContain('/Reason (Aprobaci')
})
