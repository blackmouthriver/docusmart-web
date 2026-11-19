/**
 * Reglas puras de la publicidad (W-90), sin DOM: qué etiqueta se muestra y
 * cuándo un espacio puede pedir anuncio. Las usa ads.ts (el adaptador del DOM).
 */
import { getConsent } from './analytics'
import { AD_SLOTS, type AdPlace } from './adsConfig'

export const CONSENT_EVENT = 'ds-consent'

const LABELS: Record<string, string> = {
  es: 'Publicidad', en: 'Advertisement', pt: 'Publicidade', de: 'Anzeige', ru: 'Реклама', ja: '広告',
  ko: '광고', zh: '广告', it: 'Pubblicità', fr: 'Publicité', ca: 'Publicitat', eu: 'Publizitatea',
}

export function adLabel(lang: string | null | undefined): string {
  return LABELS[(lang ?? '').toLowerCase().split('-')[0]] ?? LABELS.es
}

export function adAllowed(place: AdPlace, consent = getConsent(), slots = AD_SLOTS): boolean {
  return slots[place].trim() !== '' && consent === 'granted'
}
