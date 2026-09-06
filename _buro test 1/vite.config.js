import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// assets/ sits outside public/ on purpose: the models there are large, they are
// referenced through import.meta.glob so the bundler can hash and tree-shake
// them, and public/ would copy every source byte into the build. Only the
// decoders live in public/, because their workers must keep stable paths.

const here = import.meta.dirname;

export default defineConfig({
  // ROOT IS src/, AND THAT IS WHAT PUTS THE PAGE AT ITS PUBLISHED NAME.
  //
  // Vite names an output HTML file by its path relative to `root`. The published
  // page has to be `index1.html` at the top of this folder — that is the naming
  // every _buro test uses, and it is the URL the dashboard links. So the SOURCE
  // entry cannot also be `index1.html` at the top of this folder: one path, two
  // files. With root at src/, the entry is src/index1.html and the build emits
  // exactly `index1.html`, with no renaming step to get wrong.
  root: resolve(here, 'src'),
  publicDir: resolve(here, 'public'),

  // RELATIVE, ALWAYS. This folder is published as part of a repository that is
  // served whole, under a path containing a space — `/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%201/`.
  // An absolute base has to encode that correctly and re-encode it every time
  // the folder is renamed. A relative base resolves against wherever the file
  // actually is, so the same build runs from disk, from a dev server and from
  // Pages without being told which.
  base: './',

  // Dev used to sit on 5180. That port is taken by another project of Alex's on
  // this machine — as are 5181, 5183, 5184, 5190 and 5191 — and a dev server
  // that silently answers with someone else's page is worse than one that fails
  // to start, so this one is both moved and strict.
  server: {
    port: 5200,
    strictPort: true,
    open: '/index1.html',
    // The models live in assets/, one level ABOVE root. Without this the dev
    // server refuses to serve them and the stage comes up empty.
    fs: { allow: [here] },
  },

  build: {
    outDir: resolve(here, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,

    // assets1/ for index1.html, the numbering every sibling test uses
    // (_buro test 3 has assets14/ for index14.html, assets20/ for index20.html).
    // It also keeps the build clear of this project's own assets/ folder, which
    // holds the CAD source and the model ledger and is not build output.
    assetsDir: process.env.VITE_ASSETS_DIR || 'assets1',

    rollupOptions: {
      // The published build ships the PAGE and nothing else.
      //
      // lab/index.html globs every file in assets/models to build its intake
      // table, which is right for a local instrument and wrong for a public
      // deploy: it pulled 37.9 MB of uncompressed intermediates into dist,
      // including midnight-division, which the ledger records as unresolved
      // provenance and do-not-ship. A build that quietly publishes an asset the
      // ledger says not to publish is the ledger not working.
      input: process.env.GITHUB_PAGES
        ? { index1: resolve(here, 'src/index1.html') }
        : {
            index1: resolve(here, 'src/index1.html'),
            lab: resolve(here, 'src/lab/index.html'),
            shots: resolve(here, 'src/lab/shots.html'),
            rig: resolve(here, 'src/lab/rig.html'),
          },
    },
  },

  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.ktx2'],
});
