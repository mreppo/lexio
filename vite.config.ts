import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Precache all app assets so the app works fully offline.
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // Runtime cache for starter pack JSON files.
        runtimeCaching: [
          {
            urlPattern: /\/lexio\/starter-packs\/.+\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'starter-packs',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Cache Google Fonts stylesheets so the app renders offline.
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Cache Google Fonts web font files for offline use.
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Lexio - Vocabulary Trainer',
        short_name: 'Lexio',
        description: 'Learn vocabulary in any language with spaced repetition',
        start_url: '/lexio/#/app',
        scope: '/lexio/',
        display: 'standalone',
        background_color: '#0a0f1a',
        theme_color: '#0a0f1a',
        orientation: 'portrait',
        lang: 'en',
        icons: [
          {
            src: '/lexio/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/lexio/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/lexio/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    // Only upload source maps when the Sentry auth token is available (CI builds).
    // Local builds and forks without the secret continue to work without this step.
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: 'mareks-reppo',
            project: 'lexio',
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
  base: '/lexio/',
  build: {
    // Source maps are required for Sentry to show readable stack traces.
    // They are uploaded to Sentry and not served publicly, so this does not
    // expose source code to end users.
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Exclude Playwright E2E specs — they are collected by Playwright, not Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
    },
  },
})
