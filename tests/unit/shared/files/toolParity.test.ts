import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Contrato de paridad web <-> app Android.
// `toolParity.json` declara, por cada herramienta con página propia, si la app Android la tiene.
// La app guarda una copia (`app/src/test/resources/web-tool-parity.json`) y su prueba falla si
// WebToolLinks y esa copia no coinciden. Aqui se exige que NINGUNA herramienta nueva de la web
// quede sin declarar: asi nadie agrega una herramienta sin decidir que pasa con la app.
const read = (path: string) => JSON.parse(readFileSync(resolve(import.meta.dirname, '../../../..', path), 'utf-8'))
const slugs = Object.keys(read('src/shared/files/toolPageSlugs.json'))
const parity = read('src/shared/files/toolParity.json') as {
  version: number
  estados: Record<string, string>
  herramientas: Record<string, { app: string }>
}

describe('contrato de paridad con la app Android', () => {
  it('declara exactamente las herramientas que tienen pagina en la web', () => {
    const declared = Object.keys(parity.herramientas)
    expect(slugs.filter((s) => !declared.includes(s)), 'herramientas sin declarar en toolParity.json').toEqual([])
    expect(declared.filter((s) => !slugs.includes(s)), 'declaradas pero sin pagina en la web').toEqual([])
  })

  it('usa solo estados conocidos', () => {
    const known = Object.keys(parity.estados)
    const unknown = Object.entries(parity.herramientas).filter(([, v]) => !known.includes(v.app))
    expect(unknown).toEqual([])
  })

  it('tiene version del formato', () => {
    expect(parity.version).toBe(1)
  })
})
