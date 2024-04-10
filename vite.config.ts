import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import BuildInfo from 'vite-plugin-info'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    BuildInfo()
  ],
})
