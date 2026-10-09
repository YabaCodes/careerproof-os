# CP-DRG-001 — Design Decisions, Actual Status and Codex Handover

**Last reviewed:** 2026-10-09. **Owner approval:** Product design and P0/P1 scope approved in the CareerProof planning conversation. **This document is the starting handover record, not an assertion that planned functionality has shipped.**

## 1. Current truth: repository and release state

- GitHub repository: **YabaCodes/careerproof-os**, default branch `main`.
- Deployment: GitHub Pages via **GitHub Actions**, build output `dist/`. Public URL: https://yabacodes.github.io/careerproof-os/
- Tech: TypeScript/DOM, compiled ES modules, CSS tokens, IndexedDB, service worker. Build/test: `npm test`; source modules under `src/`, `styles.css`, `public/`; CI at `.github/workflows/deploy.yml`.
- Current app semver according to package/source/release notes: **v0.1.0**; DB schema **1**; JSON export format **1**. Hotfix kept the 0.1.0 version.
- Implemented from README/source: basic Profile; Quick Capture (draft/recorded); Vault search/filter/sort/edit/archive/restore/delete; basic home stats; local persistence; JSON backup and restore; responsive themes/PWA shell.
- The original deployment selected **branch root** and served source `index.html` without compiled `app/app/main.js`, leaving users at 'Opening CareerProof…'. The GitHub Pages source was corrected to Actions, and the build/deploy completed successfully.
- Original v0.1.0 had dialog click-through behavior and visually uneven mobile navigation. **PR #1** (`v0.1.0 UI Hotfix 1: dialogs stay open while typing, even mobile nav`) was merged into `main` on 2026-10-09. It introduced scoped direct-backdrop interaction and nav alignment fixes plus regression tests and service-worker cache update.
- **Verification gap:** User has *not yet confirmed* on-device acceptance of the merged hotfix in this conversation. Treat v0.1.0 UI as **needs manual acceptance**, not 'fully validated'.
- At this handover, **v0.1.1 has NOT begun**. Existing source might advance after this documentation PR; always inspect current code/history at task start.

## 2. Decision register

| ID | Decision | Rationale / implementation implication |
|---|---|---|
| DEC-001 | Integrated CareerProof OS (combined achievements + growth + intelligence) | Do not build four disconnected apps or only a résumé generator |
| DEC-002 | Initial niche: technical professionals/engineers/TPMs/aspiring leaders | Realistic workflow, but preserve applicability outside projects |
| DEC-003 | Eight long-term modules with shared data | One achievement/project can serve multiple outputs |
| DEC-004 | P0 first, four limited P1 features in initial development cycle | Self-assessment, review, CV, pasted job match; AI optional/later |
| DEC-005 | Local-first PWA/IndexedDB on GitHub Pages | No local admin installs needed; low-cost initial build; no automatic sync |
| DEC-006 | Structured relational *logical* model with stable IDs and migrations | Preserve data and future backend portability |
| DEC-007 | Separate date precision from exact-day timestamps | Do not fabricate historical dates |
| DEC-008 | Keep proficiency, evidence breadth, and role fit separate | Explainable without false skill precision |
| DEC-009 | Four original proficiency levels with historical self-assessments | No automatic certification or skill score |
| DEC-010 | 32 original built-in competencies, four categories + custom | Stable taxonomy IDs, rubric versioning, custom expansions |
| DEC-011 | Editable source-linked CV/review snapshots | Preserve manual edits when source changes |
| DEC-012 | Job matching uses manually pasted descriptions and transparent requirement matrix | No live listing, ungrounded fit percentage or eligibility inference |
| DEC-013 | Confidential records excluded from externally shareable outputs by default | Distinguish private full backup from export intended for sharing |
| DEC-014 | Mobile-first and design-token consistency | Avoid crowding, overlapping layouts and inconsistent fonts |
| DEC-015 | Five final destinations: Home/Vault/Growth/Studio/Profile | Reveal only implemented destinations; global Quick Capture |
| DEC-016 | User controls merge/release; agents use branch + PR | No unsolicited direct changes to production |
| DEC-017 | First release must be useful, not empty app shell | v0.1.0 includes achievement capture and storage |
| DEC-018 | Honest testing: browser-device tests separate from automated build | Prior deployment and modal regressions demonstrate need for UAT |
| DEC-019 | Personal records never committed to public GitHub | Use generic synthetic data in docs and tests |
| DEC-020 | Use GitHub documentation as durable Codex source of truth | Do not assume Codex has full past chat history |

## 3. Design artifacts and precedence

These files reconstruct the product decisions from extensive discussions, including the formal design gate's amendments:

- `docs/PRODUCT_SPEC.md`: CP-FDS-001 functional + CP-UX-001 experience requirements.
- `docs/DATA_ARCHITECTURE.md`: CP-DDS-001 target schema, migration and backup contract.
- `docs/CAREER_INTELLIGENCE.md`: CP-CIF-001 competency/evidence/job matching logic.
- `docs/ROADMAP.md`: CP-DRG-001 scope, module tracker, acceptance gates.
- `AGENTS.md`: implementation and PR policies.

Precedence in a conflict:
1. Explicit latest **user-approved** decision or change request.
2. Signed-off requirement amendments in the decision register.
3. Current relevant specification (proposed requirements).
4. Existing tests and shipped implementation (**only** as evidence of current state, not as an override of intended functionality).

Do not silently reconcile contradictions when they affect persistent data or user expectations; raise a short question. Update the relevant documents with the chosen resolution in the PR.

## 4. Key design review corrections (CP-DRG-001)

1. CV requires additional optional contact fields in profile.
2. Use precision-aware historical dates for new role/project/achievement records; v0.1.0 achievement `occurredOn` must migrate losslessly.
3. Generated documents/analyses require source ID/revision snapshots and explicit stale warnings, not automatic regeneration.
4. Proficiency is *self-assessed*, evidence breadth is a *record count/context measure*, neither is independent skill verification.
5. Relationship operations/deletion require explicit impact view and transactional integrity.
6. Job requirements are not only skills: qualifications, credentials, experience, and eligibility require distinct interpretation.
7. Successful 'Export generated' ≠ protected off-device backup; no encryption or cross-device sync yet.
8. v0.1.0 captures achievements; v0.1.2 qualifies complete P0 recovery/integrity.
9. Studio/Growth screens are introduced when functional, not displayed empty in v0.1.0.
10. GitHub Pages deploys compiled `dist/`, not the source HTML files from the root.

## 5. Known limitations and outstanding validation

**Current implementation limitations:**
- Per-browser/device IndexedDB; no cross-device sync.
- JSON backups are unencrypted.
- No employer/role/project relationships, built-in competency intelligence, reviews, CVs or job matching at v0.1.0.
- Browser storage is not durable in all failure scenarios; backups are necessary.
- SVG PWA icon installation support may vary across devices.
- UI hotfix automated tests do not prove keyboard/iPhone interaction.

**Before v0.1.1**: On an actual iPhone, test entering achievement title/contribution/date/outcome and opening Settings without the modal closing; verify evenly spaced navigation and safe-area layout; save/edit/archive/reopen; test backup restore with synthetic data. If issues persist, create a targeted bugfix PR first. **Do not assume acceptance from merged status.**

**For v0.1.1**: Formal acceptance of v1→v2 IndexedDB migration design; role/project reference behavior, date precision handling, old backup migration or clearly scoped compatibility; verify no data loss. Treat these as work to implement, not already tested.

**Later open implementation choices** (do not block documentation PR):
- Exact technical mechanism for target precision-date representation and on-disk upgrade adapters.
- How comprehensive `recordLinks` transactional helpers are exposed without bloating UI.
- Final authoring and review of all 32 competency-specific behavioral rubrics (only three exemplars explicitly specified).
- Usability study of Quick Capture (<60s target), product adoption, pricing and willingness-to-pay validation.
- Future encryption/cloud synchronization/security controls; out of current P0/P1 scope.

## 6. First Codex onboarding task (read-only)

Use this prompt after the documentation PR is merged:

> Read AGENTS.md and all linked CareerProof documentation. Inspect the current code, schemas, tests, README and merged PR history. Compare planned requirements with **actually implemented** functionality. Report your understanding of the eight modules, approved P0/P1 scope, current state and next implementable milestone. Flag any contradictions, migration risks or missing acceptance evidence, especially real-device acceptance of v0.1.0 UI hotfix. **Do not modify any files yet.** We will confirm your assessment before authorizing v0.1.1.

## 7. Future workflow

Plan/review here in ChatGPT; sync approved design decisions into GitHub docs; use Codex to implement/test on a branch and open PR; user reviews/merges; GitHub Actions deploys; then test on an actual device. Keep this status document and ROADMAP.md updated as part of each feature PR.

## 8. Privacy reminder

Repository is public. Specifications may describe engineering skills and generic supplier workflows, but **must not** contain real confidential employer blueprints, machine defects, vendor negotiation records, contracts, internal names/IDs, or personal career/finance data. Keep sample records fictional.
