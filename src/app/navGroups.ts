/**
 * Grupos desplegables de la barra lateral (W-145): una sola categoría (o Modo Estudio) abierta a
 * la vez, como un acordeón. Funciones puras para probarlas sin la interfaz.
 */
export type OpenGroups<T extends string> = ReadonlySet<T>

/** Abre `id` y cierra los demás; si ya era el único abierto, devuelve el mismo conjunto. */
export function openOnly<T extends string>(open: OpenGroups<T>, id: T): OpenGroups<T> {
  return open.size === 1 && open.has(id) ? open : new Set([id])
}

/** Tocar un grupo: si está abierto se cierra; si no, se abre y se cierran los demás. */
export function toggleGroup<T extends string>(open: OpenGroups<T>, id: T): OpenGroups<T> {
  return open.has(id) ? new Set([...open].filter((x) => x !== id)) : new Set([id])
}
