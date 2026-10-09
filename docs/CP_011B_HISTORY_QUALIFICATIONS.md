# CP-011B — Career History & Qualifications

**Proposed version:** 0.1.1-alpha.5  
**Scope:** User-facing P0 Career Profile expansion; no Experience Portfolio/competency UI and no database schema upgrade.  
**User release gate:** Review/merge PR, validate on iPhone (Safari/installed PWA), confirm retained achievements and backup safety.

## Delivered interfaces

The Career Profile retains the existing professional overview and adds three responsive sections:

1. **Employment History**: employer name, industry, location, website and description; roles grouped under canonical employer IDs; promotions, multiple current jobs and overlapping periods supported.
2. **Role detail**: job title, year/month/day start and end precision, current role, employment type, responsibilities, leadership scope, technologies (comma separated), and explicit primary-role checkbox.
3. **Education**: institution, qualification, discipline, optional study/completion dates, honors and description.
4. **Certifications & Credentials**: credential name, issuer, optional issue/expiration dates, ID, verification URL and notes. Lack of expiration is displayed as "No expiry recorded", not independently certified.

All are accessible from the **existing Profile destination**; mobile navigation remains five evenly spaced items. Dates remain precision-aware, entered year/month/day data is never silently upgraded to an exact day, and null dates stay null.

## Persistence and integrity

- Reuses CP-011A schema-v2 stores \`employers\`, \`roles\`, \`education\`, \`credentials\`; no new physical DB stores, indexes, or backup format.
- All entries use stable UUIDs, created/updated timestamps, optimistic record revisions, dataset-generation checking and strict domain/relationship validation.
- **Primary role** changes use one transaction to upsert the role and update \`profile.primaryRoleId\`. Unchecking the previously primary role explicitly clears it; other records remain unchanged.
- Deletions inspect dependent roles, projects, achievement references, primary-role state and role-project links. Referenced employers/roles cannot be removed until those dependents are deliberately resolved. No cascade loss.
- A current role has a null end date; multiple jobs can be current and date periods may overlap. Bad chronological sequences are rejected using precision-date bounds.
- Existing profile edits preserve extra schema-v2 fields. Backup format 2 includes the new records; legacy format 1 restoration still performs a warned full replacement rather than silently merging.

## Browser validation

Automated coverage in \`tests/browser/career-history.spec.mjs\` exercises:

- Employer and multiple-role CRUD, overlapping current roles, primary designation and explicit clearing.
- Blocking referenced employer/role removal.
- Valid/invalid historical date sequences and precision-preserving edits.
- Education and credential creation/editing, missing expiration date and unsafe URL rejection.
- Full backup-format-2 round-trip with employer/role/education collections and preserved seeded competencies.
- Mobile dialog overflow, unsaved-change confirmation, and persistence after reload.

Run full \`npm test\` plus \`npm run typecheck\` and production \`npm run build\`. Actual results are reported in CI. Chromium is not physical iPhone Safari.

## Physical iPhone acceptance — CP-B201–207

- [ ] CP-B201: Settings displays alpha.5. Existing achievements/profile and the approved app icon remain intact. Do not uninstall, reset browser storage, or restore a backup merely to test navigation.
- [ ] CP-B202: Add employer, edit industry/location, and add two separate positions under the same employer, including an overlapping employment period. No duplicate employer record.
- [ ] CP-B203: Make one position the primary role, change it, then explicitly clear it. Dates with year/month/day precision survive save/reload. Current-role toggle clears the end date.
- [ ] CP-B204: Add/edit education, certification without expiry and optional verification URL. Blank dates remain unasserted; URL errors display without losing entered text.
- [ ] CP-B205: Test deletion on a **synthetic** employer with a role: the app blocks deletion and preserves dependents. Unreferenced synthetic records require confirmation before removal.
- [ ] CP-B206: Export a fresh version-2 backup and verify its manifest counts in a non-destructive preview or separate synthetic-data origin. Do **not** restore over real work records for this check.
- [ ] CP-B207: In both themes, check iPhone modal keyboard/date pickers, 320–430px layouts where practical, compact navigation, save/cancel actions, offline open after installed cache update, and no horizontal overflow.

## Limitations and future releases

Achievement-to-role association/editing remains CP-011D. Project/experience portfolio is CP-011C. Competency self-assessment, job fit, career documents, AI, accounts and cloud sync are not part of this PR.

Backups remain unencrypted and unsynced. Large-data mobile performance remains unbenchmarked. Do not treat browser-only test results as proof of native Safari input behavior.
