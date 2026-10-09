# CareerProof OS — v0.1.0

**Own your experience. Prove your impact.**

A privacy-first, local-only professional achievement PWA. This is the first usable increment of the CareerProof product roadmap.

## What works in v0.1.0
- Personal career profile: display name, headline, summary, professional email, location.
- Create achievements quickly; save as draft or complete record.
- Optional outcome and impact category; dates default to today's **local** date.
- View, search, filter, sort, edit, archive, restore, and permanently delete achievements.
- Dashboard with live statistics and recent achievements.
- IndexedDB local persistence with revision checks for conflicting writes.
- Portable, versioned JSON backup export and full-replacement restore with validation and preview.
- Responsive iPhone, iPad, and desktop layouts, light/dark/system themes, installable offline PWA.

## Deliberately not built yet
v0.1.1 adds employment timeline, credentials, projects, detailed evidence, and the competency library. Later 0.1.x updates add scoring, performance reviews, CV builder, and job matching. Planned future modules are **not** yet clickable.

## Run from source

Requires Node.js 20+ and npm. No other runtime dependencies.

```bash
npm install
npm test
npm run build
npm run preview
```

The compiled static site is in `dist/`. Open the preview URL (typically `http://127.0.0.1:4173`). Do not open `dist/index.html` directly as a `file://` URL: browser modules, service workers and persistence may not work as expected.

## Publish to GitHub Pages — no local development installation needed

1. Create a **new** GitHub repository named `careerproof-os`.
2. Upload the contents of this project folder, **not** the outer ZIP as a single file.
3. In the repository, open **Settings → Pages**, and select **GitHub Actions** as the deployment source.
4. Commit to the `main` branch. The included `.github/workflows/deploy.yml` installs TypeScript, runs tests, builds and deploys automatically.
5. After the workflow succeeds, the site appears under your GitHub Pages address (`https://<github-user>.github.io/careerproof-os/`).
6. Open the URL on your iPhone, then use **Share → Add to Home Screen** to install it.

No repository is created automatically. Pages must be enabled in GitHub; first deploy can require approval or permission changes.

## Data safety

**Important:** All CareerProof data is stored locally in the browser's IndexedDB. Data entered on one device **does not sync** to another device. GitHub Pages holds only the application files, not your career data.

Browser data may be cleared or evicted; make backups using Settings → Export regularly. Exported JSON is unencrypted and may contain sensitive information. Save backups securely and avoid putting your real workplace information in GitHub.

Restoring a backup **replaces** the current local profile and all achievements. The app validates the backup before replacing its database; exporting the current data before restore is recommended. The app does not yet support merging backups or cloud sync.

## Development conventions

- `src/domain`: stable record types, validation rules, application-independent logic.
- `src/data`: IndexedDB repositories and backup logic.
- `src/app`: UI, navigation and event management.
- `src/ui`: reusable icon helpers.
- `styles.css`: centralized responsive design system.
- `public/`: PWA manifest, offline worker, icon.
- `tests/`: automated validation and backup-format tests.

App version `0.1.0` · database schema version `1` · JSON backup format `1`.

## Next increment

**v0.1.1 — Professional Experience & Evidence:** roles/employers, education, credentials, portfolio, competency tags and related achievement links. Schema changes will use migrations and must preserve existing data.
