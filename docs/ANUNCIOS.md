# Publicidad en la web (W-90) — cómo activarla

La base ya está en el código y está **apagada**. Mientras `AD_SLOTS` (en
`src/shared/platform/adsConfig.ts`) esté vacío:

- no se descarga nada de Google,
- no se reserva espacio en ninguna página,
- el aviso de cookies sigue hablando solo de analítica,
- la CSP no se abre a AdSense (una prueba lo exige).

## Qué hace cuando se activa

| Lugar | Dónde exactamente | Bloque en AdSense |
|---|---|---|
| Páginas de herramientas (`/unir-pdf`, `/en/merge-pdf`…) | Antes de las preguntas frecuentes, debajo de "Cómo… en 3 pasos" | Herramienta – entre pasos y preguntas |
| `/herramientas` | Después de la tercera categoría | Herramientas – entre categorías |
| App web (`/app/`) | Al pie de cada pantalla. Nunca en el Visor ni en la lectura | App web – pie de pantalla |

En la portada y en la política de privacidad nunca hay anuncios.

Reglas del espacio:
- Lleva la etiqueta visible "Publicidad" en los 12 idiomas.
- Reserva 100 px de alto para que la página no salte.
- Se pide solo cuando está a punto de entrar en pantalla.
- Si AdSense no tiene anuncio, el espacio desaparece.
- Si la persona retira el consentimiento, los espacios se quitan.

**Consentimiento:** los anuncios solo cargan si la persona pulsa "Aceptar" en el aviso. Con anuncios activos, el aviso se titula "Privacidad y cookies" y menciona AdSense. Si pulsa "Rechazar", no se carga nada de Google.

## Pasos para activarla (cuando AdSense apruebe el sitio)

1. **AdSense → Anuncios → Por bloque de anuncios → Display**: crea los 3 bloques adaptables con los nombres de la tabla y copia el `data-ad-slot` de cada uno (10 dígitos).
2. **AdSense → Privacidad y mensajes**: activa el mensaje de RGPD para el EEE, el Reino Unido y Suiza (CMP certificado de Google). Es obligatorio para mostrar anuncios allí.
3. **`adsConfig.ts`**: pon los 3 IDs en `AD_SLOTS`.
4. **`firebase.json` (CSP)**: agrega estos orígenes. La prueba `ads.test.ts` falla si los anuncios están activos y la CSP no está abierta.
   - `script-src`: `https://pagead2.googlesyndication.com https://*.adtrafficquality.google https://tpc.googlesyndication.com`
   - `frame-src` (directiva nueva): `https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://*.adtrafficquality.google`
   - `img-src`: `https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://www.google.com`
   - `connect-src`: `https://pagead2.googlesyndication.com https://*.adtrafficquality.google https://*.doubleclick.net https://www.google.com`
5. **Trusted Types y estilos**: el script de AdSense crea sus propias políticas de Trusted Types e inserta estilos en línea. Antes de fusionar, pruébalo en un canal de vista previa de Firebase (`firebase hosting:channel:deploy anuncios`) y revisa la consola. Si hay bloqueos, agrega a `trusted-types` las políticas que el navegador reporte (con `'allow-duplicates'`) y, solo si hace falta, `'unsafe-inline'` en `style-src`.
6. **Política de privacidad** (`site/privacidad.html`, sección del sitio web, y `legal/` de la app si aplica): agrega el texto de abajo y actualiza la fecha.
7. **Revisión E2E general** y PR.

### Texto para la política de privacidad (borrador)

> **Publicidad (Google AdSense).** Las páginas de herramientas, el listado de herramientas y la app web muestran anuncios de Google AdSense, que mantienen DocuSmart gratis. Solo se cargan si aceptas en el aviso de cookies. En el Espacio Económico Europeo, el Reino Unido y Suiza, Google te pedirá además tu consentimiento con su propio mensaje. Google y sus socios pueden usar cookies e identificadores para mostrar y medir anuncios, según su política: https://policies.google.com/technologies/ads. Puedes cambiar tu decisión en cualquier momento desde "Preferencias de analítica" o configurar los anuncios personalizados en https://adssettings.google.com. **Tus archivos nunca salen de tu navegador:** ni Google ni DocuSmart ven los documentos que procesas.
