// The portal page, built from variants.json.
//
// ONE OUTPUT, ONE SET OF LINKS. This used to render twice — a local copy whose
// links were absolute, so they resolved from file://, and a copy at the root of
// a gh-pages branch whose links were relative to per-variant folders. There is
// no branch now and there are no folders: a variant is `indexN.html` lying next
// to this page. Relative links reach it from disk, from a dev server and from
// Pages without being told which, so the second rendering had nothing left to
// differ in and is gone.
//
// The one thing lost with it is the file:// case — `href="index1.html"` opens
// from the file tree, but the page it opens is a module build and a browser will
// not run modules over file://. That was already true of the deployed links it
// replaces, which needed the network. Use the dev server or the published URL.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PREVIEW_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

/** previews/index1.jpg for index1.html — the key is the file's own stem. */
export function stemOf(file) {
  return String(file).replace(/\.html?$/i, '');
}

export function previewFor(root, file) {
  const stem = stemOf(file);
  for (const ext of PREVIEW_EXT) {
    if (existsSync(join(root, 'previews', stem + ext))) return 'previews/' + stem + ext;
  }
  return null;
}

/**
 * @param {object}  register  parsed variants.json
 * @param {object}  opts
 * @param {string}  opts.root      the project folder — where the variants and previews/ live
 * @param {string}  opts.repoRoot  where the template lives
 * @param {Function} opts.isLive   (variant) => boolean — is the file actually there
 */
export function buildHub(register, { root, repoRoot = root, isLive }) {
  const cards = register.variants.map((v) => {
    const live = isLive(v);
    const shot = previewFor(root, v.file);

    // A card whose file is not there has nothing to link to, so it says so
    // rather than offering a link into a 404.
    const links = live
      ? `          <a href="${esc(v.file)}">Open</a>`
      : `          <span class="pending">missing — ${esc(v.file)}</span>`;

    const media = shot
      ? `<img src="${esc(shot)}" alt="" loading="lazy" width="1440" height="900">`
      : '<p class="noshot">no preview — npm run shoot</p>';

    const status = live ? '' : '<span class="tag tag--gone">missing</span>';

    // The shot is the click target when there is somewhere to go, and a plain
    // element when there is not — a dead <a> is a link that lies about itself.
    const shotBlock = live
      ? `<a class="card__shot" href="${esc(v.file)}">
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
${links}
          </div>
        </div>
      </article>`;
  }).join('\n');

  const liveCount = register.variants.filter(isLive).length;
  const n = register.variants.length;

  const template = readFileSync(join(repoRoot, 'tools', 'hub.template.html'), 'utf8');

  return template
    .replaceAll('{{TITLE}}', esc(register.title))
    .replaceAll('{{SUBJECT}}', esc(register.subject))
    .replace('{{CARDS}}', cards)
    .replace('{{LEAD}}', 'Every version is a built page in this folder. Open them in a real browser: VS Code&rsquo;s built-in preview does not put WebGL on screen.')
    .replace('{{COUNT}}', `${n} version${n === 1 ? '' : 's'} · ${liveCount} built`)
    .replace('{{BUILT}}', new Date().toISOString().slice(0, 10))
    .replace('{{REPO}}', esc(register.repo))
    .replace('{{FOOT}}', `<p>This page is generated. The source of the current version is <code>src/index1.html</code>; run it with <code>npm run dev</code> and publish it with <code>npm run publish</code>.</p>
    <p>New version: <code>npm run new-variant -- index2.html "Name" "note"</code></p>
    <p>Then: <code>npm run shoot</code> · <code>npm run hub</code></p>`)
    .replace('{{PROBE}}', '');
}
