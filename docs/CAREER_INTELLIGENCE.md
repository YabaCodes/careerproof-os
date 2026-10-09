# CP-CIF-001 — Career Intelligence and Evidence Framework

**Status:** Approved deterministic P1 design baseline. **Date:** 2026-10-09. **Not implemented in v0.1.0.**

## 1. Principles and distinctions

CareerProof interprets career **records**; it does not certify a professional's actual skill or predict a hiring decision.

Keep the following separate in domain, data and UI:
1. **Competency:** What capability is being evaluated.
2. **Self-assessed proficiency:** What the user reports they can do (1–4). Never auto-promote/downgrade.
3. **Evidence breadth:** How many eligible examples and distinct work contexts have been *recorded* (not evidence validity).
4. **Evidence provenance:** Whether each claim is self-reported, linked to a reference or user-reviewed; this is not independent verification.
5. **Role relevance:** Whether recorded evidence supports a particular job requirement.
6. **Development/documentation action:** Differentiate information gaps from user-confirmed capability gaps.

Avoid 'career readiness scores', unsubstantiated hiring probability, inferred promotions, claims of independent proficiency verification and fabricated achievement metrics.

## 2. Original built-in taxonomy, v1.0 (32 competencies)

**Technical & Engineering — CP-COMP-TEC-001..008**
1. Engineering Problem Solving
2. Automation & Systems Integration
3. Equipment Development
4. Manufacturing Processes
5. Verification & Validation
6. Quality & Regulatory Practices
7. Technical Risk Analysis
8. Continuous Improvement

**Project & Program Delivery — CP-COMP-PRJ-001..008**
1. Project Planning & Scheduling
2. Scope Management
3. Risk & Issue Management
4. Vendor Management
5. Stakeholder Management
6. Change Management
7. Milestone & Gate Governance
8. Program Delivery & Execution

**Leadership & Collaboration — CP-COMP-LEA-001..008**
1. Professional Communication
2. Cross-functional Collaboration
3. Mentoring & Coaching
4. Delegation & Accountability
5. Conflict Resolution
6. Decision-making
7. Team Leadership
8. Negotiation & Influence

**Business & Strategy — CP-COMP-BUS-001..008**
1. Business Acumen
2. Financial Analysis
3. Cost & Resource Management
4. Strategic Planning
5. Process Optimization
6. Customer & Market Awareness
7. Prioritization & Trade-offs
8. Organizational Improvement

Built-in competencies have stable keys, original definitions, versioned behavioral rubrics and approved aliases. Users may add custom categories/competencies (e.g., PLC programming, GD&T, process validation). Certification is a credential; it is **not automatically proof** of operational competency.

### External reference constraints

SFIA, ESCO and O*NET may inform product research and future integrations. The four-level CareerProof model is **original**, not a conversion of SFIA's seven levels. Do not copy protected framework definitions into a commercial product without license review; check current terms before adopting external taxonomies. O*NET/ESCO use and attribution must be reviewed before data import.

## 3. Common four-level behavioral model

| Level | Name | Expected independence/complexity |
|---|---|---|
| 1 | Foundational | Understand concepts; straightforward tasks with guidance |
| 2 | Developing | Apply in familiar situations with occasional support |
| 3 | Proficient | Independently handle complex work and deliver relevant decisions/results |
| 4 | Advanced | Lead highly complex work, guide others and influence broader practices |

A competency-specific rubric must express increasing autonomy, complexity, accountability and influence. **Years of experience alone do not establish a level.**

### Illustrative specific rubrics

**Vendor Management**
- L1: Understands supplier communications; assists routine coordination.
- L2: Coordinates routine vendor deliverables with occasional guidance.
- L3: Independently manages complex vendor issues, commitments, escalations and decisions.
- L4: Leads high-impact supplier strategies/negotiations, shapes practices and mentors others.

**Engineering Problem Solving**
- L1: Uses existing troubleshooting instructions with guidance.
- L2: Independently investigates familiar issues and identifies probable causes.
- L3: Solves unfamiliar complex problems through structured investigation and validated solutions.
- L4: Leads multidisciplinary investigations and establishes reusable methods.

**Team Leadership**
- L1: Understands team responsibilities; collaborates reliably.
- L2: Coordinates small activities and supports colleagues.
- L3: Leads a workstream/team, delegates and develops others with accountability.
- L4: Develops leadership practice and influences broader organizational performance.

The other 29 competency-specific rubrics must be authored and reviewed before asserting that the entire taxonomy has distinct behavioral rubrics. Generic levels are permitted until those rubrics exist, explicitly labeled as generic.

### Assessment lifecycle

- No assessment = **Not assessed**, never Level 1 by default.
- User explicitly chooses L1–L4 and may provide rationale, date, achievement selection and assessment context.
- Append assessment history with rubric version. Do not automatically change old ratings when evidence changes.
- A 12-month-old assessment may trigger a reminder, not automatic invalidation.

## 4. Evidence breadth (P1 deterministic rules)

Eligible examples are **Recorded** achievements explicitly linked to the competency. Draft or Archived examples are excluded. Apply thresholds **Broad → Moderate → Emerging → Not documented**.

| Label | Exact rule |
|---|---|
| Not documented | Zero eligible linked achievements |
| Emerging | At least 1 eligible achievement |
| Moderate | At least 2 eligible achievements, at least 1 with a nonblank *stated outcome* |
| Broad | At least 3 eligible achievements in at least 2 distinct work contexts, at least 2 with nonblank stated outcomes |

A work context is the achievement's primary project, otherwise its associated role, otherwise a shared 'unspecified' context. Merely recording multiple unassociated achievements does **not** create artificial context diversity. Don't double-count achievement links. A nonblank outcome is *user stated*, not externally proven.

Display counts and context explanation (e.g. '3 achievements, 2 projects, 2 stated outcomes'). **Call this Evidence Breadth, not Evidence Quality**.

Edge cases:
- L4 self-rating with zero examples: preserve L4, label evidence Not documented.
- L1 self-rating with Broad breadth: suggest optional self-review, never assign a higher proficiency.
- Three achievements all in same project: at most Moderate under above rule if at least one has a stated outcome.
- Archived entries never count toward active breadth, though historical record remains.
- Confidential entries may be used for private on-device analysis; never leak them into externally shared document text without explicit sanitized inclusion.

### Evidence provenance

- Self-reported achievement (default).
- Supporting reference recorded (document reference, description or URL).
- User-reviewed reference (review action and date).
- 'Independently verified' **not provided** in P1.

A reference or review is not a third-party verification; neither automatically changes self-assessed proficiency or breadth.

## 5. Recommendation types

- **Document**: relevant capability/experience may exist but is not in CareerProof; invite additional records.
- **Substantiate**: recorded example lacks an outcome, permitted metric or supporting reference; clarify, but do not pressure users to add confidential files.
- **Develop**: only recommend acquiring an actual competency after the user explicitly indicates a gap against a target role.

No unverified AI-generated diagnoses of performance or aptitude.

## 6. Job Fit Analyzer: P1 deterministic matching

**Input:** Manually pasted description, target title, optional employer/location (jobDescription max 50,000 chars).

**Pipeline:**
1. Store original description and metadata.
2. Extract candidate requirements via headings/phrases and explicit skill terms.
3. Classify each as: Competency, Experience, Qualification, Credential, Technical Knowledge, Practical Eligibility, or Preference.
4. Label importance: Required, Preferred, Unspecified.
5. Match approved competency names/aliases to stable competency IDs; search for *recorded linked evidence*, and compare structured education/credential records where appropriate.
6. Display per-requirement result with original wording, mapped item and source records; allow manual correction and save.

**Machine-generated result states:**
- **Evidence Found**: a valid supporting structured credential/education record or eligible achievement link demonstrates a candidate match. It does not mean eligibility is guaranteed.
- **No Recorded Evidence**: no applicable stored record; not proof of missing real-world capability.
- **Review Required**: ambiguous, implied, partially mapped, experience equivalence, work authorization or other human-judgment conditions.

Keyword in a profile summary alone does **not** justify Evidence Found. Similar terms at different seniority/responsibility levels require review. Rule-based parsing will miss nuance and synonyms; do not silently coerce unknown requirements into matches. User edits to requirements and match interpretations must be preserved after reruns.

**Explicit exclusions:** No '87% qualified' score, hiring likelihood, automatic visa or eligibility decision, live jobs/feed integrations, semantic embeddings/LLMs required in P1.

Analyses store rule-engine version and career dataset revision; changed source data flags the analysis **outdated**, not automatically overwritten.

## 7. Review and CV content generation

**Performance review (P1):** Choose period/role/achievements; group by meaningful impact or competency categories; generate rule/template-based editable draft, with source references; print/export PDF. No auto-inferred manager rating or promotion outcome.

**CV (P1):** Profile/contact, chosen employment, relevant achievements, education, credentials and explicitly supported competencies. Two initial templates: Professional Standard and Technical Specialist. Select/reorder sections, edit, save multiple versions; clean single-column ATS-conscious PDF. No claims of guaranteed ATS parsing. DOCX export deferred.

For both: derive from records, store output as an editable snapshot and each source ID/revision; show when source has been edited/deleted; **never auto-overwrite user edits**. Manually added claims remain manually edited, not validated facts. Confidential records and **indirect derived details** excluded from externally shareable outputs by default.

## 8. Deterministic acceptance matrix

| ID | Fixture/action | Expected |
|---|---|---|
| CIF-01 | No proficiency assessment | Not Assessed |
| CIF-02 | Competency with 0 eligible achievements | Not Documented |
| CIF-03 | 1 eligible achievement | Emerging |
| CIF-04 | 2 eligible achievements, 1 stated outcome | Moderate |
| CIF-05 | 3 eligible across 2 contexts, 2 outcomes | Broad |
| CIF-06 | 3 eligible only in 1 context | Not Broad |
| CIF-07 | Archive a linked achievement | Excluded from active breadth |
| CIF-08 | User rates L4 with no records | Preserve L4 and show absent evidence |
| CIF-09 | Unknown requirement term | Review Required |
| CIF-10 | Certification requirement | Compare credentials, not achievement count |
| CIF-11 | Work authorization condition | Review Required / user confirmation |
| CIF-12 | Edit source after analysis/report | Mark outdated; preserve saved snapshot |
| CIF-13 | Confidential source in document generation | Excluded by default including derived content |
| CIF-14 | User manually edits parsed job requirement | Override preserved |
| CIF-15 | Profile text keyword without eligible evidence | Not automatic Evidence Found |

Additional tests: alias ambiguity, negation, duplicate links, deleted source IDs, role/period boundaries, outdated rubrics and user-edited CV blocks. All deterministic fixtures should pass before P1 acceptance, but **do not claim validation of real-world assessment accuracy**.

## 9. Future evolution (explicitly out of P1)

AI-assisted experience extraction and professional writing, richer job semantics, interview/story coaching, role pathways, occupation mappings and advanced personalized development plans require separate privacy, accuracy, licensing and user-consent reviews.
