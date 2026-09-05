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
  // PORTAL is the file in the project root: opened from disk, so every link has
  // to be absolute or it resolves against file:// and goes nowhere. REMOTE is the
  // same page at the root of the branch, where relative links are correct and
  // shorter. They differ in exactly this and nothing else.
  const portal = mode === 'portal';

  const cards = register.variants.map((v) => {
    const live = isLive(v);
    const shot = previewFor(root, v.slug);
    const abs = `${origin}${base}${v.slug}/`;

    const entries = v.entries?.length ? v.entries : [{ path: '', label: 'Open' }];
    const href = (path) => (portal ? abs + path : `${v.slug}/${path}`);

    // A card whose build is not published has nothing to link to, so it says so
    // rather than offering a link into a 404.
    const links = live
      ? entries.map((e) =>
        `          <a href="${esc(href(e.path))}"${portal ? ' target="_blank" rel="noopener"' : ''}>${esc(e.label)}</a>`)
      : [`          <span class="pending">npm run deploy -- ${esc(v.slug)}</span>`];

    const media = shot
      ? `<img src="${esc(shot)}" alt="" loading="lazy" width="1440" height="900">`
      : '<p class="noshot">no preview — npm run shoot</p>';

    const status = live ? '' : '<span class="tag tag--gone">not deployed</span>';
    const primary = live ? href('') : null;

    // The shot is the click target when there is somewhere to go, and a plain
    // element when there is not — a dead <a> is a link that lies about itself.
    const shotBlock = primary
      ? `<a class="card__shot" href="${esc(primary)}"${portal ? ' target="_blank" rel="noopener"' : ''}>
          ${media}
          ${status}
        </a>`
      : `<div class="card__shot">
          ${media}
          ${status}
        </div>`;

    return `      <article class="card${live ? '' : ' card--gone'}">
        ${shotBlock}
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
    .replace('{{LEAD}}', portal
      ? 'Every version is a published build — the links go straight to it, so this page needs nothing running. Open them in a real browser: VS Code&rsquo;s built-in preview does not put WebGL on screen.'
      : 'Each version is a full build at its own address.')
    .replace('{{COUNT}}', portal
      ? `${n} version${n === 1 ? '' : 's'} · ${liveCount} deployed`
      : `${liveCount} version${liveCount === 1 ? '' : 's'} live`)
    .replace('{{BUILT}}', new Date().toISOString().slice(0, 10))
    .replace('{{REPO}}', esc(register.repo))
    .replace('{{FOOT}}', portal
      ? `<p>This page is generated. The site itself is <code>index1.html</code>; run it with <code>npm run dev</code>.</p>
    <p>New version: <code>npm run new-variant -- v02-slug "Name" "note"</code></p>
    <p>Then: <code>npm run deploy -- v02-slug</code> · <code>npm run shoot</code> · <code>npm run hub</code></p>`
      : `<p><a href="${esc(register.repo)}">Source</a></p>`)
    .replace('{{PROBE}}', '');
}
