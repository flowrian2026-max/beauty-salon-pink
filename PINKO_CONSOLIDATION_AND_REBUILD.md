# PINKO consolidation & rebuild notebook

Last audited: 2026-11-26
Canonical repository: `flowrian2026-max/beauty-salon-pink`
Working branch: `main` only

## Repository consolidation decision

- `beauty-salon-pink` is the canonical PINKO/NOIR PINK project.
- `pinko` is a donor/archive repository. Do not delete it until the rebuild has been visually and technically verified.
- The two repositories share the same core app structure and many identical blobs (including the shared NOIR components, routes, UI primitives and tests). This is not a clean independent second implementation.
- Preserve the canonical repository's extra assets and work: `src/components/noir/scroll-liquid.tsx`, `src/assets/chrome-melt.mp4`, `src/assets/chrome-melt-poster.jpg`, and the richer `spatial-journey.tsx` implementation.
- Donor-only items identified in `pinko`: `bunfig.toml`, `public/favicon.ico`, `.lovable/migrate-external-project/ledger.json`, and alternate makeup image files with different blob hashes. Keep the donor repository intact for now; review these individually before copying. Do not overwrite the canonical matched makeup pair.
- `pinko` contains an alternate scroll-scrubbed portrait hero implementation. The canonical repository has its own richer hero implementation and should not be replaced wholesale.

## Verified finding: the signature liquid was not mounted

The canonical repository already contains a substantial WebGL2 rose-gold liquid shader in `src/components/noir/scroll-liquid.tsx`, and the CSS includes `.pinko-scroll-liquid`. However, the homepage route did not import or render `ScrollLiquid`. This meant the intended flowing-liquid effect was present in source but inactive.

### Change made on 2026-11-26

- Added the `ScrollLiquid` import to `src/routes/index.tsx`.
- Mounted `<ScrollLiquid />` on the homepage before `<SpatialJourney />`.
- Commit: `5395da724d79d77f738df1e7ab5f83566a506d43`.
- This is a source change only. Runtime appearance, browser compatibility, performance and production build have not yet been verified in this pass.

## Rebuild direction

The goal is a distinctive premium beauty-studio website, not a generic salon template.

1. **Signature hero and liquid transition**
   - Validate the rose-gold liquid emerging from the portrait/neck and flowing down the editorial page.
   - Match the shader's neck anchor to the actual chosen hero footage; inspect `hero-portrait.mp4`, `chrome-melt.mp4`, their posters and source imagery before choosing.
   - Keep the motion slow, elegant and physically coherent; no horror-like face distortion or abrupt animation.
   - Add robust WebGL failure fallback, reduced-motion handling, mobile performance limits and no blank/black hero state.
   - Confirm stacking order so the liquid is visible where intended without obscuring the portrait or text.

2. **Visual system**
   - Audit and consolidate the long, layered `src/styles.css`; remove conflicting duplicate overrides only after identifying the final winning rules.
   - Establish a small set of semantic tokens for rose-gold, blush, plum, ink, typography, spacing, borders and motion.
   - Keep the result editorial, tactile and premium; avoid excessive pink, generic gradients and template-like cards.
   - Check Persian RTL and English LTR as first-class layouts.

3. **Experience and content**
   - Review every route and remove repeated sections, placeholder claims and decorative UI that does not help a visitor.
   - Give nail, hair, makeup and skincare clear service journeys, strong gallery storytelling and useful before/after comparisons.
   - Keep all business details, prices, staff profiles, reviews and transformation claims owner-approved; do not fabricate them.

4. **Booking and operations**
   - The current booking/admin flow is a local frontend demo. It is not shared salon infrastructure and does not confirm real appointments.
   - Plan a portable backend suitable for ordinary Iranian PHP/MySQL hosting; no mandatory Cloudflare, R2, foreign payment card or paid AI API.
   - Until the backend is implemented and configured, describe contact/booking actions honestly as inquiries or local demo interactions.

5. **Performance, accessibility and QA**
   - Test low-end Android/mobile, keyboard navigation, screen readers, reduced motion, RTL/LTR, image loading and no-WebGL browsers.
   - Run lint, typecheck, tests and production build after code passes; record actual results, not assumed status.
   - Add visual regression screenshots for home, services, service detail, gallery, booking and contact.

## Current verified baseline from repository notes

The existing roadmap records a prior pass with lint (0 errors, 9 fast-refresh warnings), 32 tests passing, clean typecheck and successful production build. Those are historical notes, not verification of the 2026-11-26 liquid mount commit. Re-run all checks against the current main commit before calling the rebuild stable.

## Working rules

- Work on `main` only; do not create branches.
- Do not rewrite published Git history; this repository is connected to Lovable.
- Do not delete `pinko` or donor assets until consolidation and verification are complete.
- Never report a feature, test, deployment or visual check as complete without direct evidence.

## Exact source comparison (2026-11-26)

A recursive Git tree comparison of both `main` branches found:

- Canonical `beauty-salon-pink`: 148 tracked files.
- Donor `pinko`: 129 tracked files.
- 126 paths exist in both repositories.
- 110 of those shared paths have exactly the same Git blob SHA.
- 16 shared paths differ and require deliberate selection/merge; they include README/AGENTS/package/lockfile, hero route/hero component, styles, server/start config, data and makeup imagery.
- Canonical-only paths: 22, including the liquid shader, chrome-melt footage/poster, current portrait footage and existing app integrations.
- Donor-only paths: 3 (`bunfig.toml`, `public/favicon.ico`, and the Lovable migration ledger).

Conclusion: use the canonical repository as the source of truth. Do not wholesale-copy the donor over it: that would risk losing the liquid shader, chrome-melt assets and newer canonical implementation. Review the 16 differing paths and 3 donor-only files individually. The donor remains untouched as a safety archive.

## CI status at this audit

The current main head is `39838d09e2b23fede79dd2bc19ad96b15fb275d0`. GitHub Actions has no run for this new head yet. The latest listed workflow run is from 2026-11-10 and failed on an older head (`d8e19a08104c5fdf26d0e18084dfe55abbce0d69`); it is not evidence that the current changes fail. No build/test result has been claimed for the new commits.
