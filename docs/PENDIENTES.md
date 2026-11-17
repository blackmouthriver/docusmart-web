# Pendientes tuyos (para revisar juntos)

Cosas que solo puedes hacer tú (cuentas, consolas, decisiones). Cuando quieras las revisamos una por una: yo te guío paso a paso y hago la parte de código. Actualizado: 17 de noviembre de 2026.

Leyenda: 🔑 = requiere entrar a una cuenta tuya · 🤔 = decisión · ⏱️ = minutos que toma, aproximado.

## 1. Para activar funciones nuevas de DocuSmart Web

| # | Qué | Por qué | Cómo / qué me pasas | ⏱️ |
|---|---|---|---|---|
| 1 | 🔑 **ID de cliente OAuth de Google** (W-45) | Activa el botón **Guardar en Google Drive** (el código ya está en producción, oculto) | Google Cloud Console → proyecto de Firebase → *Pantalla de consentimiento OAuth* (permiso `drive.file`, enlace a la política `https://docusmart.online/privacidad`) → *Credenciales* → *ID de cliente OAuth* tipo **Aplicación web**, origen `https://docusmart.online`, redirección `https://docusmart.online/oauth`. Me pasas el **ID de cliente** (es público, no es secreto) | 15 |
| 2 | 🔑 **App de Dropbox** (W-46) | Activa el botón **Guardar en Dropbox** | dropbox.com/developers → *Create app* → *Scoped access* → **App folder** → nombre "DocuSmart" → pestaña *Permissions*: `files.content.write` → *Redirect URIs*: `https://docusmart.online/oauth`. Me pasas la **App key** (pública; el *App secret* no hace falta) | 10 |
| 3 | 🤔 **Enlace y código QR para compartir** (W-47) | Abrir el resultado en otro celular con un enlace o un QR | Implica **subir el archivo** (cifrado de extremo a extremo, se borra a las 24 h), plan Blaze de Firebase y cambiar la promesa "tus archivos no salen del navegador". Alternativa sin guardar nada: transferencia directa entre dos dispositivos abiertos a la vez. Decides si vale la pena | — |

## 2. Configuración pendiente de la web

| # | Qué | Por qué | ⏱️ |
|---|---|---|---|
| 4 | 🔑 **Google Search Console** (W-05): verificar el dominio con un registro TXT en Hostinger y enviar `sitemap.xml` | Que Google indexe las 31 páginas de herramientas | 15 |
| 5 | 🔑 Restringir la **API key web de Firebase** (W-06) a `docusmart.online`, `www` y `docusmart-8904e.web.app` (sin tocar las claves Android) | Que nadie más use la clave desde otro sitio | 5 |
| 6 | 🔑 Borrar la **cuenta de servicio sobrante** `github-action-…` (W-07), la que dice "Sin claves" | Limpieza de seguridad en Google Cloud | 3 |
| 7 | 🔑 **Hostinger** (W-08): verificación en dos pasos, bloqueo de transferencia del dominio y DNSSEC | Proteger el dominio | 10 |
| 8 | 🔑 **Play Console → Sitio web** = `https://docusmart.online` y confirmar en AdMob que `app-ads.txt` sale "Autorizado" (W-09) | AdMob paga mejor con app-ads.txt verificado | 5 |

## 3. App Android (DocuSmart)

| # | Qué | Por qué | ⏱️ |
|---|---|---|---|
| 9 | 🤔 **Oferta de 7 días gratis** de la suscripción en Play Console | La dejaste para "la próxima versión". No requiere código: se crea en Play Console sobre el plan base y se suma al trial automático de 3 días. Conviene decidir con datos de conversión | 10 |
| 10 | 🤔 **Limpiar el repo de la app** (W-25): carpeta `website/`, rama local `claude/sitio-web` y `docusmart-web.zip` | Son copias viejas de la landing; solo espera tu OK y lo hago yo | 1 (tu OK) |
| 11 | 🔑 Revisar que la **política de privacidad** que enlaza la ficha de Play sea `https://docusmart.online/privacidad` | La política web se actualizó el 17-nov (guardar en Drive/Dropbox y compartir); si Play apunta a otra copia, quedaría desactualizada | 3 |

## 4. Ideas en pausa (cuando quieras retomarlas)

- **QR por Wi-Fi** en la app (abrir una imagen o documento en otro celular): se prototipó y se revirtió a tu pedido.
- **PowerPoint a PDF en la web**: no es viable conservar el diseño en el navegador; sigue solo en la app.
