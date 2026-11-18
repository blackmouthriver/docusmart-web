// Fondo animado de DocuSmart Web (W-89), como DocuSmartAnimatedBackground.kt de la app:
// formas con el degradado del color de acento que derivan despacio detrás del contenido.
// Decorativo: no recibe toques ni lo leen los lectores de pantalla. Se apaga en Ajustes
// (html[data-anim-bg="off"]) y queda quieto con "reducir movimiento" (ver app.css).
export function AnimatedBackground() {
  return (
    <div className="anim-bg" aria-hidden="true">
      <i className="ab-a" />
      <i className="ab-b" />
      <i className="ab-c" />
      <i className="ab-spark" />
    </div>
  )
}
