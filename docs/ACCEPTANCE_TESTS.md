# CareerProof v0.1.0 — Manual acceptance test plan

Run these checks at your deployed GitHub Pages URL, preferably first with **non-confidential demo data**. Each is a pass/fail scenario. The built-in automated tests validate model rules and asset consistency, but do not replace live-browser tests.

## Primary workflows

- [ ] **CP-101:** Open CareerProof from a clean browser; Home loads without errors and shows zero achievements.
- [ ] **CP-102:** From any screen, open New Achievement; save a recorded entry with title, contribution, date and outcome.
- [ ] **CP-103:** Reload the page; entry persists in Recent Achievements and Achievement Vault.
- [ ] **CP-104:** Search achievement title or contribution; correct results appear without losing keyboard focus.
- [ ] **CP-105:** Open achievement details; view full contribution, outcome, occurrence date and timestamps.
- [ ] **CP-106:** Edit achievement; updated values persist after navigation and reload.
- [ ] **CP-107:** Save a draft with a title only; confirm it shows as a Draft and can be completed later.
- [ ] **CP-108:** Attempt to record without a contribution; validation prevents save without destroying input.
- [ ] **CP-109:** Archive an achievement; verify it is excluded from Active filter, appears under Archived, and can be restored.
- [ ] **CP-110:** Delete an achievement; explicit confirmation appears, and the record disappears only after confirmation.
- [ ] **CP-111:** Edit profile with name, headline, summary and email; verify persistence after reload.
- [ ] **CP-112:** Switch theme between light, dark, and system; preference remains after reload.

## Backup and recovery

- [ ] **CP-201:** Settings → Export generates a JSON file with correct profile and achievement counts.
- [ ] **CP-202:** Add/change a demo entry, then import the earlier JSON; preview explains the replacement scope and counts.
- [ ] **CP-203:** Confirm restore; the original records return and newer changes are replaced.
- [ ] **CP-204:** Attempt a malformed JSON import; report an error without changing existing records.
- [ ] **CP-205:** Try importing a valid-looking backup with mismatched counts; validation prevents restore.
- [ ] **CP-206:** Confirm backup warning explains that exports are unencrypted and local records do not sync.

## Device and PWA

- [ ] **CP-301:** Test iPhone Safari at a narrow width. Bottom navigation is visible; no clipped inputs or horizontal scrolling.
- [ ] **CP-302:** Test iPad. Navigation and all modal forms remain readable and operable.
- [ ] **CP-303:** Test desktop Chrome or Edge. Sidebar, Home, Vault and Profile layouts remain consistent.
- [ ] **CP-304:** Install to the Home Screen; close and reopen. Local records remain.
- [ ] **CP-305:** After initial online visit and worker activation, disconnect from network and reopen. Cached shell and local records load.
- [ ] **CP-306:** Use keyboard-only navigation where available, including tabbing through forms and Escape to close dialogs.

## Release policy

v0.1.0 is the first usable **development increment**. It should not store irreplaceable career records until CP-201 through CP-205 have been manually verified. Full P0 data-integrity and recovery qualification remains the gate at v0.1.2.
