/**
 * Arrastrar y soltar para ordenar listas (W-146.1): Unir PDFs y Reordenar páginas.
 * Funciona con mouse, dedo y lápiz (pointer events, sin librerías) desde un agarre, y con
 * teclado: en el agarre, las flechas mueven el elemento un lugar.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

type Drag = { from: number; over: number }

export function useSortable(count: number, onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<Drag | null>(null)
  // El último estado del arrastre, para leerlo en los eventos sin esperar a que React vuelva a dibujar.
  const current = useRef<Drag | null>(null)
  const set = (d: Drag | null) => {
    current.current = d
    setDrag(d)
  }

  const indexAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-sort-index]')
    return el ? Number(el.getAttribute('data-sort-index')) : null
  }

  /** Props del agarre de cada elemento. */
  const handle = (i: number) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      set({ from: i, over: i })
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = current.current
      if (!d) return
      // Cerca del borde de la ventana, la página se desplaza para llegar a lo que no se ve.
      const edge = 56
      if (e.clientY < edge) window.scrollBy(0, -16)
      else if (e.clientY > window.innerHeight - edge) window.scrollBy(0, 16)
      const over = indexAt(e.clientX, e.clientY)
      if (over !== null && over !== d.over) set({ ...d, over })
    },
    onPointerUp: () => {
      const d = current.current
      if (d && d.over !== d.from) onMove(d.from, d.over)
      set(null)
    },
    onPointerCancel: () => set(null),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const step = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : 0
      if (!step) return
      e.preventDefault()
      const to = i + step
      if (to >= 0 && to < count) onMove(i, to)
    },
  })

  /** Props del elemento que se mueve (para saber sobre cuál está el puntero y marcarlo). */
  const item = (i: number) => ({
    'data-sort-index': i,
    'data-dragging': drag?.from === i || undefined,
    'data-drop-target': (drag && drag.over === i && drag.from !== i) || undefined,
  })

  return { handle, item, dragging: drag !== null }
}
