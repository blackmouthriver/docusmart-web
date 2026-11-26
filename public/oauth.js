// Vuelta de la autorización de Google Drive o Dropbox: avisa a la pestaña de
// DocuSmart (mismo origen) y se cierra. El token o el código nunca salen de este sitio.
;(function () {
  var href = location.href
  // No dejar el token en el historial.
  history.replaceState(null, '', location.pathname)
  // Dos vías, la primera que llegue: el canal entre pestañas y la ventana que abrió esta (solo a nuestro origen).
  // En Safari (WebKit), cerrar el canal justo después de enviar puede perder el mensaje: se cierra más tarde.
  var sent = false
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'docusmart-oauth', href: href }, location.origin)
      sent = true
    }
  } catch (e) {
    /* sin acceso a la ventana original: queda el canal */
  }
  var channel = null
  try {
    channel = new BroadcastChannel('docusmart-oauth')
    channel.postMessage({ href: href })
    sent = true
  } catch (e) {
    /* navegador sin BroadcastChannel */
  }
  if (!sent) {
    document.getElementById('msg').textContent = 'Tu navegador no permitió volver a DocuSmart. Cierra esta ventana e inténtalo de nuevo.'
    return
  }
  document.getElementById('msg').textContent = 'Listo. Puedes cerrar esta ventana.'
  setTimeout(function () {
    if (channel) channel.close()
    window.close()
  }, 600)
})()
