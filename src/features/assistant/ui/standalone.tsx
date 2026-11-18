// Monta el panel del asistente (React) en el contenedor del botón flotante. Se descarga recién al
// abrir el asistente, así las páginas sin React (portada, privacidad…) no lo cargan de entrada.
import { createRoot } from 'react-dom/client'
import { parseHash } from '../../../app/state'
import { AssistantPanel } from './AssistantPanel'

export function mountPanel(host: HTMLElement, props: { lang: string; context?: string; inApp?: boolean; onClose: () => void }): () => void {
  const root = createRoot(host)
  // En la app, el contexto sale de la pantalla abierta en este momento.
  const route = props.inApp ? parseHash() : undefined
  root.render(<AssistantPanel lang={props.lang} context={props.context} inApp={props.inApp} section={route?.section} sub={route?.sub} onClose={props.onClose} />)
  return () => root.unmount()
}
