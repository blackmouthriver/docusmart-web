import { describe, expect, it } from 'vitest'
import { CHAIN_MAX, OPTIONS, TOOL_OPTIONS, TOOL_SLUGS, actionSchema, redactAction, validateAction, type OptionKey } from '../../../../src/features/assistant/core/actions'

const MB = 1024 * 1024

describe('catálogo de acciones del asistente (W-151.3)', () => {
  it('cada herramienta con opciones existe, y sus opciones y formatos también', () => {
    for (const [tool, opts] of Object.entries(TOOL_OPTIONS)) {
      expect(TOOL_SLUGS.has(tool), tool).toBe(true)
      for (const [key, allowed] of Object.entries(opts)) {
        expect(key in OPTIONS, `${tool}.${key}`).toBe(true)
        const spec = OPTIONS[key as OptionKey]
        if (Array.isArray(allowed)) {
          expect(spec.kind, `${tool}.${key}`).toBe('enum')
          for (const v of allowed) expect((spec as { values: readonly string[] }).values, `${tool}.${key}=${v}`).toContain(v)
        }
      }
    }
  })

  it('abre una herramienta con opciones válidas y las normaliza', () => {
    const r = validateAction({ kind: 'openTool', tool: 'comprimir-pdf', options: { targetSize: '2097152' }, useCurrentFile: true })
    expect(r).toEqual({ ok: true, action: { kind: 'openTool', tool: 'comprimir-pdf', options: { targetSize: 2 * MB }, useCurrentFile: true } })
    expect(validateAction({ kind: 'openTool', tool: 'dividir-pdf', options: { pages: ' 1 - 3 ,5 ' } })).toEqual({ ok: true, action: { kind: 'openTool', tool: 'dividir-pdf', options: { pages: '1-3, 5' } } })
    expect(validateAction({ kind: 'openTool', tool: 'rotar-pdf', options: { angle: 90 } })).toMatchObject({ ok: true, action: { options: { angle: '90' } } })
    // Sin opciones también vale (cualquier herramienta).
    expect(validateAction({ kind: 'openTool', tool: 'unir-pdf' })).toEqual({ ok: true, action: { kind: 'openTool', tool: 'unir-pdf' } })
  })

  it('rechaza herramientas, opciones y valores que no corresponden', () => {
    const bad = (a: unknown) => {
      const r = validateAction(a)
      expect(r.ok, JSON.stringify(a)).toBe(false)
      return r.ok ? [] : r.errors
    }
    expect(bad({ kind: 'openTool', tool: 'borrar-disco' })[0]).toMatch(/herramienta desconocida/)
    expect(bad({ kind: 'openTool', tool: 'unir-pdf', options: { targetSize: MB } })[0]).toMatch(/no acepta/)
    expect(bad({ kind: 'openTool', tool: 'comprimir-pdf', options: { targetSize: 10 } })[0]).toMatch(/fuera de rango/)
    expect(bad({ kind: 'openTool', tool: 'comprimir-pdf', options: { volar: 1 } })[0]).toMatch(/desconocida/)
    expect(bad({ kind: 'openTool', tool: 'dividir-pdf', options: { pages: '5-2' } })[0]).toMatch(/al revés/)
    expect(bad({ kind: 'openTool', tool: 'dividir-pdf', options: { pages: 'todas' } })[0]).toMatch(/páginas/)
    // Formato: solo los que acepta esa herramienta.
    expect(bad({ kind: 'openTool', tool: 'comprimir-imagen', options: { format: 'mp4' } })[0]).toMatch(/no es válido/)
    expect(bad({ kind: 'openTool', tool: 'redimensionar-imagen', options: { percent: 50, width: 800 } })[0]).toMatch(/no se combina/)
    expect(bad({ kind: 'nada' })[0]).toMatch(/desconocido/)
    expect(bad(null)[0]).toMatch(/no es una acción/)
  })

  it('encadena de 2 a 5 pasos y solo el primero usa el archivo abierto', () => {
    const step = (tool: string, extra = {}) => ({ kind: 'openTool', tool, ...extra })
    expect(validateAction({ kind: 'chain', steps: [step('escanear-documento', { useCurrentFile: true }), step('unir-pdf'), step('firmar-pdf')] }).ok).toBe(true)
    expect(validateAction({ kind: 'chain', steps: [step('unir-pdf')] }).ok).toBe(false)
    expect(validateAction({ kind: 'chain', steps: Array.from({ length: CHAIN_MAX + 1 }, () => step('unir-pdf')) }).ok).toBe(false)
    const r = validateAction({ kind: 'chain', steps: [step('unir-pdf'), step('comprimir-pdf', { useCurrentFile: true })] })
    expect(r.ok ? [] : r.errors).toEqual(['chain: solo el primer paso usa el archivo abierto'])
    const inner = validateAction({ kind: 'chain', steps: [step('unir-pdf'), step('comprimir-pdf', { options: { angle: '90' } })] })
    expect(inner.ok ? [] : inner.errors[0]).toMatch(/^paso 2: comprimir-pdf no acepta/)
  })

  it('explica una entrada de la base (si se pasa la lista, debe existir)', () => {
    expect(validateAction({ kind: 'explain', entry: 'privacidad' }, new Set(['privacidad']))).toEqual({ ok: true, action: { kind: 'explain', entry: 'privacidad' } })
    expect(validateAction({ kind: 'explain', entry: 'inventada' }, new Set(['privacidad'])).ok).toBe(false)
  })

  it('la contraseña nunca aparece al mostrar o registrar la acción', () => {
    const r = validateAction({ kind: 'openTool', tool: 'proteger-pdf', options: { password: 'MiClave#2026' } })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const shown = JSON.stringify(redactAction(r.action))
    expect(shown).not.toContain('MiClave')
    expect(shown).toContain('•••')
    // La original no se modifica (la herramienta sí la necesita).
    expect(JSON.stringify(r.action)).toContain('MiClave')
    const chain = validateAction({ kind: 'chain', steps: [{ kind: 'openTool', tool: 'unir-pdf' }, { kind: 'openTool', tool: 'proteger-pdf', options: { password: 'otra-clave' } }] })
    expect(chain.ok && JSON.stringify(redactAction(chain.action))).not.toContain('otra-clave')
  })

  it('el esquema JSON (para la IA del navegador) cubre las herramientas y nunca pide contraseñas', () => {
    const schema = JSON.stringify(actionSchema())
    for (const slug of TOOL_SLUGS) expect(schema).toContain(`"${slug}"`)
    for (const key of Object.keys(OPTIONS).filter((k) => k !== 'password')) expect(schema).toContain(`"${key}"`)
    expect(schema).not.toContain('"password"')
  })
})
