// Fondo animado de DocuSmart Web (W-89), como DocuSmartAnimatedBackground.kt de la app:
// formas con el degradado del color de acento que derivan detrás del contenido, más
// perceptibles que en la app (pedido del usuario): recorridos amplios y destellos que pulsan.
// Decorativo: no recibe toques ni lo leen los lectores de pantalla. Se apaga en Ajustes
// (html[data-anim-bg="off"]) y queda quieto con "reducir movimiento" (ver app.css).
export function AnimatedBackground() {
  return (
    <div className="anim-bg" aria-hidden="true">
      <i className="ab-a" />
      <i className="ab-b" />
      <i className="ab-c" />
      <i className="ab-d" />
      <i className="ab-spark" />
      <i className="ab-spark2" />
    </div>
  )
}
