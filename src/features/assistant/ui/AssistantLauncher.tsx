// Botón flotante del asistente (W-70c). Es liviano: el panel y la base de conocimiento se
// descargan solo cuando se toca por primera vez (no pesan en la carga de la app).
import { Suspense, lazy, useCallback, useRef, useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { useT } from '../../../shared/i18n/I18n'

const AssistantPanel = lazy(() => import('./AssistantPanel').then((m) => ({ default: m.AssistantPanel })))

export function AssistantLauncher({ section, sub }: { section: string; sub?: string }) {
  const { t, lang } = useT()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => {
    setOpen(false)
    button.current?.focus()
  }, [])

  return (
    <>
      <button
        ref={button}
        type="button"
        className={'assistant-fab' + (open ? ' is-open' : '')}
        aria-label={t('assistant.open')}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={t('assistant.open')}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? 'close' : 'chat'} />
      </button>
      {open && (
        <Suspense fallback={null}>
          <AssistantPanel lang={lang} section={section} sub={sub} onClose={close} />
        </Suspense>
      )}
    </>
  )
}
