# CP-DDS-001 — Data Architecture and Migration Contract

**Status:** Approved target architecture with CP-DRG-001/CP-CIF-001 amendments, not a description of existing stores. **Date:** 2026-10-09.

## 1. Current implementation vs target

**Shipped v0.1.0:** `careerproof-local` IndexedDB at schema version **1**, with `profiles`, `achievements` and `meta` stores. Existing Achievement records use `occurredOn` (exact local date) and Profile has displayName/headline/summary/email/location. JSON backup format **1** includes one profile + achievements. All of this must remain compatible on migration.

**Target P0/P1 model:** 17 principal logical collections described below plus internal metadata. New stores and date-precision records require carefully tested migrations; do not treat this document as a reason to reset version-1 data.

IndexedDB does **not** enforce relational foreign keys. Repository/domain services must implement ID integrity and atomic multi-store updates. No remote backend for v0.1.x.

## 2. Universal record conventions

- User-created IDs: stable UUID strings; current local profile uses reserved `local-profile` ID.
- `createdAt` and `updatedAt`: UTC ISO 8601 timestamps; `revision`: positive integer and incremented on edits. Preserve existing values on migration.
- Trim, normalize and validate text; enforce enumerated statuses; allow unknown optional values as `null` rather than fabricated defaults.
- Strict, finite numeric values and explicit units; no implicit currency conversion or inferred business cost.
- **PrecisionDate:** `{ value: "YYYY"|"YYYY-MM"|"YYYY-MM-DD", precision: "year"|"month"|"day" }`. Preserve precision and compare using earliest/latest compatible bounds; never pretend unknown month/day equals a specific date.
- Records use IDs in references; changes to display names should appear automatically.
- Ownership: single local profile in v0.1.x. Future cloud owners need deliberate security design, not speculative fields.
- Archive where defined, distinct from permanent delete.

## 3. 17 target collections

Fields marked **required** below are required for a *completed applicable record*. Optional fields may remain empty.

### P0 — Professional identity

1. `profiles` (1 current local profile): `displayName`, `headline`, `summary`, `primaryDomain`, `primaryRoleId`, `careerInterests[]`, `locale`, and CV-related optional contact fields `email`, `phone`, `location`, `website`, `professionalLinks[]`. Do **not** require personal contact data to use Vault. Preserve shipped profile fields and reserved ID.
2. `employers`: **`name`** (1–160 chars); optional `industry`, `location`, `website`, `description`.
3. `roles`: **`employerId`, `title`, `startDate`**; optional `endDate`, `isCurrent`, `employmentType`, `responsibilities`, `leadershipScope`, `technologies[]`. One employer has multiple roles; overlapping roles allowed. A current role has null end date; only one role may be designated `primaryRoleId` (others may also be active). End must not definitively predate start.

### P0 — Qualifications and experience

4. `education`: **`institution`, `qualification`**; optional `discipline`, `startDate`, `completionDate`, `description`, `honors`.
5. `credentials`: **`name`, `issuer`**; optional `issuedDate`, `expirationDate`, `credentialId`, `verificationUrl`, `notes`. Validity is user-entered/derived, not independently verified.
6. `projects`: **`name`, `experienceType`** (Project / Initiative / Ongoing Responsibility); optional `employerId`, start/end dates, `status` (Planned/Active/On Hold/Completed), `objective`, `scope`, `personalResponsibility`, `technologies[]`, `outcome`; `confidentiality` (Standard Private / Confidential).
7. `achievements`: **`title`, `status`** (Draft/Recorded/Archived), `preArchiveStatus` for archived; `contribution`, `occurredStart` (required if Recorded), `occurredEnd`, `roleId`, `situation`, `actions`, `outcome`, `impactCategory`, `confidentiality`, `notes`. Recorded requires a nonblank contribution; Draft only requires title. **Migration must translate existing `occurredOn` into exact-day `occurredStart` without loss**, and preserve `id` / timestamps / revision. Keep adapters as needed for old backup files.
8. `impactMetrics`: **`achievementId`, `metricName`**, optional `unit`, `baselineValue`, `resultValue`, `reportedValue`, `direction`, `sourceNote`; at least one finite numeric value. Only calculate percentage changes when baseline is nonzero and values are compatible. No inferred cost or impact.
9. `competencyCategories`: **`name`, `isBuiltIn`, `sortOrder`**, optional description.
10. `competencies`: **`categoryId`, `name`, `normalizedName`, `isBuiltIn`, `status`**; optional `taxonomyKey`, `aliases[]`, description and stable rubric ID. Unique category+normalized name. Built-in taxonomy keys/IDs survive upgrades; user-custom definitions preserved.
11. `evidenceReferences`: **`achievementId`, `referenceType`, `label`, `referenceValue`**; optional `userReviewedAt`, notes. Reference types: Description, URL, Document Reference; no file uploads in initial cycle.
12. `recordLinks`: **`linkType`, `sourceId`, `targetId`**; optional `isPrimary`, `note`. Allowed directed types: Role–Project, Achievement–Project, Achievement–Competency. Composite uniqueness `(linkType, sourceId, targetId)`. One primary project per achievement; multiple non-primary links allowed. `note` may explain why an achievement demonstrates a competency.

### P1 — Assessment, documents and job analysis

13. `proficiencyAssessments`: **`competencyId`, `selfAssessedLevel` (1–4), `assessmentDate`, `rubricVersion`**; optional rationale, development note, assessment context. Append historical assessments; do not replace old ones. The latest dated assessment is shown as current; absent = Not Assessed.
14. `careerDocuments`: **`documentType` (Performance Review/CV), `title`, `templateId`, `status`, `contentBlocks[]`, `excludeConfidential` (default true)**; optional review period, `sourceDataRevision`, `generatedAt`. Each content block has stable ID, type, order, editable text and `userEdited` flag. Saved **snapshot** distinct from source records.
15. `documentSources`: **`documentId`, `sourceType`, `sourceId`, `sourceRevision`**; optional order and `sourceLabelSnapshot`. Link generated statements to their original career records; show missing or revised sources.
16. `jobAnalyses`: **`roleTitle`, `jobDescription`, `analysisStatus`**; optional employer/location, `matcherVersion`, `sourceDataRevision`, `analyzedAt`, notes. Pasted text cap 50,000 characters.
17. `jobRequirements`: **`jobAnalysisId`, `requirementText`, `importance`, `requirementCategory`, `extractionMethod`, `userReviewed`**; optional original-text span/reference, `mappedCompetencyIds[]`, `matchOverride`, user note. Categories: Competency, Experience, Qualification, Credential, Technical Knowledge, Practical Eligibility, Preference. No automated visa/work authorization inference.

**Internal `meta`:** app-change timestamp, schema metadata, backup export timestamp, global career dataset revision, taxonomy/rubric/matcher versions and preferences as needed. Don't increment global revision for cosmetic settings changes.

## 4. Relationships and deletion behavior

| Relation | Cardinality / rules |
|---|---|
| Employer → Roles | 1:N (required parent for Role) |
| Role ↔ Project | M:N via recordLinks |
| Role → Achievement | Achievement may have primary role ID or null |
| Project ↔ Achievement | M:N via recordLinks; at most one primary |
| Achievement ↔ Competency | M:N via recordLinks |
| Achievement → Impact Metrics/Evidence | 1:N |
| Competency → Assessments | 1:N history |
| Career Document → Sources | 1:N; each source references canonical record |
| Job Analysis → Requirements | 1:N |

- Rename/update: preserve ID and all links.
- Delete employer with dependent roles: **block** until roles reassigned or explicitly removed; do not cascade achievements.
- Delete role: display dependents, allow reassign/unlink; preserve achievement records.
- Delete project: disclose affected links, unlink safely and retain achievements.
- Archive achievement: retain metrics/references/links; exclude from active evidence-breadth rules.
- Permanently delete achievement: explicit confirmation; remove own metrics/references/recordLinks atomically and flag affected document source snapshots.
- Built-in competency: cannot permanently delete; custom competency deletion requires safe unlinking and confirmation.
- Delete career document/job analysis: delete only its dependent document-source/requirement entries, never original career sources.
- Prefer a warning and safe block if affected dependencies can't be reconciled.

## 5. Performance and indexes

Initial indexes: Employers normalized name; Roles by employer/current/start; Projects employer/status/start; Achievements status/occurred/updated/role; Impact Metrics and Evidence by achievement; Competencies category/name; Record Links unique composite plus source and target; Assessments competency/date; Documents type/date; Document Sources document/source; Job Analysis modified/role; Requirements analysis ID.

Local normalized text search is sufficient initially. With >1,000 achievements, benchmark responsiveness on phone rather than promising speed.

## 6. Migrations: required before v0.1.1

- Production v0.1.0: physical DB version 1, backup format version 1. **Never write an untested schema-version bump.**
- Implement a forward-only IndexedDB `onupgradeneeded` migration for new stores/indexes, preserving existing stores and records. Handle `versionchange` in other tabs and blocked upgrades safely.
- If modifying achievement/profile shape, either migrate stored objects transactionally or provide tested compatibility adapters; old backups must be explicitly supported or handled with a safe, informative import path.
- Tests: seeded v1 database with real-shape synthetic profile, Draft/Recorded/Archived entries, IDs, revisions, and backup. Verify migration retains each exactly or through documented lossless translation; verify rollback/blocked/invalid scenarios.
- Newer unsupported database must not be silently downgraded. Data format migration separate from physical IndexedDB version bump.
- Plan for eventual PostgreSQL synchronization without claiming that local IndexedDB enforces foreign keys or cloud isolation.

## 7. Backup / restore contract

**Backup JSON**: `manifest` with `format: careerproof-backup`, format/schema/app versions, export UTC timestamp, record counts; `collections` of all relevant stores; portable non-device settings. Include stable IDs, revisions, precision dates, links, saved P1 analyses/reports. Current v1 exports only profiles and achievements.

**Restore**:
1. Select file; enforce size/JSON limits.
2. Validate complete structure, types, dates, enumerations, uniqueness, referential integrity and expected collection counts *before* touching current records.
3. Show export date/counts and full-replacement warning; encourage exporting current data first.
4. Apply in a controlled multi-store transaction; preserve current data on failure.
5. Verify contents and key links before reporting success.

No automatic merge in v0.1.x. Exported JSON is **unencrypted** and may contain sensitive work history. A successful browser download is not proof that a file was securely backed up.

## 8. Audit / invalidation

- Individual record `revision` increments on content edits. Derived document source links store source ID/revision.
- `sourceDataRevision` is a monotonic global career-data revision for saved job-analysis freshness (not a skill score).
- Stale reports/job analyses flag changed/missing sources, retain manual edits and overrides; regeneration requires an explicit user action and preview.
- Data Health Check: distinguish broken references/type errors (critical) from missing optional outcomes/metrics (advisory); **never delete user content automatically** as a repair.
- Conflict protection: multiple browser tabs cannot silently overwrite a newer revision.
- Do not store actual user records in repository fixtures or PR descriptions.

## 9. Security and commercialization constraints

Local-first does not imply encrypted. Source files on public GitHub Pages are public; personal records must not be bundled into the site. No hardcoded private tokens or third-party AI calls. Cloud ownership/tenant security, encryption, compliant provider integrations, and subscription billing are **future separate design gates**.

## 10. Acceptance coverage

Integration tests must cover (a) partial date chronology/overlap; (b) ID/link uniqueness; (c) orphan prevention and atomic delete/unlink; (d) v1 migration and backup compatibility; (e) invalid backup rollback; (f) document snapshot/edited block preservation; (g) archived evidence exclusion; (h) job analysis stale flags; (i) privacy filtering for externally shared outputs.
