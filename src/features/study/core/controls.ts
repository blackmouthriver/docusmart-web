/**
 * Mejoras propias de la web para el Modo Estudio (W-67): atajos de teclado del
 * lector y el audio silencioso que activa los controles multimedia del sistema
 * (auriculares, pantalla bloqueada), porque la voz del navegador no los activa sola.
 */

export type ReaderKeyAction = 'toggle' | 'prev' | 'next' | 'mark'
type KeyLike = { key: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; target?: { tagName?: string; isContentEditable?: boolean } | null }

/**
 * Qué hace una tecla en Lectura: Espacio lee o pausa, ← → cambian de párrafo, M resalta.
 * No se toma nada mientras se escribe (campos de texto) ni con Ctrl/Cmd/Alt.
 */
export function readerKeyAction(e: KeyLike): ReaderKeyAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null
  const tag = e.target?.tagName?.toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return null
  // Un botón enfocado ya reacciona a Espacio por su cuenta: no se duplica.
  if (e.key === ' ' && tag === 'BUTTON') return null
  switch (e.key) {
    case ' ':
    case 'k':
    case 'K':
      return 'toggle'
    case 'ArrowLeft':
      return 'prev'
    case 'ArrowRight':
      return 'next'
    case 'm':
    case 'M':
      return 'mark'
    default:
      return null
  }
}

/** WAV de silencio (PCM 8 bits, mono) para mantener activa la sesión multimedia. */
export function silentWav(seconds = 1, sampleRate = 8000): Uint8Array {
  const samples = Math.max(1, Math.round(seconds * sampleRate))
  const buf = new Uint8Array(44 + samples)
  const view = new DataView(buf.buffer)
  const ascii = (offset: number, s: string) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true) // tamaño del bloque fmt
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true) // bytes por segundo
  view.setUint16(32, 1, true) // bytes por muestra
  view.setUint16(34, 8, true) // bits por muestra
  ascii(36, 'data')
  view.setUint32(40, samples, true)
  buf.fill(128, 44) // en 8 bits sin signo, 128 es silencio
  return buf
}
