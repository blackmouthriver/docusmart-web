import { afterEach, describe, expect, it, vi } from 'vitest'

const BASE = 'https://docusmart.online/unir-pdf'

async function load() {
  vi.resetModules()
  vi.stubGlobal('location', { href: BASE })
  return import('./trustedTypes')
}

afterEach(() => vi.unstubAllGlobals())

describe('isAllowedScriptUrl', () => {
  it('permite scripts del propio dominio y de Google Tag Manager', async () => {
    const { isAllowedScriptUrl } = await load()
    expect(isAllowedScriptUrl('/assets/pdf.worker.min-abc.mjs', BASE)).toBe(true)
    expect(isAllowedScriptUrl('https://docusmart.online/assets/x.js', BASE)).toBe(true)
    expect(isAllowedScriptUrl('https://www.googletagmanager.com/gtag/js?id=G-X', BASE)).toBe(true)
    expect(isAllowedScriptUrl('blob:https://docusmart.online/1234-5678', BASE)).toBe(true)
  })

  it('bloquea otros orígenes, blobs ajenos, data: y javascript:', async () => {
    const { isAllowedScriptUrl } = await load()
    expect(isAllowedScriptUrl('https://evil.example/x.js', BASE)).toBe(false)
    expect(isAllowedScriptUrl('https://docusmart.online.evil.example/x.js', BASE)).toBe(false)
    expect(isAllowedScriptUrl('blob:https://evil.example/1234', BASE)).toBe(false)
    expect(isAllowedScriptUrl('data:text/javascript,alert(1)', BASE)).toBe(false)
    expect(isAllowedScriptUrl('javascript:alert(1)', BASE)).toBe(false)
    expect(isAllowedScriptUrl('http://[::1', BASE)).toBe(false)
  })
})

describe('installTrustedTypesPolicy', () => {
  it('no hace nada en navegadores sin Trusted Types', async () => {
    vi.stubGlobal('trustedTypes', undefined)
    await expect(load()).resolves.toBeDefined()
  })

  it('crea la política "default" que rechaza HTML y código y filtra URLs de scripts', async () => {
    const createPolicy = vi.fn()
    vi.stubGlobal('trustedTypes', { createPolicy })
    await load()
    expect(createPolicy).toHaveBeenCalledTimes(1)
    const [name, rules] = createPolicy.mock.calls[0]
    expect(name).toBe('default')
    expect(() => rules.createHTML('<img src=x onerror=alert(1)>')).toThrow(TypeError)
    expect(() => rules.createScript('alert(1)')).toThrow(TypeError)
    expect(rules.createScriptURL('/assets/a.js')).toBe('/assets/a.js')
    expect(() => rules.createScriptURL('https://evil.example/x.js')).toThrow(TypeError)
  })

  it('no crea una segunda política si ya existe una por defecto', async () => {
    const createPolicy = vi.fn()
    vi.stubGlobal('trustedTypes', { createPolicy, defaultPolicy: {} })
    await load()
    expect(createPolicy).not.toHaveBeenCalled()
  })
})
