// Vuelta de la autorización de Google Drive o Dropbox: avisa a la pestaña de
// DocuSmart (mismo origen) y se cierra. El token o el código nunca salen de este sitio.
;(function () {
  var href = location.href
  // No dejar el token en el historial.
  history.replaceState(null, '', location.pathname)
  try {
    var channel = new BroadcastChannel('docusmart-oauth')
    channel.postMessage({ href: href })
    channel.close()
  } catch (e) {
    document.getElementById('msg').textContent = 'Tu navegador no permitió volver a DocuSmart. Cierra esta ventana e inténtalo de nuevo.'
    return
  }
  document.getElementById('msg').textContent = 'Listo. Puedes cerrar esta ventana.'
  setTimeout(function () { window.close() }, 400)
})()
