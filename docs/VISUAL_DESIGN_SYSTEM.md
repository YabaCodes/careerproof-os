# CareerProof visual design system — CP-011A.2

The authoritative tokens and component rules live in `styles.css`. Reuse them for future screens; do not introduce separate per-screen scales.

| Foundation | Standard |
|---|---|
| Palette | Navy #142C40; teal #176B73; canvas #F6F8FA. Theme-specific surface, ink, muted, divider, control-border, danger and focus tokens |
| Type | System sans-serif; 16px body/form inputs, 14px labels/metadata/buttons, 12px hints/eyebrows, 20px sections, 24px phone and 28px larger page titles |
| Weight / rhythm | 400 body, 600 controls, 700 headings; 1.5 body line height, 1.25 headings. Phone nav labels are 10.5px |
| Spacing | 4/8/12/16/20/24/32px tokens; page/card/form sections use the shared scale |
| Radii / elevation | 10px controls, 12px cards, 16px dialogs; restrained card shadow, stronger dialog shadow |
| Controls | Minimum 44×44px target; standard buttons and fields 48px high; text may wrap; SVG does not shrink |
| Focus | 3px contrasting outline, 3px offset; search wrapper provides the focus ring for its input |
| Navigation | Five equal 60px phone touch slots; 24px icon frames in a common 34px row; 19px icons through 390px, 20px above; teal Add circle 34px; labels and icon centers aligned |
| Icons | Original coherent vectors in src/ui/icons.ts; 24×24 grid, 2px rounded source stroke (1.8px for phone navigation), decorative aria-hidden and focusable=false. Buttons provide names |
| Records | List summaries intentionally ellipsize; full detail text wraps and preserves line breaks. Contact/summary/headline text wraps anywhere when needed |
| Forms | Associated labels, 16px input text, 48px input/select height, 1px border, 10px radius, shared padding/background; 16px group gap, 8px label gap; single column below 480px. Native date/month/time appearance reset and left-aligned WebKit value; no custom calendar |
| Dialogs | Named/described dialog, inert background, focus trap/return, fixed header/footer and scrolling body; full-height mobile capture; initial phone focus on the named dialog to preserve labels and avoid automatic keyboard opening |
| Notifications | Bounded, static region inside dialogs; floating message above phone nav when no dialog is open |
| Motion | No essential animation; reduced-motion respects system preference |

## Responsive rules

- Below 768px: phone header and bottom navigation, one-column content, safe-area padding.
- 768–1023px: labelled sidebar rail; all current destinations stay available.
- From 1024px: full sidebar; two-column dashboard/profile only from 1200px to avoid crowded cards.
- Dialogs use VisualViewport height/offset while a keyboard reduces visible space. Below 500px visual height, optional dialog eyebrow/subtitle is hidden, while the title, Close, controls and warnings remain.
- Phone nav has 60px content plus a 1px top divider; `--safe-bottom` is separate bottom padding applied once. Page bottom spacing reserves that bar plus 24px breathing space; it does not enlarge the bar.
- Phone footer uses 12px above/below plus `--dialog-safe-bottom` once; controls are at least 44px. Below 360px, decorative footer icons are hidden and inline button padding is 4px to keep complete action labels readable.
- A focused editable field with an unzoomed visual viewport more than 150px below layout height is treated as a software-keyboard candidate; `--dialog-safe-bottom` becomes zero. Browser chrome and pinch zoom do not trigger this rule. Below 500px visual height, footer padding reduces to 8px and textareas to 88px (internally scrollable). Body-only focus scrolling retains each field label; manual body scrolling remains possible.
- Safe-area env values are used on header, page, nav and dialog edges. Synthetic 34px inset/300–360px viewport tests are not proof of iPhone behavior. See [Wealth OS comparison and native-date rationale](IOS_FORM_NAV_REFINEMENT.md).

## Branding assets

`public/icon.svg` is the selected editable monogram. `npm run brand:assets` regenerates 192/512 PNGs, opaque maskable 512, opaque Apple touch 180 and transparent-corner 16/32 favicons. The separately generated `icon-maskable.svg` scales the symbol inward; its important content fits within the central 80% mask-safe circle. Platforms apply their own corner masks.

App/runtime dependencies remain unchanged. Rendering tools are development-only. Run `npm run brand:review` to refresh the selected-logo/icon-family review sheet.


## CP-011A.3 keyboard-visible content rule

With the iPhone keyboard visible, the modal-body is the **only** scrollport moved to reveal the active form field. Keep a label and enough of the editable control visible, preserve the fixed footer, and do not pan the locked background. Use VisualViewport dimensions and a post-layout adjustment rather than hardcoding keyboard heights or model-specific offsets. Native textarea caret scrolling remains independent. See [keyboard-specific acceptance](IOS_KEYBOARD_OUTCOME_CP_011A_3.md).
