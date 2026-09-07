import { defineConfig } from 'vite'
import { resolve } from 'node:path'

const here = import.meta.dirname

// THIS FOLDER IS PUBLISHED AS PART OF A REPOSITORY THAT GITHUB SERVES WHOLE, at
//
//   https://sigovs.github.io/_____GDBURO-SIGOFF-EXPERIMENTS/_buro%20test%202/
//
// which is the same arrangement _buro test 1 and _buro test 3 use. Three things
// follow from that and each one has bitten this project already:
//
//   1. THE BUILD'S BASE IS RELATIVE. The deploy path contains a space and a
//      folder name that may change; a relative base resolves against wherever
//      the file actually is, so one build runs from disk, from the dev server
//      and from Pages without being told which. Dev keeps an absolute base
//      because every module specifier in this project is written /src/... and
//      the dev server resolves those from the project root.
//
//   2. RUNTIME FETCHES GO THROUGH import.meta.env.BASE_URL, never a leading
//      slash. The tree models and the Draco decoder were '/models/...' and
//      '/draco/gltf/', which asks the DOMAIN root for files that live two
//      directories down — the planting silently vanished on every page that was
//      not at /.
//
//   3. THE SOURCE ENTRY IS pages/home.html, NOT index.html. index.html at the top of
//      this folder is the published portal, and a source entry sitting beside it
//      would be listed by the catalog as a page of its own and served as the raw
//      source it is. It lives one level down instead.
//
// Three pages are built, and they are the three things worth showing:
//
//   pages/home.html                              the site as it stands, production act 02
//   exploration/integrated/v5-full-site.html     the same site with V5.2 in act 02
//   exploration/study/proposed-v5-guided-sales.html   act 02 on its own
//
// tools/publish.mjs turns them into index2/3/4.html beside assets2/, and
// tools/build-hub.mjs writes the portal. Neither is run by `npm run dev`.

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',

  // NO publicDir. It held exactly two folders — models/ and draco/ — and copying them
  // into the build meant the repository carried both the source copy and the published
  // copy of 9.8 MB of geometry and decoder. They live at the top of this folder now,
  // which is where they are PUBLISHED from, and the dev server serves them from the
  // same path because that path is under the project root either way. One copy, one
  // URL, correct in both places.
  publicDir: false,
  server: { port: 5183, open: false },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    // Named for the page it belongs to, so two published versions in one folder
    // can never overwrite each other's chunks. _buro test 3 already does this
    // (index14.html beside assets14/).
    assetsDir: process.env.VITE_ASSETS_DIR || 'assets2',
    rollupOptions: {
      input: {
        home: resolve(here, 'pages/home.html'),
        v5site: resolve(here, 'exploration/integrated/v5-full-site.html'),
        v5act02: resolve(here, 'exploration/study/proposed-v5-guided-sales.html'),
      },
    },
  },
}))
