import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AD_SLOTS, ADS_ORIGIN, ADS_SCRIPT, adsEnabled } from '../../../../src/shared/platform/adsConfig'
import { adAllowed, adLabel, CONSENT_EVENT } from '../../../../src/shared/platform/adsPolicy'
import { isAllowedScriptUrl, scriptOrigins } from '../../../../src/shared/platform/trustedTypes'
import { LANGS } from '../../../../src/shared/i18n/languages'

const firebase = JSON.parse(readFileSync(resolve(__dirname, '../../../../firebase.json'), 'utf8'))
const csp: string = firebase.hosting.headers
  .find((h: { source: string }) => h.source === '**')
  .headers.find((h: { key: string }) => h.key === 'Content-Security-Policy').value
const directive = (name: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(name + ' ')) ?? ''

const FILLED = { tool: '1234567890', hub: '', app: '' }
const EMPTY = { tool: '', hub: '', app: '' }

describe('anuncios (W-90)', () => {
  it('los IDs de bloque están vacíos o tienen el formato de AdSense (10 dígitos)', () => {
    for (const id of Object.values(AD_SLOTS)) expect(id === '' || /^\d{10}$/.test(id)).toBe(true)
  })

  it('se activan solo cuando hay al menos un ID', () => {
    expect(adsEnabled(EMPTY)).toBe(false)
    expect(adsEnabled({ ...EMPTY, hub: '  ' })).toBe(false)
    expect(adsEnabled(FILLED)).toBe(true)
  })

  it('un espacio necesita su ID y el consentimiento aceptado', () => {
    expect(adAllowed('tool', 'granted', FILLED)).toBe(true)
    expect(adAllowed('tool', 'denied', FILLED)).toBe(false)
    expect(adAllowed('tool', null, FILLED)).toBe(false)
    expect(adAllowed('hub', 'granted', FILLED)).toBe(false)
  })

  it('el evento de consentimiento es el mismo que emite la analítica', () => {
    expect(CONSENT_EVENT).toBe('ds-consent')
  })

  it('la etiqueta "Publicidad" existe en los 12 idiomas y cae al español', () => {
    const labels = new Set(LANGS.map((l) => adLabel(l.code)))
    expect(labels.size).toBe(LANGS.length)
    expect(adLabel('en-GB')).toBe('Advertisement')
    expect(adLabel('xx')).toBe('Publicidad')
    expect(adLabel(null)).toBe('Publicidad')
  })

  it('Trusted Types permite el script de AdSense solo con anuncios activos', () => {
    const base = 'https://docusmart.online/unir-pdf'
    expect(scriptOrigins(false)).not.toContain(ADS_ORIGIN)
    expect(scriptOrigins(true)).toContain(ADS_ORIGIN)
    expect(isAllowedScriptUrl(ADS_SCRIPT, base, false)).toBe(false)
    expect(isAllowedScriptUrl(ADS_SCRIPT, base, true)).toBe(true)
    // Scripts auxiliares de AdSense: verificación de tráfico y mensaje de consentimiento.
    expect(isAllowedScriptUrl('https://ep2.adtrafficquality.google/sodar/x.js', base, true)).toBe(true)
    expect(isAllowedScriptUrl('https://fundingchoicesmessages.google.com/i/x.js', base, true)).toBe(true)
    expect(isAllowedScriptUrl('https://ep2.adtrafficquality.google/sodar/x.js', base, false)).toBe(false)
    expect(isAllowedScriptUrl('https://evil-adtrafficquality.google.example/x.js', base, true)).toBe(false)
    expect(isAllowedScriptUrl('http://ep2.adtrafficquality.google/x.js', base, true)).toBe(false)
  })

  it('la CSP de firebase.json se abre a AdSense si y solo si los anuncios están activos', () => {
    const open = directive('script-src').includes(ADS_ORIGIN)
    expect(open).toBe(adsEnabled())
    if (adsEnabled()) {
      expect(directive('frame-src').split(' ')).toContain('https://tpc.googlesyndication.com')
      expect(directive('frame-src').split(' ')).toContain('https://googleads.g.doubleclick.net')
    } else {
      for (const host of ['googlesyndication.com', 'doubleclick.net', 'adtrafficquality.google']) expect(csp.includes(host)).toBe(false)
    }
  })
})
