# CP-011A — Database Migration & Recovery Foundation

**Increment:** 0.1.1-alpha.1 · **Physical schema:** 2 · **Backup format:** 2 · **Taxonomy:** 1.0

Implemented on the feature branch for review. This is the CP-011A foundation, not acceptance of the complete v0.1.1 milestone. CP-011B–E screens and workflows have not begun. No merge or deployment is authorized by this PR.

## Persistence contracts

The existing database name remains `careerproof-local`. Schema 2 has these 12 P0 collections plus internal `meta`:

| Collections | Contract |
|---|---|
| profiles, employers, roles | Local identity and linked employment |
| education, credentials | Qualifications with nullable precision dates |
| projects, achievements | Experience and contributions; explicit privacy |
| impactMetrics, evidenceReferences | Finite reported measurements and user-entered references |
| competencyCategories, competencies | Four built-in categories, 32 stable built-ins, custom definitions |
| recordLinks | Directed role-project, achievement-project, achievement-competency links |

There are no P1 stores. Every persisted record has a stable ID, UTC ISO timestamp strings with milliseconds, and positive safe-integer revision. Optional text uses blank strings, optional IDs/dates/numeric values use null, and string lists use arrays. Existing non-UUID IDs remain accepted (nonblank strings, at most 200 characters); new UI IDs continue to use UUIDs.

Shared repository writes validate the resulting dataset in the same transaction as the write. They enforce all references, global ID uniqueness, category/name uniqueness, typed-link uniqueness, and at most one primary project per achievement. A role-project link cannot conflict with an explicitly chosen project employer. Overlapping roles are allowed. Unreconciled parent deletions block; achievement deletion atomically removes only its metrics, evidence and source links. Built-in taxonomy records cannot be permanently deleted.

The original `technical` impact key remains supported. New P0 keys `customer` and `technical-innovation` are distinct and do not relabel historical entries.

## Additive migration

One versionchange transaction creates ten new stores, adds P0 indexes, changes the occurrence index from `byOccurredOn` to `byOccurredStart`, and transforms existing profile/achievement objects in place. It never deletes or recreates existing stores.

- All old content, IDs, timestamps, revisions, status and preArchiveStatus remain unchanged.
- Profile additions begin blank/null; no contact information is required.
- Achievement `occurredOn: "YYYY-MM-DD"` becomes `occurredStart: {value: "YYYY-MM-DD", precision: "day"}`. A blank draft date becomes null.
- **Only occurredStart is persisted.** The existing UI receives a read projection named occurredOn, and editor writes pass through an adapter. Year/month imports use year/month controls; UI edits preserve hidden rich fields and privacy.
- Dates accept real calendar values from 1900 through 2200. Ranges reject only definite reverse chronology, using earliest/latest bounds; overlapping uncertain dates are valid.
- Historical achievements migrate as **Confidential**. No migration approves content for external sharing. New captures also start Confidential until the future privacy editor is available.
- Seeding uses `CP-CAT-TEC/PRJ/LEA/BUS` and `CP-COMP-{group}-001..008`. Existing built-in/custom records are not overwritten. Missing built-ins are added; collisions fail safely. Rubric IDs remain null; no assessment or proficiency is fabricated.
- Migration failure aborts the upgrade and leaves schema 1 intact. A blocked upgrade tells the user to close other tabs/windows and reload. Abandoned open requests abort or close when eventually unblocked. Connections close on versionchange. A newer physical schema is rejected without downgrade.

## Backup and restore

Format 2 has `manifest`, `collections`, and `preferences`. The manifest contains format/schema/app versions, exportedAt, taxonomyVersion and counts for all 12 collections. Preferences currently contain only theme (system/light/dark). IDs, revisions, precision, privacy, custom taxonomy and relationships are included. Internal generations, source-data revision, last-change/export timestamps and device settings are not portable backup data.

Format 1/schema 1 remains supported through a strict in-memory adapter. It restores the original profile and achievements, empty new user collections, the built-in taxonomy, and System theme. The preview explicitly explains that **all current career collections and portable preferences are replaced**, including new records/custom competencies absent from the legacy file. No automatic merge occurs.

Both input and output enforce **12 MiB (12,582,912 UTF-8 bytes)** and at most 100,000 records per collection. Exports validate before serialization and refuse oversized output before download; they cannot produce an application-generated file exceeding the documented import limit. Source size is checked before JSON parsing. Compact/legacy source files are not rejected merely because conversion expands them in memory. Oversized datasets require a future reviewed streaming/chunked recovery design; there is no truncation.

Validation rejects incorrect types (including array/coerced enums), unsupported versions, unexpected fields, impossible dates, malformed timestamps, invalid URLs, nonfinite metrics, mismatched counts, duplicate IDs and broken references before replacement. URL references allow only HTTP(S) and reject embedded credentials. Import is not evidence verification.

On confirmation, validation runs again. One transaction replaces all 12 collections, preferences, export metadata and dataset generation; readback validates records and compares contents before commit. Any validation, quota, request or transaction failure preserves the previous dataset and recovery metadata.

## Concurrency

`meta.datasetGeneration` starts at 1 and increments **only on successful full replacement**, in the replacement transaction. It is never imported or reset by restore. Each browsing context captures its generation once; normal reads/writes never silently adopt a restored generation. Every mutating transaction checks generation, including creation, deletion, preferences and restore. Stale tabs show a reload instruction even when a restored record has the same ID/revision. Record revision checks remain in force for normal edits.

`meta.sourceDataRevision` starts at 1 and increments on career-data writes/restores, not cosmetic preferences or export timestamps. Both counters fail safely at the safe-integer limit. Reloading creates a new context that adopts the current generation.

## Validation and limits

`npm test` builds, runs Node domain/IndexedDB/asset/routing tests, then Chromium browser tests. CI installs the pinned browser runtime and uses npm ci. All fixtures are synthetic.

Coverage includes lossless migration; rollback and blocked/future versions; old/new backups; invalid imports and revalidation; duplicate/orphan/primary-link failures; synchronous quota and asynchronous constraint rollback; idempotent/custom taxonomy; revision/generation conflicts; safe deletion; precision/editor compatibility; UTF-8 limits; mobile interaction at 320/375px; desktop navigation; exported-file import; offline reload; and previous-worker cache activation.

Limitations: fake-indexeddb is a transaction simulator; Chromium viewports are not iOS Safari or an installed PWA. Safari storage eviction/quota, iOS Files, hardware keyboard/display behavior, safe areas, cold offline launch, iPad and the real v0.1.0 worker upgrade still need device acceptance. Large-data phone performance is not benchmarked. Domain CRUD exists for later increments, but there are no new history/portfolio/competency editing screens or data-health UI. JSON remains unencrypted, local data unsynced, and this foundation is not complete P0 recovery qualification.

See [acceptance steps](ACCEPTANCE_TESTS.md) and [module progress](ROADMAP.md).
