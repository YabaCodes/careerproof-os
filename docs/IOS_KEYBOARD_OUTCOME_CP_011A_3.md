# CP-011A.3 — iOS Keyboard / Outcome Field Visibility

**Proposed release:** v0.1.1-alpha.4  
**Baseline:** merged PR #6, v0.1.1-alpha.3  
**Status:** Implementation PR pending physical iPhone Safari / installed-PWA acceptance  
**Reported by user:** With the iPhone keyboard open, the bottom Outcome textarea is obscured and requires manual scrolling.

## Root-cause analysis

The previous `DialogController.revealFocusedField()` ran during the same requestAnimationFrame as its `--visual-height` / compact-footer CSS changes and was not guaranteed to observe their final flex geometry. iOS keyboard animation can produce successive visual viewport resizes. The old oversized-field fallback `Math.min(top,bottom)` could calculate no helpful movement when a label/control was taller than the remaining scrollport.

The new implementation:

1. Updates CSS-visible height/top on each VisualViewport resize/scroll.
2. Schedules focused-field measurement **two rendering frames after** layout-affecting CSS changes and a single debounced follow-up after keyboard animation.
3. Measures the actual **modal-body scrollport** rather than guessing keyboard pixels, and scrolls that element only; background remains inert/locked.
4. If the full field fits, reveals **the label and the entire input**. If space is too short, reveals the label and at least the first lines of the native textarea; scrolling its caret within its own area remains browser-managed. Input events re-check actual visibility without forcing the label back into view while the user types.
5. Detects keyboards using the last unobstructed VisualViewport height as well as the current layout viewport. This matters when standalone iOS WebKit shrinks both. Device safe-area padding is still removed only when a keyboard is detected; pinch zoom is not treated as a keyboard.
6. Reclaims the dialog's decorative mobile top gap when the keyboard is open while retaining Save buttons, focus trap, unsaved-change confirmation, and the current compact navigation.

No hardcoded device model, fixed scroll offset, forced page scrolling, document reset or data migration. The focused-field threshold is measured against the visible content region.

## Test additions

`tests/browser/ios-keyboard-outcome.spec.mjs` uses synthetic VisualViewport sequences **after focusing Outcome**, at 320/375/390/430px in both themes, without Playwright's manual `scrollIntoViewIfNeeded`. At visual heights 700→550→430→360→300 with top offset 40, assertions verify the Outcome label and text-entry region remain visible above the persistent Save footer; also verify text input, Title/Contribution/Outcome focus switches, keyboard dismissal, and a late-animation resize sequence.

The existing mobile/date/precision, backup/restore, offline, modal focus and navigation regression tests must also pass. The full workflow is `npm test`, `npm run typecheck` and production build. Actual CI output is linked in the PR rather than presumed.

## Device acceptance — CP-UI301

After user-controlled merge and successful deployment, **without deleting the installed app or clearing browser data**:

- Open Capture Achievement; tap Outcome before entering any content. The keyboard should open and Outcome's label plus visible text area should move above it automatically.
- Type several lines, then switch to Title and Contribution and back to Outcome. The caret stays visible and the form repositions automatically; no mandatory manual scroll.
- Dismiss/reopen keyboard, rotate device if practical; check the existing Save buttons and the compact navigation outside the modal.
- Check both themes, confirm v0.1.1-alpha.4, and save/reopen a **synthetic** draft/achievement. Confirm earlier records remain intact.
- Report iPhone model, iOS version, installed PWA vs Safari and whether any manual scrolling was necessary.

**Limitation:** Synthetic Chromium VisualViewport tests are not proof of actual WebKit keyboard behavior; real iPhone acceptance is the merge/release gate before CP-011B.

## Data and scope

IndexedDB schema **2**, backup format **2** plus legacy format **1**, date precision representation, IDs/revisions, transactional recovery, dataset generations and built-in competency taxonomy remain unchanged. Existing CP monogram/platform icons and Wealth-OS-inspired compact navigation are unchanged. Backups remain unencrypted and unsynced. CP-011B remains paused.
