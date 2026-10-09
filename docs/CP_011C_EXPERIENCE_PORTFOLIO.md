# CP-011C — Experience Portfolio (v0.1.1-alpha.8)

**Status:** Implemented on an unmerged feature branch; release pending CI and physical iPhone acceptance.

## Capability

A new **Experience Portfolio** screen is accessible from the Profile page and (on desktop) the sidebar. Mobile navigation keeps the same five positions: Home, Vault, Add, Profile and Settings.

Experience records can represent **Project**, **Initiative**, or **Ongoing responsibility**. Each record supports name, type, status (planned/active/on-hold/completed), optional employer, partial start/end dates (year/month/day), objective, scope, personally owned responsibilities, technologies, outcome, and confidentiality. Default confidentiality for a new experience is **Confidential**.

The index is intentionally compact: heading/type, employer/date/status, and a two-line preview. Each project expands independently to reveal its remaining fields, linked roles and linked achievements, with Edit, controlled Delete, and **New achievement** actions. Search by text and filter by experience type or status. No Gantt, vendor meeting, task or project schedule feature.

## Relationships and data integrity

- Reuses **existing IndexedDB schema version 2** stores `projects` and `recordLinks` with exact IDs, record revision checks and persistent dataset-generation protection. No schema migration or backup-version change.
- Employer references use canonical employer IDs, never duplicated company names. Multiple employment roles may be associated with one project via `role-project` links.
- `database.savePortfolioProject()` commits project edits, added/removed role links, and validation **atomically**. Retains existing matching role link IDs and notes; rejects duplicate and incompatible employer/role links with transaction rollback.
- A new achievement created from an open project is linked using a single transaction including the achievement and an `achievement-project` link. Existing achievement capture remains unchanged when not launched from project context.
- Existing achievement links are shown inside the project; CP-011D adds general role/project/competency linking controls later.
- Referenced projects **cannot be deleted** until linked roles are removed deliberately and linked achievements are handled in a future explicit unlink workflow. Unreferenced projects require confirmation before permanent deletion. No silent cascades.
- Full **private** backup v2 already includes all projects, links, dates, and privacy flags; external-facing documents are out of scope and must not expose confidential details.
- All test career data is synthetic and is never seeded into the live application.

## Acceptance after merge — CP-C201–209

- [ ] CP-C201 App Settings reports **v0.1.1-alpha.8**; existing profile, achievements, education, credentials, roles and backups remain intact.
- [ ] CP-C202 On iPhone, go Profile → Open Experience Portfolio and return. The existing compact 5-icon navigation remains unchanged and the screen does not overflow horizontally.
- [ ] CP-C203 Add a **Project**, an **Initiative** and an **Ongoing responsibility**. View their two-line overviews; expand one to show full descriptions and independently collapse it.
- [ ] CP-C204 Add/edit project status and a partial start/end date, then reload. No month/day precision invented; empty dates remain empty.
- [ ] CP-C205 Select an existing employer and one or more of its roles; save/reopen. Change the employer and verify incompatible roles are cleared, rather than incorrectly linked.
- [ ] CP-C206 Open a project and use **New achievement**. Save a synthetic draft/recorded achievement; verify it appears under the project and in Vault. Confirm its link remains after reload.
- [ ] CP-C207 Deleting a linked project is blocked and preserves linked achievements; delete only a **synthetic unlinked** project with confirmation.
- [ ] CP-C208 Export backup, verify its project and recordLink manifest counts without restoring over the user's live data. Avoid sharing confidential work details.
- [ ] CP-C209 Verify light/dark themes, mobile form keyboard/scroll and date precision selectors, offline reopen, and the alpha.7 PWA update controls. **Do not uninstall the PWA or clear local storage.**

Browser CI exercises the screen and data contracts, but does not certify actual iPhone Safari or the installed iOS PWA.

## Scope boundaries

CP-011D is planned for general achievement metadata, evidence references, competency links, and explicit cross-project relinking. CP-011E is for end-to-end integration, backup and release qualification. Do not interpret this portfolio as a task-management, scheduling or vendor-governance product.
