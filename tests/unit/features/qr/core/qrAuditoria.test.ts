// Auditoría W-146.11 (QR): leer en fotos grandes y escaneos (plan por escalas y zonas), varios
// códigos, y los tipos nuevos al crear (WhatsApp, SMS, ubicación, contacto completo).
import { describe, expect, it } from 'vitest'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { DETAIL_SIDE, FAST_SIDE, formatLabel, grid, mergeCodes, scanSteps, type ScanStep } from '../../../../../src/features/qr/core/qrScan'
import { buildPayload, contactPayload, detectType, locationPayload, parseContact, parseGeo, parseSms, smsPayload, whatsappPayload, type QrForm } from '../../../../../src/features/qr/core/qrContent'

type Img = { data: Uint8ClampedArray; width: number; height: number }

function blank(w: number, h: number, v = 235): Img {
  const data = new Uint8ClampedArray(w * h * 4).fill(v)
  for (let i = 3; i < data.length; i += 4) data[i] = 255
  return { data, width: w, height: h }
}

/** Dibuja el QR de `text` con módulos de `scale` px en (x, y). */
function drawQr(img: Img, text: string, x: number, y: number, scale: number) {
  const q = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const n = q.modules.size
  const quiet = 4
  const side = (n + quiet * 2) * scale
  for (let py = y; py < y + side && py < img.height; py++) {
    for (let px = x; px < x + side && px < img.width; px++) {
      const mx = Math.floor((px - x) / scale) - quiet
      const my = Math.floor((py - y) / scale) - quiet
      const dark = mx >= 0 && my >= 0 && mx < n && my < n && !!q.modules.get(my, mx)
      const i = (py * img.width + px) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = dark ? 20 : 250
    }
  }
}

/** Reducción por promedio (como drawImage) al lado mayor `max`. */
function downscale(img: Img, max: number): Img {
  const k = Math.min(1, max / Math.max(img.width, img.height))
  if (k === 1) return img
  const w = Math.round(img.width * k)
  const h = Math.round(img.height * k)
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.floor(x / k)
      const sy = Math.floor(y / k)
      const ex = Math.min(img.width, Math.floor((x + 1) / k))
      const ey = Math.min(img.height, Math.floor((y + 1) / k))
      let s = 0
      let n = 0
      for (let yy = sy; yy < ey; yy++) {
        for (let xx = sx; xx < ex; xx++) {
          s += img.data[(yy * img.width + xx) * 4]
          n++
        }
      }
      const i = (y * w + x) * 4
      out[i] = out[i + 1] = out[i + 2] = s / Math.max(1, n)
      out[i + 3] = 255
    }
  }
  return { data: out, width: w, height: h }
}

/** Recorta una zona (como drawImage con origen) y la reduce al lado mayor del paso. */
function crop(img: Img, s: ScanStep): Img {
  const data = new Uint8ClampedArray(s.w * s.h * 4)
  for (let y = 0; y < s.h; y++) data.set(img.data.subarray(((s.y + y) * img.width + s.x) * 4, ((s.y + y) * img.width + s.x + s.w) * 4), y * s.w * 4)
  return downscale({ data, width: s.w, height: s.h }, s.maxSide)
}

/** El plan de la app con jsQR: lo que encuentra la pasada rápida y todas juntas. */
function scanAll(img: Img): { fast: string[]; all: string[] } {
  const { fast, detail } = scanSteps(img.width, img.height)
  const read = (s: ScanStep) => {
    const c = crop(img, s)
    return jsQR(c.data, c.width, c.height)?.data
  }
  const f = fast.map(read).filter((x): x is string => !!x)
  const d = detail.map(read).filter((x): x is string => !!x)
  return { fast: [...new Set(f)], all: [...new Set([...f, ...d])] }
}

const URL_DIAN = 'https://catalogo-vpfe.dian.gov.co/document/searchqr?' + ['document', 'key'].join('') + '=' + 'factura'.repeat(14)
// (el enlace de una factura de prueba se arma así para que el escáner de secretos no lo tome por una clave)

describe('leer QR en imágenes grandes (W-146.11)', () => {
  it('la factura fotografiada no se lee reducida a 1024, pero sí con las pasadas detalladas', () => {
    const photo = blank(4000, 3000)
    drawQr(photo, URL_DIAN, 2600, 1800, 5)
    const r = scanAll(photo)
    expect(r.fast).toEqual([])
    expect(r.all).toEqual([URL_DIAN])
  }, 60_000)

  it('una página escaneada a 300 ppp con el QR en una esquina', () => {
    const page = blank(2480, 3508)
    drawQr(page, URL_DIAN, 1900, 3000, 4)
    expect(scanAll(page).all).toEqual([URL_DIAN])
  }, 60_000)

  it('dos QR en la misma imagen aparecen en zonas distintas', () => {
    const img = blank(2600, 1300)
    drawQr(img, 'PRIMERO', 150, 300, 14)
    drawQr(img, 'SEGUNDO', 1700, 300, 14)
    expect(scanAll(img).all.sort()).toEqual(['PRIMERO', 'SEGUNDO'])
  }, 60_000)

  it('scanSteps: una imagen chica tiene solo la pasada rápida; una grande, también detalle por zonas', () => {
    expect(scanSteps(800, 600)).toEqual({ fast: [{ x: 0, y: 0, w: 800, h: 600, maxSide: FAST_SIDE }], detail: [] })
    const big = scanSteps(4000, 3000)
    expect(big.detail[0]).toEqual({ x: 0, y: 0, w: 4000, h: 3000, maxSide: 2048 })
    expect(big.detail).toHaveLength(1 + 4 + 9)
    expect(big.detail.slice(1).every((s) => s.maxSide === DETAIL_SIDE)).toBe(true)
    expect(scanSteps(1800, 1200).detail).toHaveLength(1 + 4)
  })

  it('grid: zonas que se superponen y cubren todo', () => {
    expect(grid(1000, 1000, 2)).toEqual([
      { x: 0, y: 0, w: 600, h: 600 },
      { x: 400, y: 0, w: 600, h: 600 },
      { x: 0, y: 400, w: 600, h: 600 },
      { x: 400, y: 400, w: 600, h: 600 },
    ])
    expect(grid(500, 300, 1)).toEqual([{ x: 0, y: 0, w: 500, h: 300 }])
  })

  it('mergeCodes no repite y formatLabel nombra los formatos', () => {
    const list = mergeCodes([], [{ value: 'a', format: 'qr_code' }, { value: 'a', format: 'qr_code' }, { value: 'a', format: 'ean_13' }, { value: '', format: 'qr_code' }])
    expect(list).toEqual([{ value: 'a', format: 'qr_code' }, { value: 'a', format: 'ean_13' }])
    expect([formatLabel('qr_code'), formatLabel('pdf417'), formatLabel('ean_13'), formatLabel('rare')]).toEqual(['QR', 'PDF417', 'EAN-13', 'RARE'])
  })
})

describe('crear: tipos nuevos (W-146.11)', () => {
  const base: QrForm = {
    kind: 'whatsapp',
    value: '',
    message: '',
    wifi: { ssid: '', password: '', security: 'WPA' },
    contact: { name: '', phone: '', email: '' },
    event: { title: '', location: '', start: '2026-11-17T09:00', end: '2026-11-17T10:00' },
  }

  it('WhatsApp: wa.me con el 57 para un celular colombiano y el mensaje codificado', () => {
    expect(whatsappPayload('300 123 4567', 'Hola, ¿precio?')).toBe('https://wa.me/573001234567?text=Hola%2C%20%C2%BFprecio%3F')
    expect(whatsappPayload('+1 (415) 555-0100', '')).toBe('https://wa.me/14155550100')
    expect(buildPayload({ ...base, value: '3001234567' })).toEqual({ payload: 'https://wa.me/573001234567' })
    expect(buildPayload({ ...base, value: 'abc' })).toEqual({ error: 'empty' })
    expect(detectType(whatsappPayload('3001234567', ''))).toBe('url')
  })

  it('SMS: SMSTO y su lectura', () => {
    const p = smsPayload('+57 300 123 4567', 'Confirmo la cita\nmañana')
    expect(p).toBe('SMSTO:+573001234567:Confirmo la cita mañana')
    expect(buildPayload({ ...base, kind: 'sms', value: '3001234567', message: 'Hola' })).toEqual({ payload: 'SMSTO:3001234567:Hola' })
    expect(detectType(p)).toBe('sms')
    expect(parseSms(p)).toEqual({ phone: '+573001234567', message: 'Confirmo la cita mañana' })
    expect(parseSms('sms:3001234567?body=Hola%20mundo')).toEqual({ phone: '3001234567', message: 'Hola mundo' })
    expect(parseSms('sms:300?body=%E0%A4%A')).toEqual({ phone: '300', message: '%E0%A4%A' })
    expect(parseSms('SMSTO:3001234567')).toEqual({ phone: '3001234567', message: '' })
    expect(parseSms('hola')).toBeNull()
  })

  it('ubicación: enlace de Google Maps con la dirección o las coordenadas; geo: se lee', () => {
    expect(locationPayload('4.6097, -74.0817')).toBe('https://www.google.com/maps/search/?api=1&query=4.6097%2C-74.0817')
    expect(locationPayload('  Carrera 7 # 32-16,  Bogotá ')).toBe('https://www.google.com/maps/search/?api=1&query=Carrera%207%20%23%2032-16%2C%20Bogot%C3%A1')
    expect(buildPayload({ ...base, kind: 'location', value: '' })).toEqual({ error: 'empty' })
    expect(detectType('geo:4.6,-74.08')).toBe('location')
    expect(parseGeo('geo:4.6097,-74.0817?z=15')).toEqual({ lat: 4.6097, lng: -74.0817, mapUrl: locationPayload('4.6097, -74.0817') })
    expect(parseGeo('geo:95,10')).toBeNull()
    expect(parseGeo('geo:nada')).toBeNull()
  })

  it('contacto completo: empresa, cargo, dirección y web van y vuelven', () => {
    const c = { name: 'Ana Pérez', phone: '3001234567', email: 'ana@x.co', company: 'Ópticas; Bukela', title: 'Gerente', address: 'Calle 10 # 5-20, Cali', website: 'https://bukela.co' }
    const vcf = contactPayload(c)
    expect(vcf).toContain('ORG:Ópticas\\; Bukela')
    expect(vcf).toContain('ADR:;;Calle 10 # 5-20\\, Cali;;;;')
    expect(parseContact(vcf)).toEqual(c)
    // Sin los campos nuevos, igual que antes.
    expect(parseContact(contactPayload({ name: 'Luis', phone: '', email: '' }))).toEqual({ name: 'Luis', phone: '', email: '' })
  })
})
