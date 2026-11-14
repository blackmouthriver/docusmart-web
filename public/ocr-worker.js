// Worker de OCR de DocuSmart.
// La CSP del sitio (con Trusted Types) también rige dentro de los workers, y el
// worker de Tesseract carga su motor con importScripts(): antes de cargarlo se
// instala una política que solo permite scripts de /ocr/ del propio dominio.
'use strict'

if (self.trustedTypes && !self.trustedTypes.defaultPolicy) {
  self.trustedTypes.createPolicy('default', {
    createHTML: function () {
      throw new TypeError('Trusted Types: no se permite HTML como texto en el worker de OCR.')
    },
    createScript: function () {
      throw new TypeError('Trusted Types: no se permite código como texto en el worker de OCR.')
    },
    createScriptURL: function (url) {
      var u = new URL(url, self.location.href)
      if (u.origin === self.location.origin && u.pathname.indexOf('/ocr/') === 0) return url
      throw new TypeError('Trusted Types: script bloqueado en el worker de OCR (' + url + ').')
    },
  })
}

importScripts('/ocr/tesseract-worker.min.js')
