// Ciclo de los diálogos de la app (Ajustes, DocuSmart Desktop): al cerrar salen animados y luego se
// desmontan; Esc cierra; el foco entra al diálogo y vuelve a donde estaba al cerrar.
import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../platform/motion'

export function useDialog(close: () => void, focusSelector = 'button') {
  const panel = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)
  const onClose = useCallback(() => {
    setClosing(true)
    setTimeout(close, prefersReducedMotion() ? 0 : 200)
  }, [close])

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>(focusSelector)?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('keydown', onKey)
      before?.focus?.()
    }
  }, [onClose, focusSelector])

  return { panel, closing, onClose }
}
