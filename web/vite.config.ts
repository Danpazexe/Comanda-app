import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    // Sem sourcemap no build publicado: o .map expunha o código-fonte inteiro.
    sourcemap: false
  },
  // No build de produção, remove console.* e debugger do bundle.
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined
}))
