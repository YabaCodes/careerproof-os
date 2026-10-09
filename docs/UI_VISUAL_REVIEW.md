# CP-011A.1 before/after visual review

Synthetic data only. Baseline alpha.1 (main 35e676f), proposed alpha.2. Widths in filenames; both versions use the same fixtures and a 900px viewport height. Pages are full-page images; dialogs are viewport captures. Browser focus rings reflect actual interaction, not decorative borders.

[Audit findings](UI_AUDIT_CP_011A_1.md) · [Test report](UI_REGRESSION_REPORT.md) · [Selected branding](BRANDING_REVIEW.md) · [Machine-readable audit counts](ui-evidence/audit-summary.json)

## Phone Settings

| Before | After |
|---|---|
| ![Before](ui-evidence/375-light-settings-before.png) | ![After](ui-evidence/375-light-settings-after.png) |

## Phone capture

| Before | After |
|---|---|
| ![Before](ui-evidence/375-light-capture-before.png) | ![After](ui-evidence/375-light-capture-after.png) |

## Long phone Profile

| Before | After |
|---|---|
| ![Before](ui-evidence/375-light-profile-before.png) | ![After](ui-evidence/375-light-profile-after.png) |

## Narrow dark legacy preview

| Before | After |
|---|---|
| ![Before](ui-evidence/320-dark-legacy-restore-before.png) | ![After](ui-evidence/320-dark-legacy-restore-after.png) |

## Phone Home and navigation

| Before | After |
|---|---|
| ![Before](ui-evidence/375-light-home-before.png) | ![After](ui-evidence/375-light-home-after.png) |

## Tablet navigation and Vault

| Before | After |
|---|---|
| ![Before](ui-evidence/768-light-vault-before.png) | ![After](ui-evidence/768-light-vault-after.png) |

## Landscape tablet Home

| Before | After |
|---|---|
| ![Before](ui-evidence/1024-dark-home-before.png) | ![After](ui-evidence/1024-dark-home-after.png) |

## Desktop dark Profile

| Before | After |
|---|---|
| ![Before](ui-evidence/1440-dark-profile-before.png) | ![After](ui-evidence/1440-dark-profile-after.png) |

Full 252-per-version local audit output is reproducible with scripts/ui-audit.mjs and excluded from git. Baseline tablet navigation was missing, so its screenshot required an explicit hash fixture fallback; the after version uses actual navigation. Native system confirmation appearance, Safari keyboard/safe areas and installed-icon updates still require real devices.
