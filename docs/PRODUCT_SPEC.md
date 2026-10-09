# CP-FDS-001 + CP-UX-001 — CareerProof Product, Functional and UX Specification

**Status:** Approved working baseline, amended by CP-DRG-001. **Date:** 2026-10-09. **Implementation reality:** v0.1.0 with UI hotfix; most items below are requirements, not shipped features.

## 1. Vision, audience, value proposition

**CareerProof OS — Own your experience. Prove your impact. Shape your future.**

A private professional system of record and intelligence that lets people preserve work history, explain their personal contribution, connect experience to competencies, assemble evidence-backed career materials and examine opportunities.

Initial users: engineers, manufacturing/automation professionals, technical project/program managers and aspiring engineering leaders. The model must also support operational work, education, independent consulting and non-project careers.

Three enduring jobs-to-be-done:
1. Remember and organize roles, projects, achievements, credentials and evidence.
2. Demonstrate impact with accurate, traceable contributions rather than unsupported claims.
3. Evaluate competencies and target opportunities; identify documentation gaps vs genuine development gaps.

**Explicitly not the product:** general tasks/calendars, habit tracking, social network, conventional job-application CRM, live jobs marketplace or an arbitrary 'career score'.

## 2. Eight functional modules

| Module | Intended responsibility | First-cycle commitment |
|---|---|---|
| M01 Career Profile | Identity, employer/role history, education, credentials | P0 |
| M02 Achievement Vault | Capture, detail, metrics, references, lifecycle, search | P0 |
| M03 Experience Portfolio | Projects, initiatives and ongoing responsibilities | P0 |
| M04 Competency Intelligence | Taxonomy, links, self-ratings, evidence breadth | P0 taxonomy; P1 assessment |
| M05 Career Roadmap | Target roles, gap closure, development actions | Later release |
| M06 Performance & Promotion Studio | Source-linked performance reviews; later promotion cases | P1 reviews; expansion later |
| M07 Job Readiness & Interview Studio | CV generation, pasted job comparison; later interview coaching | P1 CV/job-fit; interviews later |
| M08 Career Analytics & Insights | Meaningful record/completeness overview and later trends | P0 basic; full analytics later |

All modules operate on **one set of career records**. Do not duplicate a project or achievement in individual module databases.

## 3. Navigation and UX

- Completed P1 navigation: **Home / Vault / Growth / Studio / Profile**.
- v0.1.0 may show only **Home / Vault / Profile**; introduce Growth with competency functionality and Studio only when its first tool works. Never show empty future destinations.
- Settings is accessible via Profile/header; **Quick Capture** is a global primary action, not a destination.
- Mobile: single-column, balanced bottom navigation with safe-area insets; tablet: compact rail; desktop: sidebar and wider detail layouts. Target breakpoints approximately 600 and 1024 CSS px, determined by layout fit; retain usability at 320px.
- Design identity: restrained professional intelligence workspace; primary ink #142C40, teal #176B73, canvas #F6F8FA, white surface #FFFFFF, slate #657487, divider #DCE3EA; semantic statuses separate from brand. Dark mode with adequate contrast.
- One shared token system: system-native sans-serif, page titles 24px mobile/28px desktop, headings 18–20px, body 15–16px, labels 14px, 4px spacing scale, 12px card radii, >=44px primary touch controls.
- Accessible labels, keyboard/focus behavior, Escape/backdrop handling, unsaved-change confirmation, and clear empty/error/loading states. WCAG 2.2 AA is a target; must test, not assume.

## 4. Screen inventory and detailed requirements

| ID | Screen | Requirements | First delivery |
|---|---|---|---|
| CP-00 | First-time setup | Optional name/headline/domain; explain local data and lack of sync; skip allowed | P0, staged |
| CP-01 | Home | Capture CTA, recent achievements, derived counts, missing-record prompts, truthful export date | P0, evolve |
| CP-02 | Quick Capture | title*, contribution* for recorded, date defaults local today, optional role/project; draft requires only title; save/view/add another | P0 |
| CP-03 | Vault | Search title/contribution/outcome, filter role/project/competency/status/date, sort date/edited/name, archive/restore/delete | P0, expand |
| CP-04 | Achievement detail | Situation, actions, contribution, outcome, category, measurable metrics, competency links, evidence and privacy | P0 expanded |
| CP-05 | Career Profile | Optional contact, professional summary, employers with multiple possibly overlapping roles, education, credentials | P0 |
| CP-06 | Experience Portfolio | Projects/initiatives/ongoing responsibilities, employer/role context, own scope/outcomes, achievement links | P0 |
| CP-07 | Competency library | Four categories, 32 built-in competencies + custom, linked achievement examples | P0 |
| CP-08 | Settings/Data | Theme, schema/version, validated full-replacement JSON backup, integrity check, data deletion safeguards | P0 |
| CP-09 | Proficiency and evidence | 4-level self-assessment, historical assessments, separate evidence breadth, explanation | P1 |
| CP-10 | Performance Review | Select period/role/achievements, editable source-linked draft, export/print PDF | P1 |
| CP-11 | CV Builder | Structured contact info, select/reorder sources, two simple ATS-conscious layouts, multiple editable versions, PDF | P1 |
| CP-12 | Job Fit Analyzer | Paste description, extract/classify/edit requirements, link evidence, preserve manual overrides, save analyses | P1 |

### Capture (CP-02)

- **Recorded** entry: meaningful title, contribution and valid occurrence date. **Draft**: title only. Other information can be added later.
- Date is editable; don't invent historical exact dates. Role may default to primary current role but can be changed/cleared.
- Minimum user action in <60s is a **usability target**; not claimed measured.
- On mobile use a full-screen editor with safely scrollable content/keyboard layout, on desktop use focused modal.
- Dialog click events from inputs, labels, selects, inner cards or buttons must not trigger backdrop dismissal. Only clicking the backdrop itself or the explicit Close control may dismiss, with unsaved changes confirmation.
- Errors preserve user input; saving only reports success after IndexedDB commit.

### Vault, profile and portfolio (CP-03 through CP-07)

- **Employer** groups positions; promotions remain separate positions under one employer. Positions can overlap.
- **Project ≠ Achievement**: project = scope/initiative; achievement = person's contribution and resulting impact. Projects include ongoing responsibilities and academic/personal initiatives.
- Achievement is linked to role and optionally several projects and competencies. Edit labels in one canonical record; relationships use IDs.
- Evidence reference means user-entered description, URL or document reference (not a file upload). Reference does **not** mean independent verification.
- Achievement lifecycle: Draft → Recorded → Archived; restore to previous active status. Permanent deletion distinct and confirmed.
- Impact categories: Quality, Cost, Delivery, Productivity, Reliability, Safety, Customer, Leadership, Technical Innovation, Other (existing v0.1.0 subset retained through migration).
- Impact measures have explicit unit, baseline/result or reported value and measurement context. No invented cost savings or numerical achievements.
- Confidential entries private by default. Generated externally shared reports exclude confidential sources and derivative content unless explicitly authorized and sanitized.

### Growth (CP-09)

- Display **self-assessed proficiency** separately from **evidence breadth** and provenance. Never imply verified expertise.
- An unassessed skill reads 'Not assessed', not Level 1.
- Competency detail shows linked achievement sources and 'why' each breadth label was assigned.
- Do not derive career-readiness or hiring-probability percentages.

### Studio (CP-10 through CP-12)

- Review journey: Scope → Source selection → Editable draft → Export.
- CV journey: Template → Experience selection → Sections/ordering → Edit → Preview/Export. Initial templates: Professional Standard and Technical Specialist; avoid decorative skill bars and overly complex ATS layouts.
- Job fit journey: Paste → Review extracted requirements → Compare source evidence → Save. Three automated states: Evidence Found / No Recorded Evidence / Review Required. Clear manual overrides.
- Saved reports/CVs are **editable snapshots** and retain source ID/revision links; source edits generate outdated alerts, **not** automatic rewrites.
- Do not confuse missing stored evidence with actual missing professional ability; no live scraping, job eligibility inference or likelihood-of-offer forecasts.

## 5. Cross-cutting behavior

- Records have immutable IDs and created/updated timestamps, revision-based conflict checks, normalized validation and linked-reference integrity.
- No destructive cascading data loss. If removing an employer/role/project/competency affects linked data, disclose consequences; block or safely unlink/reassign as specified in DATA_ARCHITECTURE.md.
- Backup is full private data, not a shareable CV; exported JSON unencrypted. Import validates first and warns of full replacement; no merges in v0.1.x.
- Local IndexedDB does not sync across phone, tablet and desktop. Never claim storage is a permanent backup.
- Prefer contextual prompts like 'two achievements lack outcomes' to vanity or ungrounded scoring.
- Distinguish app version, database schema version, backup format version, rubric version, and matcher version.

## 6. Core acceptance scenarios

| ID | Scenario |
|---|---|
| UAT-01/02 | Setup/home; multiple roles for one employer including overlapping dates |
| UAT-03 | Add project linked to roles |
| UAT-04/05 | Save quick achievement, reopen, enrich details and evidence |
| UAT-06/07 | Search/filter, multiple competency links reflected bidirectionally |
| UAT-08 | Archive/restore without losing data/links |
| UAT-09/11 | Backup round trip; malformed backup rejected without database damage |
| UAT-10/12 | Offline cached startup, iPhone/iPad/desktop layout including interactive modal and nav |
| CIF-01–15 | Competency/evidence and job-analysis deterministic rules; see CAREER_INTELLIGENCE.md |
| STU-01–09 | Source-linked review/CV editing, confidentiality, PDF output and preserved custom edits |

Refer to existing docs/ACCEPTANCE_TESTS.md for *implemented v0.1.0* user-level tests. Treat the scenarios above as **planned**, not already passed.

## 7. Scope/engineering constraints

- P0: record foundation, trustworthy local storage, backup and recovery.
- P1 in first cycle: self-assessment/evidence breadth, performance review, CV builder, pasted job-description matching; **no AI dependence**.
- P2+: AI-assisted writing/requirement interpretation; career pathways, interview coaching.
- Future commercialization: secure cloud accounts, permissions, billing, source provenance policy, multi-device sync and additional privacy review.

Product choices: prioritize daily/weekly usefulness and clear evidence provenance; initial user personas and sample data must be non-confidential and synthetic.
