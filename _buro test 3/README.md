# gd_buro — Alexander Sigoff, selected work

Art-directed under [design_dna](https://github.com/Sigovs/design_dna).

## View it

Open `index1.html` (or `index.html`, the portal that links to every version here). Fonts load from a CDN, so a connection is required.

## Design Read

```
Reading this as a hiring-decision portfolio for dealer principals and marque
managers who are comparing candidates under time pressure, leaning
gallery-neutral with a catalogue metadata layer.
Dialect: partial: auction-editorial PRINCIPLES (P1 subtract, P3 metadata composed,
P6 colour as setting) + brief-derived typography, imagery scale and density.
Vault: 6 relevant references, 1 unusable for missing notes (trionn-com);
1 note contradicts its own capture (ciridae-com) — flagged, used by tags only.
```

The structural decision specific to this content, in one line: *each case is
shown in its client's own art direction and the portfolio never puts a frame
around it — the only furniture is a rail that sits in the same place on every
case, so the eye stops seeing it and starts comparing the work.*

## The six chapters

| # | Case | Year | Sector | Distinct capability | Frame source |
|---|---|---|---|---|---|
| 01 | Cauley Ferrari | 2025 | Marque dealer | multi-page dealer product | live |
| 02 | Prestige Imports | 2026 | Dealer group, service | light system, service and ownership | live |
| 03 | Pagani of Chicago | 2025 | Marque dealer | top of the marque hierarchy | live |
| **04** | **Dimamid** | **2025** | **Music project** | **authored world — the one disruption** | live |
| 05 | MODA Miami / Sotheby's | 2023 | Concours & auction | event and auction, not retail | Behance |
| 06 | Porsche Restoration | 2021 | Restoration service | service, the quiet close | Behance |

No two adjacent chapters prove the same capability.

**The disruption is chapter 04, and it breaks genre rather than tone** — the
only project in the set that is not automotive. Three coordinated departures, so
the break reads as one decision and not three accidents: the frame runs 21:9,
the paspartout collapses to full bleed, and the rail turns horizontal.

## Assets

Live sites were captured with Playwright at 1600×1000 @2×, and at 390×844 @3×
for mobile. Cookie banners and chat widgets are removed before the shutter, and
what was removed is logged so the capture stays auditable. Behance cases are
derived from `/project_modules/source/` originals, never the 1200px display
copies. Nothing is upscaled, desaturated or graded — the ground is a gallery
wall and the colour belongs to the work.

Two capture problems worth recording, because both look like bad design and are
not:

- **Pagani's home hero is dark across its entire video loop** (meanL 10–17 over
  eight timed frames). The Zonda page carries the chapter instead.
- **Cauley Ferrari's hero needed the lit phase of its loop** — 24/22 at first
  paint, 43/32 at t6.

## Measured contrast (WCAG AA)

| Pair | Ratio | Required |
|---|---|---|
| ink on ground | 16.98:1 | 4.5 |
| ink-70 micro-label, 11px | 9.03:1 | 4.5 |
| ink-58 case index, 11px | 6.16:1 | 4.5 |
| action underline | 3.29:1 | 3 |

No page text sits over imagery. The focus ring is ink with a 5px ground-coloured
halo, so it is measured against the page ground and holds over any frame.

**No chromatic accent.** That is the named structural differentiation from the
banned "navy + gold luxury" archetype: not a muted gold instead of gold, but no
brand colour at all.

## Motion

Three tiers, so the chapter opening stays the loudest thing in its chapter:

| Tier | What | Entrance |
|---|---|---|
| 1 | chapter-opening frame | 64px rise, 10px blur |
| 2 | bands, portraits, mobile frames | 20px rise, 5px blur |
| 3 | text blocks | 24px from the side, 6px blur, **per child** |

Entrances are stepped by viewport position, not DOM order, so frames that cross
the fold together still arrive one after another — measured gaps 159–309 ms.

**Scroll** is eased with a Locomotive-style lerp (0.085) applied to the *native*
document scroll, with layered parallax at different speeds per plane. It is
deliberately **not** the Locomotive library: a transformed scroll container makes
`document.scrollHeight` report 0, which breaks screenshots, find-in-page and
scroll anchoring. Only the wheel is intercepted; keyboard, touch, scrollbar and
anchors stay native. Anchors are driven through the same glide so they land
exactly instead of missing by ~280px once lazy images resolve.

**Reduced motion and no-JS**: every hidden state is applied by script, so both
leave a complete, composed page. Under reduced motion the accordion still
*works* — only its height transition is removed.

## Also shipped

A click accordion: one panel open at a time, so the section height is constant
(measured: 1073px across every row, drift 0px). Rows are real buttons with
`aria-expanded`; the project link lives inside the panel. Without JavaScript all
ten panels are open — nothing is lost.

## Verified in Chromium

- No horizontal scroll at 1440 / 1024 / 768 / 390 / **320**
- Reduced motion: nothing hidden, displaced or blurred
- No-JS: all frames and all index panels present
- Tab order follows the page; 2px focus ring at every stop
- Every frame resolves out of blur (the tier-2 rule needed a specificity fix —
  `.frame.tier2.armed` was out-ranking `.frame.revealed` and freezing supporting
  images in permanent blur)

## Still open

- **Copy.** The positioning line, contact headline, email, availability window
  and the ten index descriptions are bracketed with target lengths so the text
  masses are compositionally correct. No voice has been invented.
- **Per-case scope.** Role is stated as what the source evidences — art
  direction, web design, UI — and does not claim front-end build.
- **Vegas Auto Gallery and Kerbeck are deliberately absent**, including from the
  lower index and from the repository, until client permission is confirmed.
  Both are private previews.
