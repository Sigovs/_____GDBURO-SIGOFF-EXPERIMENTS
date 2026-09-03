// The hub page, built from variants.json. One template, two outputs.
//
//   LOCAL   versions/index.html  — double-click it. Links point at the dev
//                                  server and at the deployed copy, and the
//                                  preview is read off disk, so it works with
//                                  no network and no build.
//   REMOTE  the root of gh-pages — links point at /vNN/, previews are copied in.
//
// The two are the same file with different hrefs, because a hub that looks like
// something else locally is a preview of something else.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PREVIEW_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

export function previewFor(root, slug) {
  for (const ext of PREVIEW_EXT) {
    if (existsSync(join(root, 'previews', slug + ext))) return 'previews/' + slug + ext;
  }
  return null;
}

/**
 * @param {object}  register  parsed variants.json
 * @param {object}  opts
 * @param {'local'|'remote'} opts.mode
 * @param {string}  opts.root        where previews/ lives (the repo, or the branch)
 * @param {string}  opts.repoRoot    where the template lives — always the repo
 * @param {Function} opts.isLive     (variant) => boolean — is it actually published
 * @param {string}  opts.origin      https://sigovs.github.io
 * @param {string}  opts.base        /gd_buro_tests/
 */
export function buildHub(register, { mode, root, repoRoot = root, isLive, origin, base }) {
  const local = mode === 'local';

  const cards = register.variants.map((v) => {
    const live = isLive(v);
    const shot = previewFor(root, v.slug);
    const remoteUrl = `${origin}${base}${v.slug}/`;
    const entries = v.entries?.length ? v.entries : [{ path: '', label: 'Open' }];

    // Locally the card opens the dev server, because that is the copy being
    // worked on. Remotely it opens the published folder. The other address is
    // always offered as a second link rather than hidden — the whole point of
    // the page is getting to a specific build quickly.
    const primary = local
      ? (v.dev || 'http://localhost:5180/')
      : `${v.slug}/`;

    const links = entries.map((e) => {
      const href = local
        ? (v.dev || 'http://localhost:5180/') + e.path
        : `${v.slug}/${e.path}`;
      return `          <a href="${esc(href)}"${local ? ' target="_blank" rel="noopener"' : ''}>${esc(e.label)}</a>`;
    });

    if (local && live) {
      links.push(`          <a href="${esc(remoteUrl)}" target="_blank" rel="noopener" class="alt">Deployed</a>`);
    }

    const media = shot
      ? `<img src="${esc(shot)}" alt="" loading="lazy" width="1440" height="900">`
      : `<p class="noshot">no preview — node tools/shoot.mjs</p>`;

    // The status line says something true and useful in each context: locally,
    // whether the dev server is answering; remotely, whether the folder exists
    // on the branch. Neither is decoration and neither is guessed.
    const status = local
      ? `<span class="dot" data-probe="${esc(v.dev || 'http://localhost:5180/')}" title="dev server"></span>`
      : (live ? '' : `<span class="tag tag--gone">not deployed</span>`);

    return `      <article class="card${live || local ? '' : ' card--gone'}">
        <a class="card__shot" href="${esc(primary)}"${local ? ' target="_blank" rel="noopener"' : ''}>
          ${media}
          ${status}
        </a>
        <div class="card__meta">
          <p class="card__line"><span>${esc(v.date || '')}</span><span class="card__status">${esc(v.status || '')}</span></p>
          <h2 class="card__name">${esc(v.name)}</h2>
          <p class="card__note">${esc(v.note || '')}</p>
          <div class="card__links">
${links.join('\n')}
          </div>
        </div>
      </article>`;
  }).join('\n');

  const liveCount = register.variants.filter(isLive).length;
  const n = register.variants.length;

  // The template always comes from the repo. `root` may be a checked-out branch
  // that has previews and no tools/ at all.
  const template = readFileSync(join(repoRoot, 'tools', 'hub.template.html'), 'utf8');

  return template
    .replaceAll('{{TITLE}}', esc(register.title))
    .replaceAll('{{SUBJECT}}', esc(register.subject))
    .replace('{{CARDS}}', cards)
    .replace('{{LEAD}}', local
      ? 'Open in a real browser — VS Code&rsquo;s built-in preview does not put WebGL on screen. A green dot means the dev server is answering; if it is grey, run <code>npm run dev</code>.'
      : 'Each version is a full build at its own address.')
    .replace('{{COUNT}}', local
      ? `${n} version${n === 1 ? '' : 's'} · ${liveCount} deployed`
      : `${liveCount} version${liveCount === 1 ? '' : 's'} live`)
    .replace('{{BUILT}}', new Date().toISOString().slice(0, 10))
    .replace('{{REPO}}', esc(register.repo))
    .replace('{{FOOT}}', local
      ? `<p>New version: <code>node tools/new-variant.mjs v02-slug "Name" "note"</code></p>
    <p>Previews: <code>node tools/shoot.mjs</code> — screenshots every version at its hero frame.</p>
    <p>Publish: <code>npm run deploy -- v02-slug</code></p>`
      : `<p><a href="${esc(register.repo)}">Source</a></p>`)
    .replace('{{PROBE}}', local
      ? `<script>
document.querySelectorAll('.dot').forEach(d => {
  fetch(d.dataset.probe, { mode: 'no-cors', cache: 'no-store' })
    .then(() => d.classList.add('dot--up'))
    .catch(() => {});
});
</script>`
      : '');
}
