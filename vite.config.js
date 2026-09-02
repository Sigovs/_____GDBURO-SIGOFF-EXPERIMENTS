import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// assets/ sits outside public/ on purpose: the models there are large, they are
// referenced through import.meta.glob so the bundler can hash and tree-shake
// them, and public/ would copy every source byte into the build. Only the
// decoders live in public/, because their workers must keep stable paths.

export default defineConfig({
  // GitHub Pages serves this repo from /gd_buro_tests/, so the built asset URLs
  // need that prefix. Dev stays at / — a hard-coded base would break the dev
  // server, and a dev server that does not match the build is a preview of
  // something else.
  base: process.env.GITHUB_PAGES ? '/gd_buro_tests/' : '/',
  server: { port: 5180, open: '/' },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      // The Pages build ships the SITE and the rig bench, and nothing else.
      //
      // lab/index.html globs every file in assets/models to build its intake
      // table, which is right for a local instrument and wrong for a public
      // deploy: it pulled 37.9 MB of uncompressed intermediates into dist,
      // including midnight-division, which the ledger records as unresolved
      // provenance and do-not-ship. A build that quietly publishes an asset the
      // ledger says not to publish is the ledger not working.
      input: process.env.GITHUB_PAGES
        ? {
            index: resolve(import.meta.dirname, 'index.html'),
            rig: resolve(import.meta.dirname, 'lab/rig.html'),
          }
        : {
            index: resolve(import.meta.dirname, 'index.html'),
            lab: resolve(import.meta.dirname, 'lab/index.html'),
            shots: resolve(import.meta.dirname, 'lab/shots.html'),
            rig: resolve(import.meta.dirname, 'lab/rig.html'),
          },
    },
  },
  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.ktx2'],
});
