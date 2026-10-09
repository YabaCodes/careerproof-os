# CP-011A.1 regression evidence

Local verification on 2026-10-09: **37/37 Node tests and 30/30 headless Chromium tests passed**, with zero skipped tests. `npm test`, `npm run typecheck`, production build and `git diff --check` passed. Playwright 1.56.1 / Chromium 141; synthetic fixtures only. GitHub PR CI is a separate gate and must pass on the submitted commit.

## Automated coverage

| Coverage | Evidence |
|---|---|
| All existing destinations, forms and previews | 14 matrix cases: 7 widths × light/dark; long and empty screens, validation/no-results, details/edit/profile/capture/Settings and new/legacy previews |
| Responsive geometry | Page/dialog overflow, 44px targets, labelled controls, equal button and icon centers, visible tablet navigation |
| Dialog lifecycle | Field input, direct backdrop, dirty cancel/accept, focus trap, inert background, invoker focus/scroll return, hash changes preserve typed text |
| Keyboard/long form | Synthetic VisualViewport reduced to 360px with 40px offset; footer stays within visible viewport, final textarea scrolls into body |
| Saving/loading/errors | Delayed synthetic save exposes aria-busy and disables duplicate action buttons; startup/loading fit 320px; invalid restore notice uses space inside dialog |
| Backups / CRUD | Existing capture/edit/archive/unarchive/profile, download and format-2 import, format-1 legacy replacement, partial dates and stale tabs |
| Upgrade/offline | Previous alpha.1-cache fixture → alpha.2; all 12 collections compared before/after activation and offline reload. Offline icon PNG/SVG and dialog-module fetches succeed |
| Brand assets | PNG signatures/dimensions, separate maskable manifest purpose, Apple touch link, all shell assets exist, every compiled module cached |
| Shared contrast | Text, muted/hint/placeholder, teal and danger ≥4.5:1; control/focus ≥3:1 in both themes |
| Recovery foundation | All earlier strict-validation, migration, rollback, duplicate/reference, unsupported/blocked upgrade, generation/revision and export-limit tests retained |

The first matrix run rejected an invalid test fixture with no profile; it was corrected to a valid empty profile/taxonomy fixture. A navigation rerender race uncovered during focus testing was fixed. The upgraded-data comparison initially compared fixture insertion order to IndexedDB key order; it now compares actual stored snapshots before/after. These were resolved before final passing results.

## Visual evidence

252 baseline and 252 proposed screenshots: Home, Vault, no-results, details, edit, Profile, profile editor, capture/top/bottom, validation, Settings, export notice, invalid import, full/legacy restore, empty Home/Vault/Profile. Widths 320/375/390/430/768/1024/1440, height 900px; both themes. The proposed audit reports **zero overflow, horizontal clipping, undersized targets or missing navigation encounters**.

Representative committed images: [visual review](UI_VISUAL_REVIEW.md). Full local output is ignored under test-results/ui-before and ui-after; regenerate with `npm run audit:ui`. The baseline runner accepts `CP_TEST_ROOT` pointing to a compiled alpha.1 dist folder. It never reads production user data.

## Limits and remaining acceptance

Chromium geometry is not iOS Safari verification. Real iPhone/iPad keyboard resizing, date pickers, safe areas, orientation, native alerts, VoiceOver, installed icon refresh and physical offline cold-start remain manual checks. Native confirmations cannot be styled or meaningfully represented in DOM screenshots.

The previous-cache worker is a controlled fixture; it verifies activation and stored-data preservation, not every previously installed Safari worker state. The unchanged service worker still uses immediate activation and cache-first resources; already-open installations should reopen/reload for a coherent update, retaining their browser storage.

No encryption or cross-device sync. Large-data mobile performance remains unbenchmarked. Token contrast tests and focus/label checks support accessibility improvements; they do not establish full WCAG certification.
