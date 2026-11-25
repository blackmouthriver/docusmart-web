import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/calidad-audio/**/*.calidad.ts'], testTimeout: 1_800_000, pool: 'forks' } })
