/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  // Validate required environment variables at build time (skip in test mode)
  if (!env.VITE_API_URL && mode !== 'test') {
    throw new Error('VITE_API_URL environment variable is required for client build')
  }
  
  // Set default for test mode
  if (!env.VITE_API_URL) {
    env.VITE_API_URL = 'http://localhost:3000'
  }
  
  // Validate URL format (skip in test mode)
  if (mode !== 'test') {
    try {
      new URL(env.VITE_API_URL)
    } catch {
      throw new Error(`VITE_API_URL must be a valid URL: ${env.VITE_API_URL}`)
    }
    console.log(`✅ Building client with API URL: ${env.VITE_API_URL}`)
  }
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['tests/e2e/**', 'node_modules/**'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
        },
      },
    },
    build: {
      // Ensure build output is optimized for SWA
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            utils: ['zustand', 'axios']
          }
        }
      }
    },
    define: {
      // Make environment variables available to the client
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
    },
  }
})

