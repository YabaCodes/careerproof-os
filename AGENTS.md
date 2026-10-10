# CareerProof OS — Agent Instructions

This file is the entry point for Codex and other coding agents working on CareerProof OS. **Read it before changing code.** Read the linked specifications relevant to the requested task. These documents are the intended product design baseline; the source code and tests are the authority on what has actually shipped.

## Essential references

- [Product & functional specification](docs/PRODUCT_SPEC.md) — mission, users, modules, screens, workflows, acceptance criteria.
- [Data architecture](docs/DATA_ARCHITECTURE.md) — schemas, integrity, backup/migration rules and compatibility.
- [Career intelligence framework](docs/CAREER_INTELLIGENCE.md) — taxonomy, proficiency, evidence, job matching.
- [Roadmap and release gates](docs/ROADMAP.md) — P0/P1 scope and v0.1.x milestones.
- [Milestone tracker](docs/MILESTONE_TRACKER.md) — authoritative per-feature status (Not Started → Planned → In Development → In Review → Merged → Device Testing → Accepted), PRs, test baselines and device evidence. **Update it in every PR.**
- [v0.1.1 implementation brief](docs/V0.1.1_IMPLEMENTATION_BRIEF.md) — historical: the delivered v0.1.1 scope, legacy migration contract and test gates (not authorization to repeat work).
- [Decisions, project status and open questions](docs/DECISIONS_AND_STATUS.md) — agreed choices and what needs verification.
- [Existing manual acceptance tests](docs/ACCEPTANCE_TESTS.md) and [release notes](docs/RELEASE_NOTES.md).
- [README](README.md) — current build, local development and deployment procedure.

## Product mandate

CareerProof OS is an integrated, private-first professional record and career intelligence PWA. The core loop is **Capture experience → Link evidence → Understand demonstrated capabilities → Prepare professional materials → Evaluate opportunities**.

Initial audience: engineers, technical PMs and professionals moving into leadership. It must also accommodate non-project-oriented career paths. Do not turn it into a general task tracker, job board, gamified habit app or ungrounded AI career score.

Eight long-term modules: (1) Career Profile, (2) Achievement Vault, (3) Experience Portfolio, (4) Competency Intelligence, (5) Career Roadmap, (6) Performance & Promotion Studio, (7) Job Readiness & Interview Studio, (8) Career Analytics & Insights. Their completion stages differ; see ROADMAP.md.

## Mandatory engineering conventions

1. **Preserve data.** Current records live in browser IndexedDB. On every schema change, design and test a forward-only migration that preserves v0.1.0 profiles, achievements, IDs, timestamps and revisions. Do not reset/recreate user stores or silently replace backups. Backup format versions and database versions are independent from app semver.
2. **Work against the actual repository.** Read current code, git history and tests before assuming a planned feature exists. Do not substitute a one-file deployment for the existing TypeScript source unless explicitly approved.
3. **Modular architecture.** Keep domain types/validators in `src/domain`, data operations in `src/data`, user interaction in `src/app`, reusable UI in `src/ui`; use centralized styling. Screens call shared domain/data services rather than duplicating persistence/business rules.
4. **Traceability.** Source records are primary; evaluations, CVs and performance reviews are derived, editable snapshots linked back to source IDs/revisions. Do not overwrite manually edited documents on source changes. Mark outdated analyses and offer user-controlled refresh.
5. **Explainability.** Self-assessed proficiency, evidence breadth and job-requirement match are distinct. Never fabricate metrics, verified credentials, achievements, eligibility or hiring probabilities. Do not present a numeric 'career readiness' or hiring-probability score.
6. **Privacy and security.** Career records are local by default; no automatic uploads, cloud sync or third-party AI calls in P0/P1. Confidential records are excluded from exports intended for external sharing by default (full private backup is a separate, explicitly sensitive operation). Never commit user career data or employer proprietary records; tests use synthetic fixtures. Treat imported JSON, pasted job descriptions and URLs as untrusted input.
7. **Good interaction behavior.** Mobile-first; keep capture fast and forms simple. Fix the original modal click-through bug permanently: only direct backdrop clicks dismiss the modal. Fixed bottom navigation should have equal positions and respect device safe areas. Validate on iPhone Safari/PWA, iPad and desktop where possible. Keep UI font/spacing/colors centralized; adhere to WCAG 2.2 AA as a target.
8. **Deployment.** Repository uses TypeScript, `npm test` (build + tests) and GitHub Actions to deploy `dist/` to GitHub Pages. Pages source must be GitHub Actions. No secret tokens or runtime backend are required for v0.1.x.
9. **Scope discipline.** Do not conflate P0 and P1. P1 includes *bounded*, rules-driven proficiency, performance review, CV, and manually pasted job-fit analysis. Advanced AI, cloud accounts, billing, live job feeds and role roadmap intelligence are later releases.
10. **Code review safety.** Work on feature branches, create a PR targeting `main`, and **do not merge, force-push, delete branches or deploy directly** without explicit user approval. Document migration risk, changed files, automated test results, manual checks pending, and known limitations. For high-risk data operations add negative/recovery tests.

## Per-increment workflow

- Identify applicable IDs in the specifications (CP-FR, CP/UAT/CIF/INT/STU).
- Inspect implementation and compare it with the requested changes.
- Propose any conflicting design amendments explicitly rather than silently inventing new behavior.
- Implement the smallest coherent, working increment. Update tests and use synthetic fixtures only.
- Run `npm test`; separately report browser/device checks actually performed. Automated tests are **not** proof that iPhone Safari interaction was verified.
- In the *same PR*, update the release notes, relevant roadmap/status docs, applicable acceptance tests, and displayed app version (unless docs-only).
- Report which of the eight functional modules changed, their completion state and remaining work.
- Leave `main` and deployment unchanged pending the user's merge.

## Important historical correction

v0.1.0 was initially deployed from the uncompiled repository root, causing an 'Opening CareerProof…' screen. The deployment method was changed to GitHub Actions. A dialog/backdrop interaction defect and crooked mobile navigation were addressed in merged PR #1 (UI Hotfix 1). **The user confirmed on iPhone that achievement input fields now work and mobile bottom navigation is aligned.** These two defects are accepted, but the rest of the v0.1.0 acceptance plan (notably backup/restore, offline, and deletion/recovery) is not thereby verified. See the v0.1.1 brief.

## When specifications and code disagree

Do not quietly implement a speculative compromise. Note the conflict, distinguish **approved product intent** from **currently shipped behavior**, and use the latest explicit design review decisions in DECISIONS_AND_STATUS.md. Ask the user when the conflict has user-visible or destructive implications. Changes to data contracts require explicit migration and restore-compatibility analysis.

All documentation describes product decisions from the design discussions; it is not a claim that proposed future screens or rules have already been implemented.
