// Estado y navegación compartidos. Vive aparte de App.tsx para que las
// pantallas no importen App (App importa las pantallas: evita el ciclo).
import { createContext, useContext } from 'react'

// ── Navegación por hash: #/seccion/sub ───────────────────────────────
export type Route = { section: string; sub?: string }

export function parseHash(): Route {
  const [section = '', sub] = location.hash.replace(/^#\/?/, '').split('/')
  return { section, sub }
}

export function go(section: string, sub?: string) {
  location.hash = '/' + section + (sub ? '/' + sub : '')
}

// ── Archivo abierto en el visor y avisos (compartidos entre pantallas) ─
export type AppState = { openFile: File | null; setOpenFile: (f: File | null) => void; toast: (msg: string) => void }
export const AppContext = createContext<AppState | null>(null)

export const useApp = () => {
  const c = useContext(AppContext)
  if (!c) throw new Error('useApp fuera de App')
  return c
}
