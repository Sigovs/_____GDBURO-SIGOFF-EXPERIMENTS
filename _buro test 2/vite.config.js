import { defineConfig } from 'vite'

// No renderer in the graph. interaction-thesis.md §14 removed WebGL from this page
// entirely — not lazily, not conditionally — so there is nothing here to chunk it out
// of. If `three` ever appears in a build report, something has gone wrong upstream.
export default defineConfig({
  server: { port: 5183, open: false },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: { output: { manualChunks: { motion: ['gsap', 'lenis'] } } },
  },
})
