import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

// assets/ sits outside public/ on purpose: the models there are large, they are
// referenced through import.meta.glob so the bundler can hash and tree-shake
// them, and public/ would copy every source byte into the build. Only the
// decoders live in public/, because their workers must keep stable paths.

const here = import.meta.dirname;

// THE REGISTER DECIDES WHAT IS BUILT. variants.json is the source of truth for
// the portal, for the screenshots and now for the build too, so a version is
// added in exactly ONE place. Each entry's `file` is both the source name under
// src/ and the published name at the top of this folder — root is src/ and Vite
// names an output HTML file by its path relative to root, so the two agree with
// no renaming step to get wrong. An entry whose source is not on disk is skipped
// rather than failing the build; the portal already renders that case as
// "missing" instead of linking into a 404.
const REGISTER = JSON.parse(readFileSync(resolve(here, 'variants.json'), 'utf8'));

const VARIANT_ENTRIES = Object.fromEntries(
  REGISTER.variants
    .map((v) => [v.file.replace(/\.html?$/i, ''), resolve(here, 'src', v.file)])
    .filter(([, path]) => existsSync(path)),
);

export default defineConfig({
  // ROOT IS src/, AND THAT IS WHAT PUTS THE PAGE AT ITS PUBLISHED NAME.
  //
  // Vite names an output HTML file by its path relative to `root`. A published
  // page has to sit at the top of this folder, so the SOURCE cannot also be a
  // file of that name at the top of this folder: one path, two files. With root
  // at src/, the entry is src/<name>.html and the build emits exactly
  // <name>.html, with no renaming step to get wrong.
  //
  // index1.html — the canonical URL for this folder — is no longer one of these
  // names. It is an ALIAS declared in variants.json and written by
  // tools/publish.mjs, so the URL and the source that serves it can move
  // independently. See the note beside `alias` in publish.mjs.
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
    // the register's first entry is what the dev server should open, and since
    // index1.html is now an ALIAS produced at publish time there is no such file
    // under src/ to open
    open: '/indexPresentation.html',
    // The models live in assets/, one level ABOVE root. Without this the dev
    // server refuses to serve them and the stage comes up empty.
    fs: { allow: [here] },
  },

  build: {
    outDir: resolve(here, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,

    // assets1/ HOLDS THE CHUNKS FOR EVERY VERSION, NOT ONLY index1.html's.
    //
    // The per-page numbering (_buro test 3 has assets14/ for index14.html) exists
    // so two versions built at DIFFERENT TIMES cannot overwrite each other's
    // chunks. Here they are built in the SAME pass — every registered version is
    // an input below — so Rollup hashes them into one folder and the pages share
    // three.js, the decoders and the model instead of carrying a copy each. Four
    // separate builds would have put about 9 MB of identical bytes into this
    // repository under four names.
    //
    // The name stays assets1: it is the folder already published, and it still
    // keeps the build clear of this project's own assets/, which holds the CAD
    // source and the model ledger and is not build output.
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
        ? VARIANT_ENTRIES
        : {
            ...VARIANT_ENTRIES,
            lab: resolve(here, 'src/lab/index.html'),
            shots: resolve(here, 'src/lab/shots.html'),
            rig: resolve(here, 'src/lab/rig.html'),
          },
    },
  },

  assetsInclude: ['**/*.glb', '**/*.hdr', '**/*.ktx2'],
});
