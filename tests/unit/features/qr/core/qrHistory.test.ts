import { describe, expect, it } from 'vitest'
import { MAX_HISTORY, addEntry, parseHistory, previewOf, removeEntry, type QrHistoryEntry } from '../../../../../src/features/qr/core/qrHistory'

const entry = (id: string, payload: string, extra: Partial<QrHistoryEntry> = {}): QrHistoryEntry => ({ id, source: 'created', payload, kind: 'text', at: 1, ...extra })

describe('historial de QR', () => {
  it('agrega primero, sube un QR repetido del mismo origen y respeta el máximo', () => {
    let list = addEntry([], entry('a', 'hola'))
    list = addEntry(list, entry('b', 'chao'))
    list = addEntry(list, entry('c', 'hola'))
    expect(list.map((e) => e.id)).toEqual(['c', 'b'])
    list = addEntry(list, entry('d', 'hola', { source: 'scanned' }))
    expect(list).toHaveLength(3)
    for (let i = 0; i < MAX_HISTORY + 5; i++) list = addEntry(list, entry(`x${i}`, `t${i}`))
    expect(list).toHaveLength(MAX_HISTORY)
    expect(removeEntry(list, list[0].id)).toHaveLength(MAX_HISTORY - 1)
  })

  it('lee lo guardado descartando lo dañado', () => {
    const ok = entry('a', 'hola')
    expect(parseHistory(JSON.stringify([ok, { ...ok, kind: 'otro' }, { ...ok, payload: '' }, null]))).toEqual([ok])
    expect(parseHistory('roto')).toEqual([])
    expect(parseHistory('{}')).toEqual([])
    expect(parseHistory(null)).toEqual([])
  })

  it('la vista previa nunca muestra datos sensibles', () => {
    expect(previewOf({ kind: 'protected', payload: 'PROTECTED:abc' })).toEqual({ kind: 'protected' })
    expect(previewOf({ kind: 'wifi', payload: 'WIFI:T:WPA;S:Casa;P:secreta;;' })).toEqual({ kind: 'wifi', ssid: 'Casa' })
    expect(previewOf({ kind: 'wifi', payload: 'WIFI:T:WPA;S:;P:x;;' })).toEqual({ kind: 'wifi', ssid: null })
    expect(previewOf({ kind: 'contact', payload: 'BEGIN:VCARD\nFN:Ana\nTEL:300\nEND:VCARD' })).toEqual({ kind: 'contact', name: 'Ana' })
    expect(previewOf({ kind: 'contact', payload: 'BEGIN:VCARD\nTEL:300\nEND:VCARD' })).toEqual({ kind: 'contact', name: null })
    expect(previewOf({ kind: 'text', payload: '  hola\n  mundo ' })).toEqual({ kind: 'plain', text: 'hola mundo' })
    expect(previewOf({ kind: 'text', payload: 'x'.repeat(200) }, 10)).toEqual({ kind: 'plain', text: 'xxxxxxxxx…' })
  })
})
