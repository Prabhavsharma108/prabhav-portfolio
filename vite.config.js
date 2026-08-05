import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// The site's public origin, in exactly one place.
//
// Everything that needs an absolute URL — the canonical link, Open Graph and
// Twitter tags, JSON-LD, robots.txt and the sitemap — is generated from this,
// so they can't drift apart when the domain changes. Override it per
// environment (e.g. a Vercel env var) rather than editing markup.
const SITE_URL = (process.env.SITE_URL || 'https://prabhavsharma.in').replace(/\/$/, '')

/**
 * Substitutes %SITE_URL% in index.html and emits robots.txt + sitemap.xml
 * from the same constant.
 */
const siteUrlPlugin = () => ({
  name: 'site-url',

  transformIndexHtml(html) {
    return html.replaceAll('%SITE_URL%', SITE_URL)
  },

  generateBundle() {
    const today = new Date().toISOString().slice(0, 10)

    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    })

    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
    })
  },
})

export default defineConfig({
  plugins: [
    react(),
    siteUrlPlugin(),
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
