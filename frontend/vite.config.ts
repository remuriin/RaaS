import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Has to come before react(). It reads src/routes and writes src/routeTree.gen.ts.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      // Next.js-style file names: layout.tsx wraps a folder, page.tsx is the page itself
      routeToken: 'layout',
      indexToken: 'page',
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // In development /api goes to the real management API, so the browser only ever sees one origin
      '/api': { target: 'https://rag.remservers.me', changeOrigin: true },
    },
  },
})
