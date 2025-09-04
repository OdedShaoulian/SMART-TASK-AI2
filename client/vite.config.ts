/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables with precedence: process.env first, then loadEnv
  const fileEnv = loadEnv(mode, process.cwd(), '')
  let apiUrlRaw = (process.env.VITE_API_URL ?? fileEnv.VITE_API_URL ?? '').trim()
  
  // Sanitize the URL: remove wrapping quotes and trailing slashes
  apiUrlRaw = apiUrlRaw.replace(/^['"]|['"]$/g, '').replace(/\/+$/g, '')
  
  // Set default for test mode
  if (!apiUrlRaw && mode === 'test') {
    apiUrlRaw = 'http://localhost:3000'
  }
  
  // Validate for non-test modes
  if (mode !== 'test') {
    if (!apiUrlRaw) {
      throw new Error('VITE_API_URL environment variable is required for client build')
    }
    if (!/^https?:\/\//i.test(apiUrlRaw)) {
      throw new Error('VITE_API_URL must start with http:// or https://')
    }
    try {
      new URL(apiUrlRaw)
    } catch {
      throw new Error('VITE_API_URL must be a full, valid URL')
    }
    const masked = apiUrlRaw.slice(0, 8) + '…'
    console.log(`✅ Building client with API URL: ${masked}`)
  }
  
  // Use the final sanitized value
  const API_URL = apiUrlRaw || 'http://localhost:3000'
  
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
          target: API_URL,
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
      __VITE_API_URL__: JSON.stringify(API_URL),
    },
  }
})

