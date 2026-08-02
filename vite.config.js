import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Precompressed siblings so the CDN can serve .br/.gz without compressing
    // 1MB+ of three.js on every request.
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
  ],

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // Sourcemaps would otherwise be the largest thing in the deploy.
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Without this everything lands in one ~1.4MB chunk. three.js never
        // changes between deploys, so splitting it out means a content edit
        // doesn't invalidate the engine in visitors' caches.
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          animation: ['gsap', '@gsap/react'],
          react: ['react', 'react-dom'],
        },
      },
    },
    // three + drei legitimately exceed the default 500KB warning.
    chunkSizeWarningLimit: 900,
  },
})
