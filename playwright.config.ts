// Pruebas de punta a punta (W-11): un navegador real contra el build de producción servido con
// `vite preview`, que aplica las mismas cabeceras que Firebase (CSP, Trusted Types…). Así también
// se detecta lo que la CSP bloquearía en el sitio publicado.
//
//   npm run build && npm run test:e2e
//
// En el CI se usa el Chromium de Playwright; en una computadora con Chrome instalado, ese Chrome
// (no hace falta descargar otro navegador).
import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI
const PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : 2,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-ES',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // El Chrome instalado se elige en cada proyecto (no aquí: WebKit no acepta ese canal).
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], ...(CI ? {} : { channel: 'chrome' }) } },
    // En el celular solo las pruebas marcadas @movil (portada, menú y herramientas).
    { name: 'movil', grep: /@movil/, use: { ...devices['Pixel 7'], ...(CI ? {} : { channel: 'chrome' }) } },
    // W-150.3: el motor de Safari (WebKit), para DocuSmart Desktop en Mac. Solo si se pide: WEBKIT=1.
    // En la Mac del CI todo va más lento (modelos de IA, video, PDF grandes): más tiempo y un reintento más.
    ...(process.env.WEBKIT ? [{ name: 'safari', timeout: 90_000, retries: CI ? 2 : 0, use: { ...devices['Desktop Safari'] } }] : []),
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
})
