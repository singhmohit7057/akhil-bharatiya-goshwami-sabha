import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router-dom') || (id.includes('/react/') && !id.includes('react-i18next'))) {
              return 'vendor-react'
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'vendor-ui'
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n'
            }
            if (id.includes('jspdf')) {
              return 'vendor-pdf'
            }
            if (id.includes('/xlsx/') || id.includes('\\xlsx\\')) {
              return 'vendor-excel'
            }
          }
        },
      },
    },
  },
})
