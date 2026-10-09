# CP-011A.1 — UI audit and implemented corrections

Review date: 2026-10-09. Baseline: main at `35e676f4b1ec5474f719007a09acee3aaed62ee5` (0.1.1-alpha.1). Proposed release: **0.1.1-alpha.2**, branch `fix/cp-011a-ui-brand-polish`. CP-011B remains paused.

The review covers Home, Vault, Profile, capture/edit/details, profile editor, Settings, format-2 and legacy restore previews, export notices, invalid-import errors, validation, empty screens, loading and startup failure. It includes long synthetic titles, descriptions, summaries and contact addresses. Native discard/delete confirmations retain the browser's UI; their cancel/accept semantics are tested. Their appearance needs device verification.

## Findings

High means a destination or important interaction is inaccessible, or unsaved input can be lost. Medium means readability, keyboard access or usability is impaired. Low means inconsistent presentation.

| ID | Severity | Affected area / observed issue | Correction and verification |
|---|---|---|---|
| UI-01 | High | Navigation absent at 671–930px: sidebar hidden before bottom navigation appears | Mobile navigation below 768px, labelled sidebar rail at 768–1023px, full sidebar from 1024px. Matrix reaches all destinations through actual controls |
| UI-02 | High | Long Profile contact text causes 83–193px phone page overflow; open dialogs inherit the overflowing page | Zero-width grid/flex minima, wrapping contact/headline/summary and single-column phone profile. Matrix includes long unbroken text |
| UI-03 | Medium | Settings text competes with narrow action buttons and small theme selector | Settings rows stack below 480px; full-width 48px controls and readable body/helper text |
| UI-04 | Medium | Close/settings/filter/text controls below 44px; tiny nav labels | Shared controls are at least 44px, forms/buttons generally 48px; 68px equal mobile nav slots. Measured in every audit state |
| UI-05 | Medium | 14px form inputs risk automatic Safari zoom | Inputs, selects and textareas use 16px; labels 14px, hints 12px. Chromium checks sizes; Safari zoom remains manual |
| UI-06 | Medium | Dialog header/footer could shrink; body lacks a reliable minimum and scroll boundary | Header/footer do not shrink; body has min-height:0, independent scrolling and scroll padding. Long forms remain reachable |
| UI-07 | High | Code review: fixed layout-viewport dialogs lack software-keyboard viewport adjustment | VisualViewport resize/scroll drives dialog height/top; compact chrome below 500px visual height. Simulated keyboard geometry passes; real iOS remains pending |
| UI-08 | Medium | Dialog focus returns to an element removed by shell rendering | Remember action/ID/region and find the recreated invoker; fallback to page heading. Tested after close, save and scrolled-page invocation |
| UI-09 | Medium | Dialog background remains in keyboard/accessibility navigation; background scrolling relies on overflow:hidden | Background regions are inert; focus wraps inside dialog; body scroll position is locked and restored. Browser focus/scroll checks pass |
| UI-10 | High | Hash changes rerender the shell and erase an open unsaved form; normal navigation rerenders twice | Keep form DOM during route events and skip a redundant hash render. Dirty form survives hash change and discard cancellation |
| UI-11 | Medium | Toast overlaps dialog controls and loses state during shell updates | Dialog notifications occupy a separate bounded region; message/timer survive renders. Export preserves focus; invalid restore remains readable |
| UI-12 | Medium | Small muted text and placeholders have weak contrast | Darker light-theme supporting colors and clearer dark-theme text/borders. Shared text pairs meet 4.5:1 and control/focus pairs 3:1 in measured token tests |
| UI-13 | Low | Inconsistent heading sizes, spacing, card radii and button padding | Central type/spacing/radius tokens; consistent card/control/dialog rules; tablet grids collapse before crowding |
| UI-14 | Medium | Settings glyph resembles a sun; Vault metaphor and nav labels differ across surfaces | Selected house/document/plus/person/gear family, 24-unit grid and 2-unit rounded stroke. Home active fill, stable teal Add circle and matching labels |
| UI-15 | Low | Sidebar uses shield, phone header uses CP text, install icon differs; SVG-only install asset | Selected Modern Monogram used everywhere; PNG install sizes, independent maskable asset and opaque Apple touch icon |
| UI-16 | Medium | Code review: export completion can rerender a newly opened editor after Settings closes | Refresh export metadata only while Settings is still open; keep the current form DOM |
| UI-17 | Medium | Pending save/restore has no exposed busy state | Dialog aria-busy and disabled action buttons while writes are pending; synthetic delayed-save test verifies duplicate submission protection |

## Before/after evidence

The same Playwright fixture, height 900px, widths **320/375/390/430/768/1024/1440** and both light/dark themes produced **252 screenshots per version** (18 states × 14 environments). Fixed dialogs are captured at viewport size; pages use full-page screenshots.

| Automated observation | Baseline alpha.1 | Proposed alpha.2 |
|---|---:|---:|
| Captured states with horizontal page overflow | 80 | 0 |
| Captured states with controls below 44px | 252 | 0 |
| Captured states with elements outside viewport horizontally | 28 | 0 |
| Missing-navigation encounters | 6 | 0 |

The outside-viewport baseline count includes deliberately decorative hero art; it is not 28 distinct functional clipping defects. Overflow counts repeat the same underlying Profile issue while other states are open. Baseline navigation gaps use explicit hash fixture fallback only to inspect otherwise inaccessible screens; proposed UI tests require actual navigation controls.

See [before/after screenshots](UI_VISUAL_REVIEW.md), [design standards](VISUAL_DESIGN_SYSTEM.md), [branding record](BRANDING_REVIEW.md), [regression evidence](UI_REGRESSION_REPORT.md), and [device acceptance](ACCEPTANCE_TESTS.md).

## Scope and data safety

No IndexedDB migration or backup format change. Schema 2, format 2/legacy 1, 12 MiB limits, taxonomy, revision/generation safeguards, strict validation and atomic replacement remain unchanged. Only APP_VERSION changes in domain code; data/validation/date/taxonomy implementations are untouched. Profile, Vault and dashboard presentation changed; no new module screens.

The native confirmations are intentionally retained. There is no encryption, cloud synchronization or large-data phone benchmark. Automated Chromium evidence does not certify Safari keyboards, safe areas, screen readers or install-icon refresh.
