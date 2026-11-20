/**
 * Publicidad de la web (W-90) con Google AdSense. APAGADA mientras los IDs de
 * los bloques estén vacíos: sin IDs no se descarga nada de Google, no se
 * reserva espacio y el aviso de cookies sigue hablando solo de analítica.
 *
 * Para activarla, sigue docs/ANUNCIOS.md: además de poner aquí los IDs hay que
 * abrir la CSP de firebase.json y actualizar la política de privacidad (una
 * prueba falla si se activan los anuncios sin abrir la CSP).
 */
export const ADS_CLIENT = 'ca-pub-1109506701099935'
export const ADS_ORIGIN = 'https://pagead2.googlesyndication.com'
export const ADS_SCRIPT = `${ADS_ORIGIN}/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`

/** Dónde puede ir un anuncio. Nunca en la portada ni en la política de privacidad. */
export type AdPlace = 'tool' | 'hub' | 'app'

/** `data-ad-slot` de cada bloque Display adaptable creado en AdSense. */
export const AD_SLOTS: Record<AdPlace, string> = {
  /** "Herramienta – entre pasos y preguntas" */
  tool: '2392088871',
  /** "Herramientas – entre categorías" */
  hub: '5485156078',
  /** "App web – pie de pantalla" */
  app: '3739783383',
}

export function adsEnabled(slots: Record<AdPlace, string> = AD_SLOTS): boolean {
  return Object.values(slots).some((s) => s.trim() !== '')
}
