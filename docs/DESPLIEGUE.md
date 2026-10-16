# Seguridad, calidad y despliegue

## Seguridad

- **Cabeceras** (en `firebase.json`): CSP estricta (sin scripts en línea, solo `'self'` + Google Analytics), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (solo cámara, para leer QR), COOP/CORP.
- **Sin recursos de terceros**: las fuentes y los recursos de pdf.js (fuentes estándar, cmaps, wasm) se sirven desde el propio dominio. El motor de JavaScript de PDFs (quickjs) no se incluye.
- `npm run preview` aplica las mismas cabeceras que producción, para detectar en local cualquier bloqueo de la CSP.
- `/.well-known/security.txt` (RFC 9116) con el contacto para reportar vulnerabilidades. Vence el 2027-10-16: renuévalo antes.
- CI: auditoría de dependencias (`npm run audit`), escaneo de secretos con Gitleaks y acciones de GitHub fijadas por SHA. Dependabot actualiza npm (semanal) y las acciones (mensual).

## Calidad: SonarCloud

`sonar-project.properties` usa la organización `blackmouthriver` (la misma de la app), proyecto `blackmouthriver_docusmart-web`. La cobertura sale de `npm run test:coverage` (`coverage/lcov.info`). Las pantallas de React quedan fuera de la cobertura unitaria y se prueban de punta a punta en el navegador.

Para activarlo:

1. En [SonarCloud](https://sonarcloud.io/projects/create) → *Analyze new project* → elige `docusmart-web`.
2. En *Administration → Analysis Method*, desactiva *Automatic Analysis* (el análisis corre desde GitHub Actions).
3. Crea un token (*My Account → Security*) y guárdalo en GitHub como secreto `SONAR_TOKEN` (*Settings → Secrets and variables → Actions*).

Sin el token, el CI avisa y omite el análisis.

## Despliegue: Firebase Hosting + docusmart.online

Cada push a `main` que pasa el CI se publica en Firebase Hosting (proyecto `docusmart-8904e`).

**Una sola vez:**

1. **Cuenta de servicio para GitHub:** en una terminal, dentro del proyecto:
   ```bash
   npx firebase-tools login
   npx firebase-tools init hosting:github
   ```
   Elige el repo `blackmouthriver/docusmart-web`. Responde **No** a sobrescribir `firebase.json` y a crear workflows (ya existen). El asistente crea el secreto `FIREBASE_SERVICE_ACCOUNT_DOCUSMART_8904E`: crea otro con el mismo valor llamado `FIREBASE_SERVICE_ACCOUNT` (o ajusta el nombre en `.github/workflows/ci.yml`).
2. **Secretos de analítica** (opcional): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID` y `VITE_FIREBASE_MEASUREMENT_ID`, en el entorno `produccion` de GitHub.
3. **Dominio:** en Firebase Console → *Hosting → Agregar dominio personalizado* → `docusmart.online` (y luego `www.docusmart.online`, redirigido al principal). Firebase te muestra los registros DNS.
4. **DNS en Hostinger:** en hPanel → *Dominios → docusmart.online → DNS / Nameservers*:
   - Borra los registros `A` y `CNAME` de `@` y `www` que Hostinger crea por defecto (apuntan a su página de estacionamiento).
   - Agrega exactamente los registros que indicó Firebase (un `TXT` de verificación y los `A` para `@`; para `www`, el que indique).
   - La propagación tarda de minutos a 24 h. Firebase emite el certificado HTTPS automáticamente.

**Despliegue manual** (sin esperar al CI):

```bash
npm run build
npx firebase-tools deploy --only hosting
```

**AdMob `app-ads.txt`:** coloca el archivo en `public/app-ads.txt` y quedará en `https://docusmart.online/app-ads.txt`. Luego pon `https://docusmart.online` como sitio web del desarrollador en Play Console.
