import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
      'process.env': {},
      'import.meta.env.TL_API_KEY': JSON.stringify(env.TL_API_KEY)
    }
  }
})
