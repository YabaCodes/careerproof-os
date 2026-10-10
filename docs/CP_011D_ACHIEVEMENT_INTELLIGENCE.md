# CP-011D — Expanded Achievements, Evidence & Competency Linking

**Proposed version:** `0.1.1-alpha.9`  
**Status:** Feature PR #13, not yet deployed or physically accepted.  
**Prerequisite:** User accepted alpha.8 Experience Portfolio on iPhone.

## User-facing scope

The existing Quick Capture remains small: title, personal contribution, date, category and outcome. An **optional expandable section** allows enrichment without slowing down ordinary capture:

- Situation/challenge, actions, notes, explicit Confidential/Standard private flag, and selected employment role.
- Multiple linked Experiences with optional **primary** Experience. Link relationships retain canonical project IDs and do not duplicate project details.
- Multiple active competencies, based on the four built-in categories and 32 seeded names; no default proficiency, inferred verification or career-readiness score.
- One or more impact metrics with metric name, unit, optional baseline/result/reported numeric values, direction and measurement-source note. All values are user-entered.
- User-entered **description**, **URL**, or **document reference** evidence. URL inputs require safe HTTP(S) without embedded credentials; the UI never asserts external verification or uploads a file.

The Achievement detail view shows the saved record with its role, projects, competency examples, metrics, evidence and privacy status. The Vault provides filters for role, Experience, competency, occurrence date range and status, retaining filters during screen redraws.

A new **Competency Library** under Career Profile (also available in the desktop sidebar) shows 32 built-in competencies and custom entries grouped into seeded categories, achievement examples, and a simple search/category filter. Custom skills may be created, edited, archived; the built-in taxonomy identity is read-only. Archiving hides a custom skill from the active library while preserving linked historical records.

The mobile bottom navigation remains **Home / Vault / Add / Profile / Settings**. No new mobile tab or task tracker.

## Data and relationship contracts

- Reuse existing **IndexedDB schema 2**, original achievement columns, `impactMetrics`, `evidenceReferences`, `recordLinks`, `competencyCategories`, `competencies`. No database upgrade, new store, server, or backup-format change.
- `saveAchievementBundle` performs a source-record revision check, validates selected role/project/competency IDs and unique relationships, preserves retained link identities and user notes, checks metric/reference revisions, validates the complete prospective collections, then commits all changes in a **single IndexedDB transaction**. Invalid input aborts the entire transaction.
- Editing existing achievements retains stable achievement IDs and original creation dates. Archive/restore and deletion continue preserving/removing dependent evidence appropriately under the original data contracts. Previously saved CP-011C project-link relationships remain intact unless the user deliberately changes selections.
- Standard-private is still local-only. **Confidential** entries are the default and may contain derived sensitive material. External sharing/CV generation is deferred; future generators must exclude confidential sources by default.
- Evidence references do not constitute independent verification. No invented metric or qualification; all competence associations remain user-entered.
- Legacy v1 import remains supported; private backup v2 includes every enriched record and link. Never overwrite actual user data during manual testing.

## Acceptance on physical iPhone

- [ ] D201: Version alpha.9, all previously entered achievements, Experience links, employers/roles/credentials and backup history remain intact.
- [ ] D202: Quick Capture starts compact, Outcome still scrolls above keyboard; optional advanced section expands and collapses reliably on iPhone.
- [ ] D203: Edit an existing achievement; inspect preserved role/project selection and complete legacy notes. Add/update/remove synthetic metrics and references, including URL validation.
- [ ] D204: Link an achievement to two Experiences (select one primary) and multiple competencies, save/reload, then inspect linked examples from project and competency screens. No duplicate source records.
- [ ] D205: Create/edit/archive a custom competency; the four seeded categories and 32 built-in competencies remain intact. No proficiency score or independent verification claim.
- [ ] D206: Filter Vault by role, Experience, competency, date interval, archived/draft/recorded status; check filters and keyboard behavior on the iPhone.
- [ ] D207: Archive/restore an enriched achievement, ensure metric/reference/link persistence, then verify deletion on **synthetic** data with deliberate confirmation; never erase the user's actual career record to test.
- [ ] D208: Export a full version-2 JSON backup; verify counts for enriched fields, metrics, evidence, and typed relationships without restoring over live records. Backups are not encrypted and must be kept secure.
- [ ] D209: Verify light/dark themes, no 320–430px overflow, intact navigation, installed PWA offline reopen, safe version update and accurate saved success state.

Browser Chromium CI is necessary but **not proof** of iOS WebKit, keyboard, Safari storage or real installed PWA behavior.

## Out of scope

Proficiency L1–L4 assessment, automatic evidence breadth, generated performance reviews, CV export, job-fit analysis, AI inference, attached employer documents, cloud sync, new account creation and work task-management. These remain future milestones. CP-011E covers integration, final recovery checks and P0 qualification.
