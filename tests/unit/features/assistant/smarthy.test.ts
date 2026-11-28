import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  FLASH_MS,
  SMARTHY_POSES,
  TALK_STEP_MS,
  busyPoseFor,
  fabPose,
  fabReduce,
  flash,
  initialFab,
  panelPose,
  smarthySrc,
  talkDuration,
  talkPose,
} from '../../../../src/features/assistant/core/smarthy'

describe('poses de Smarthy', () => {
  it('cada pose tiene su imagen en public/smarthy', () => {
    for (const p of SMARTHY_POSES) {
      expect(smarthySrc(p)).toBe(`/smarthy/${p}.webp`)
      expect(existsSync(resolve('public', 'smarthy', `${p}.webp`)), p).toBe(true)
    }
  })

  it('pose de «trabajando» según la herramienta, en español, inglés y rutas de la app', () => {
    expect(busyPoseFor('firmar-pdf')).toBe('sign')
    expect(busyPoseFor('sign-pdf')).toBe('sign')
    expect(busyPoseFor('#/pdf/editar')).toBe('sign')
    expect(busyPoseFor('ocr-pdf')).toBe('idea')
    expect(busyPoseFor('#/estudio')).toBe('idea')
    expect(busyPoseFor('word-a-pdf')).toBe('convert')
    expect(busyPoseFor('pdf-to-excel')).toBe('convert')
    expect(busyPoseFor('unir-pdf')).toBe('scan')
    expect(busyPoseFor()).toBe('scan')
  })
})

describe('botón flotante', () => {
  it('reposo, saludo con el mouse y guiño pasajero', () => {
    expect(fabPose(initialFab, { now: 0 })).toBe('idle')
    expect(fabPose(initialFab, { now: 0, hover: true })).toBe('wave')
    const s = flash(initialFab, 'curious', 0)
    expect(fabPose(s, { now: FLASH_MS.curious - 1 })).toBe('curious')
    expect(fabPose(s, { now: FLASH_MS.curious + 1 })).toBe('idle')
  })

  it('trabaja mientras haya procesos y nunca baja de cero', () => {
    let s = fabReduce(initialFab, 'busy-start', 0)
    s = fabReduce(s, 'busy-start', 0)
    expect(fabPose(s, { now: 0, tool: 'firmar-pdf' })).toBe('sign')
    s = fabReduce(s, 'busy-end', 0)
    expect(fabPose(s, { now: 0 })).toBe('scan')
    s = fabReduce(fabReduce(s, 'busy-end', 0), 'busy-end', 0)
    expect(s.busy).toBe(0)
    expect(fabPose(s, { now: 0, hover: true })).toBe('wave')
  })

  it('éxito y error ganan a «trabajando» y duran lo suyo', () => {
    const busy = fabReduce(initialFab, 'busy-start', 0)
    const ok = fabReduce(busy, 'success', 100)
    expect(fabPose(ok, { now: 100 + FLASH_MS.success - 1 })).toBe('success')
    expect(fabPose(ok, { now: 100 + FLASH_MS.success + 1 })).toBe('scan')
    const bad = fabReduce(initialFab, 'error', 0)
    expect(fabPose(bad, { now: FLASH_MS.error - 1, hover: true })).toBe('error')
    expect(fabPose(bad, { now: FLASH_MS.error + 1 })).toBe('idle')
  })
})

describe('panel', () => {
  it('habla según el largo, alternando gestos', () => {
    expect(talkDuration(0)).toBe(1200)
    expect(talkDuration(10_000)).toBe(4500)
    expect(talkPose(0)).toBe('talk')
    expect(talkPose(TALK_STEP_MS)).toBe('point')
    expect(talkPose(TALK_STEP_MS * 4)).toBe('talk')
    expect(talkPose(-5)).toBe('talk')
  })

  it('prioridad: habla > piensa > escucha > error > saluda > reposo', () => {
    const talk = { from: 0, until: 1000 }
    expect(panelPose({ now: 10, talk, thinking: true, listening: true })).toBe('talk')
    expect(panelPose({ now: 2000, talk, thinking: true, listening: true })).toBe('idea')
    expect(panelPose({ now: 0, listening: true, greeting: true })).toBe('listen')
    expect(panelPose({ now: 0, error: true, greeting: true })).toBe('error')
    expect(panelPose({ now: 0, greeting: true })).toBe('wave')
    expect(panelPose({ now: 0 })).toBe('idle')
  })
})
