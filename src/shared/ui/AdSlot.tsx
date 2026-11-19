import { useEffect, useRef, useState } from 'react'
import { adAllowed, CONSENT_EVENT, createAdSlot } from '../platform/ads'
import type { AdPlace } from '../platform/adsConfig'

/** Espacio de publicidad de la app web (W-90). No pinta nada sin ID del bloque o sin consentimiento. */
export function AdSlot({ place }: { place: AdPlace }) {
  const [allowed, setAllowed] = useState(() => adAllowed(place))
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => setAllowed(adAllowed(place))
    window.addEventListener(CONSENT_EVENT, sync)
    return () => window.removeEventListener(CONSENT_EVENT, sync)
  }, [place])

  useEffect(() => {
    const el = host.current
    if (!allowed || !el) return
    const slot = createAdSlot(place)
    el.append(slot)
    return () => slot.remove()
  }, [allowed, place])

  return allowed ? <div ref={host} className="ad-host" /> : null
}
