import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// assets/ sits outside public/ on purpose: the models there are large, they are
// referenced through import.meta.glob so the bundler can hash and tree-shake
// them, and public/ would copy every source byte into the build. Only the
// decoders live in public/, because their workers must keep stable paths.

export default defineConfig({
  server: { port: 5180, open: '/' },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        lab: resolve(import.meta.dirname, 'lab/index.html'),
        shots: resolve(import.meta.dirname, 'lab/shots.html'),
      },
    },
  },
  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.ktx2'],
});
