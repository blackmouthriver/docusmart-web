/**
 * Barra lateral plegable de la app web: se recuerda en este navegador si el usuario la dejó
 * plegada (solo íconos) o desplegada. Si el almacenamiento está bloqueado, funciona igual sin recordar.
 */
export const SIDEBAR_KEY = 'ds-sidebar'

type Store = Pick<Storage, 'getItem' | 'setItem'> | null | undefined

export function loadCollapsed(store: Store): boolean {
  try {
    return store?.getItem(SIDEBAR_KEY) === 'collapsed'
  } catch {
    return false
  }
}

export function saveCollapsed(store: Store, collapsed: boolean): void {
  try {
    store?.setItem(SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded')
  } catch {
    /* almacenamiento bloqueado: no se recuerda */
  }
}
