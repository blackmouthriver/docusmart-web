// Barrido de herramientas (auditoría de funcionamiento): recorre las 66 herramientas con archivos
// de muestra, buenos y malos, en escritorio y celular, y deja un informe en
// test-results/barrido/. No es parte de la suite normal (es largo):
//
//   npm run build && npx playwright test --config playwright.barrido.config.ts
import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

const CI = !!process.env.CI

export default defineConfig({
  ...base,
  testDir: 'tests/barrido',
  timeout: 120_000,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], ...(CI ? {} : { channel: 'chrome' }) } },
    { name: 'movil', use: { ...devices['Pixel 7'], ...(CI ? {} : { channel: 'chrome' }) } },
  ],
})
