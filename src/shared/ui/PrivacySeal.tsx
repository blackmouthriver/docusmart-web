import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { useT } from '../i18n/I18n'
import { connectivityNote, isOfflineReady, onOfflineReady } from '../platform/pwa'

/**
 * Sello de privacidad de cada herramienta (W-112): el archivo se procesa en el dispositivo y nunca se sube.
 * Si la app instalada ya funciona sin conexión, o no hay red ahora mismo, lo dice al lado (solo cuando es cierto).
 */
export function PrivacySeal() {
  const { t } = useT()
  const [online, setOnline] = useState(() => navigator.onLine)
  const [offlineReady, setOfflineReady] = useState(() => isOfflineReady())

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    const stop = onOfflineReady(() => setOfflineReady(isOfflineReady()))
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      stop()
    }
  }, [])

  const note = connectivityNote(online, offlineReady)
  return (
    <p className="privacy-seal" role="note">
      <Icon name="shield" />
      <span>{t('privacy.seal')}</span>
      {note === 'ready' && <span className="privacy-seal-extra">{t('privacy.offlineReady')}</span>}
      {note === 'offline' && <span className="privacy-seal-extra">{t('privacy.offlineNow')}</span>}
    </p>
  )
}
