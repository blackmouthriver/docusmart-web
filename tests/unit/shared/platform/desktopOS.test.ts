// DocuSmart Desktop en Mac y Linux (W-150): sistema, ayuda por sistema, abrir archivos y atajos con ⌘.
import { describe, expect, it, vi } from 'vitest'
import { desktopOS, handleLaunches } from '../../../../src/shared/platform/pwa'
import { installStep, tipsFor } from '../../../../src/shared/ui/DesktopHelp'
import { openWithTools } from '../../../../src/features/tools/core/nextSteps'
import { clearOpenedFiles, peekOpenedFiles, setOpenedFiles, OPENED_FILES_EVENT } from '../../../../src/shared/files/handoff'
import { withMacKeys } from '../../../../src/shared/i18n/translate'

// Agentes de usuario reales de cada sistema.
const WIN_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
const MAC_FIREFOX = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:133.0) Gecko/20100101 Firefox/133.0'
const LINUX_CHROME = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const UBUNTU_FIREFOX = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0'
const CHROMEBOOK = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

describe('sistema de la computadora', () => {
  it('por el agente de usuario', () => {
    expect(desktopOS(WIN_CHROME)).toBe('windows')
    expect(desktopOS(MAC_SAFARI)).toBe('mac')
    expect(desktopOS(MAC_FIREFOX)).toBe('mac')
    expect(desktopOS(LINUX_CHROME)).toBe('linux')
    expect(desktopOS(UBUNTU_FIREFOX)).toBe('linux')
    expect(desktopOS(CHROMEBOOK)).toBe('chromeos')
    expect(desktopOS(ANDROID)).toBe('other')
    expect(desktopOS(IPAD)).toBe('other')
  })

  it('userAgentData.platform manda cuando existe (Chrome y Edge lo dan)', () => {
    expect(desktopOS(LINUX_CHROME, 'macOS')).toBe('mac')
    expect(desktopOS('', 'Windows')).toBe('windows')
    expect(desktopOS('', 'Linux')).toBe('linux')
    expect(desktopOS('', 'Chrome OS')).toBe('chromeos')
  })
})

describe('ayuda de instalación por sistema', () => {
  it('cómo instalarla depende del navegador; en Firefox, de si es Mac (Safari también sirve)', () => {
    expect(installStep('safari', 'mac')).toBe('desk.step.safari')
    expect(installStep('chrome', 'linux')).toBe('desk.step.chrome')
    expect(installStep('firefox', 'mac')).toBe('desk.step.firefoxMac')
    expect(installStep('firefox', 'linux')).toBe('desk.step.firefox')
  })

  it('al instalar dice dónde queda en ese sistema, salvo en Firefox (no se puede instalar)', () => {
    expect(tipsFor('install', 'chrome', 'mac').map((t) => t.text)).toContain('desk.where.mac')
    expect(tipsFor('install', 'chrome', 'linux').map((t) => t.text)).toContain('desk.where.linux')
    expect(tipsFor('install', 'edge', 'windows').map((t) => t.text)).toContain('desk.where.windows')
    expect(tipsFor('install', 'firefox', 'linux').some((t) => t.title === 'desk.where.title')).toBe(false)
  })

  it('ya instalada: ícono y ancla de cada sistema, y "Abrir con" solo en Chrome y Edge', () => {
    const mac = tipsFor('installed', 'chrome', 'mac').map((t) => t.text)
    expect(mac).toEqual(expect.arrayContaining(['desk.shortcut.mac', 'desk.pin.mac', 'desk.open.text']))
    expect(tipsFor('installed', 'safari', 'mac').map((t) => t.text)).toEqual(expect.arrayContaining(['desk.shortcut.safari', 'desk.pin.mac']))
    expect(tipsFor('installed', 'safari', 'mac').map((t) => t.text)).not.toContain('desk.open.text')
    expect(tipsFor('installed', 'chrome', 'linux').map((t) => t.text)).toEqual(expect.arrayContaining(['desk.shortcut.linux', 'desk.pin.linux']))
    expect(tipsFor('installed', 'edge', 'windows').map((t) => t.text)).toEqual(expect.arrayContaining(['desk.shortcut.edge', 'desk.pin.text', 'desk.open.text']))
    expect(tipsFor('installed', 'chrome', 'chromeos').some((t) => t.title.startsWith('desk.pin'))).toBe(false)
  })
})

describe('abrir archivos con DocuSmart Desktop', () => {
  const f = (name: string, type = '') => ({ name, type })

  it('herramientas según el tipo; varios PDF empiezan por Unir', () => {
    expect(openWithTools([f('a.pdf', 'application/pdf')])[0].key).toBe('pdf/comprimir')
    expect(openWithTools([f('a.pdf'), f('b.pdf')])[0].key).toBe('pdf/unir')
    expect(openWithTools([f('foto.heic')])[0].key).toBe('convertir/img-pdf')
    expect(openWithTools([f('carta.docx')]).map((t) => t.key)).toEqual(['convertir/word-pdf'])
    expect(openWithTools([f('datos.xlsx')]).map((t) => t.key)).toEqual(['convertir/excel-pdf', 'convertir/excel-csv'])
  })

  it('tipos mezclados o desconocidos: ninguna herramienta común', () => {
    expect(openWithTools([f('a.pdf'), f('b.png')])).toEqual([])
    expect(openWithTools([f('c.zip')])).toEqual([])
    expect(openWithTools([])).toEqual([])
  })

  it('todas las herramientas sugeridas existen en el catálogo', () => {
    for (const name of ['a.pdf', 'b.png', 'c.docx', 'd.xlsx']) expect(openWithTools([f(name)]).length).toBeGreaterThan(0)
    expect(openWithTools([f('a.pdf')])).toHaveLength(12)
    expect(openWithTools([f('b.png')])).toHaveLength(10)
  })

  it('los archivos que llegan del sistema quedan esperando y se avisa a la pantalla', async () => {
    const win = new EventTarget() as unknown as Window
    const heard = vi.fn()
    win.addEventListener(OPENED_FILES_EVENT, heard)
    const file = new File(['%PDF'], 'contrato.pdf', { type: 'application/pdf' })
    setOpenedFiles([file], win)
    expect(peekOpenedFiles()).toEqual([file])
    expect(heard).toHaveBeenCalledOnce()
    clearOpenedFiles()
    expect(peekOpenedFiles()).toEqual([])
  })

  it('la cola de lanzamiento entrega los archivos (y sin archivos, sigue llevando a un acceso directo)', async () => {
    let consumer: ((p: { targetURL?: string; files?: Array<{ getFile: () => Promise<File> }> }) => void) | undefined
    const win = { location: { origin: 'https://docusmart.online', hash: '' }, launchQueue: { setConsumer: (c: typeof consumer) => (consumer = c) } } as unknown as Window
    const onFiles = vi.fn()
    handleLaunches(win, onFiles)
    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    consumer!({ files: [{ getFile: async () => file }] })
    await vi.waitFor(() => expect(onFiles).toHaveBeenCalledWith([file]))
    consumer!({ targetURL: 'https://docusmart.online/app/#/qr' })
    expect(win.location.hash).toBe('#/qr')
  })
})

describe('atajos en Mac', () => {
  it('Ctrl y Strg pasan a ⌘; lo demás no cambia', () => {
    const dict = withMacKeys({ 'qr.pasteHint': 'Pega una captura (Ctrl+V).', 'study.notePh': 'Notiz… (Strg + Enter)', 'common.save': 'Guardar' } as never)
    expect(dict).toEqual({ 'qr.pasteHint': 'Pega una captura (⌘+V).', 'study.notePh': 'Notiz… (⌘ + Enter)', 'common.save': 'Guardar' })
  })
})
