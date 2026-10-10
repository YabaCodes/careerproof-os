# CP-011E — Integration, Backup & Release Qualification

**Accepted candidate:** CareerProof OS `v0.1.1-rc.1`; final version promotion to `v0.1.1` is a separate user-reviewed PR.  
**Status:** RC PR #15 merged/deployed; 42/42 Node and 102/102 browser tests passed; **all eight physical iPhone checks reported passed by the user**. Separate final-version promotion PR pending merge.  
**Scope:** Final integration for `v0.1.1 — Professional Experience & Evidence`. Builds on CP-011A–D and the accepted CP-011D.1 Quick Capture overlap fix.

## What's included

- Independent recovery-qualification tests spanning career roles, education, credentials, projects/initiatives/responsibilities, achievements, partial dates, privacy designations, metrics, user-entered evidence, competencies and typed record links.
- Read-only **Settings → Check data** action: validates the live IndexedDB snapshot, serializes a full format-2 backup, validates the JSON in memory, compares every complete collection and portable preferences against the original snapshot and reports counts and size. The check does **not** export/download, upload, repair, restore, delete, verify the truth of claims, or guarantee future device/browser storage persistence. It retains the existing 12 MiB backup limit.
- **Restore conflict hardening:** a preview captures both dataset generation and source-data revision. Replacement aborts in one transaction if either changed after the file was selected. This prevents a delayed confirmation from silently overwriting ordinary edits in another tab as well as intervening restores. The user must export/review their current work and select the backup again.
- Preserve full format-2 import/export, legacy format-1 conversion, rollback-on-corruption, record IDs, precision dates, revision handling, built-in taxonomy, and established 5-button mobile navigation.
- Candidate version plus service worker cache key updated; all compiled foundation modules remain in the offline app shell.

## Validation strategy and strict release gates

`npm test` must pass the TypeScript build, Node integrity/recovery contracts and browser/mobile/offline suites. The release may be called **ready for user review** on green CI, but not **accepted** until physical installed-iPhone checks pass. Do not automatically merge or tag `v0.1.1`.

### Automated release checks

| ID | Qualification | Target |
|---|---|---|
| CP-E101 | Read-only audit validates all 12 stores and full backup, no data/meta changes | Node |
| CP-E102 | Rich-data round-trip, multi-project primary link, archived custom skill, full preferences | Node |
| CP-E103 | Reject orphaned links, duplicate/invalid records, illegal URLs, wrong privacy, broken taxonomy, incorrect manifests | Node |
| CP-E104 | Prevent replacement after an ordinary write made following restore selection; preserve all records | Node + browser |
| CP-E105 | Legacy format-1 restoration is explicitly full replacement, with seeded built-in taxonomy | Node + existing browser |
| CP-E201 | Settings Check data reports pass, no generation/revision change | Browser |
| CP-E202 | Restore preview blocked after intervening edit, reselection explicitly required | Browser |
| CP-E203 | Profile → Portfolio → achievement details → competency → backup → restore, exact record/relationship parity | Browser |
| CP-E204 | Offline installed-like PWA can reopen Profile, Portfolio, Vault and Competency Library with evidence | Browser |
| CP-E205 | Existing 320–430px iPhone keyboard, modal, disclosure, no-overlap, backup, navigation and app-cache suites remain green | Regression |

### Accepted iPhone checks — 2026-10-10

The user explicitly confirmed all eight physical-iPhone acceptance checks on the **deployed, existing Home Screen PWA running rc.1**, including (1) version and retained records, (2) secure full JSON backup export, (3) read-only Check data, (4) Profile/Experience continuity, (5) achievement metrics/evidence/project/competency linking, (6) Competency Library and Vault filtering, (7) Quick Capture keyboard and corrected label spacing, and (8) offline reopen. This is user-reported device testing; the following detailed E219 synthetic destructive and E220 public-data hygiene checks are distinct from those eight and must not be falsely described as additional user-performed tests.

### Physical iPhone checklist, after user-approved PR merge

- [x] **E211** — Existing Home Screen installation updates to `v0.1.1-rc.1`; no reinstall or storage clearing. Existing personal records and five-button navigation remain intact.
- [x] **E212** — Export a **fresh** full JSON backup from Settings and confirm the file exists in Files or another secure place; never assume the export succeeded simply because a button was tapped. This file is **unencrypted** and must not be shared casually.
- [x] **E213** — Run **Check data** under Settings while online and offline; confirm it reports success and sensible counts without changing records or requesting a file upload. It does **not** replace the separate backup in E212.
- [x] **E214** — Verify Profile employers/roles, education/credentials and Experience Portfolio links, including partial dates and compact cards, with existing records preserved.
- [x] **E215** — Verify rich Achievement edit/save, metric/evidence details, primary project/role/competency links and archived custom-skill history using synthetic entries. This also closes the outstanding alpha.9 feature checks.
- [x] **E216** — Confirm Quick Capture text does not overlap; More details and the iOS keyboard/Outcome field function in both light and dark themes.
- [x] **E217** — Check Vault filters and archived/draft behavior, five-button navigation and no horizontal overflow.
- [x] **E218** — Confirm the existing installed PWA reopens **offline** and stored work remains accessible.
- [ ] **E219** — On a **disposable synthetic data set only**, test restore preview counts, the destructive full replacement confirmation, legacy-format warning and valid backup restoration. **Never restore a synthetic backup over real user records.**
- [ ] **E220** — Confirm no proprietary engineering content was committed to the public GitHub repository or test fixtures; preserve all work-sensitive evidence as local-only, with conservative confidentiality.

### Hold criteria

Any lost/corrupted records, unexpected relationship deletions, broken keyboard/scrolling, failed offline launch, failed backup, false success notification, stale restore overwrite, or regression in mobile controls **blocks release acceptance**.

Device acceptance of the eight listed checks has passed. A *separate* final version-only promotion from `v0.1.1-rc.1` to `v0.1.1` is prepared for user review and full CI. Do not merge automatically or create a release tag. Once merged and deployed by GitHub Actions, verify the final version and preservation of local records on the existing Home Screen PWA. Destructive restore remains appropriate only for disposable synthetic datasets.

## Data-security boundaries

- Browser IndexedDB and downloaded backup are local-only; there is **no cloud sync**.
- The backup file is plain JSON and **not encrypted**. A browser/PWA uninstall or clear-site-data action could permanently remove local information.
- Check data validates structure and recovery-format round-trip, **not** independently verified professional achievements or document authenticity.
- No CV builder, performance report generator, job-fit rating, competency proficiency assessment or employer-document attachment is introduced in this release.
