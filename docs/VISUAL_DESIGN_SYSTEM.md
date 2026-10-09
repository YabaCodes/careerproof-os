# CareerProof visual design system — CP-011A.1

The authoritative tokens and component rules live in `styles.css`. Reuse them for future screens; do not introduce separate per-screen scales.

| Foundation | Standard |
|---|---|
| Palette | Navy #142C40; teal #176B73; canvas #F6F8FA. Theme-specific surface, ink, muted, divider, control-border, danger and focus tokens |
| Type | System sans-serif; 16px body/form inputs, 14px labels/metadata/buttons, 12px hints/eyebrows, 20px sections, 24px phone and 28px larger page titles |
| Weight / rhythm | 400 body, 600 controls, 700 headings; 1.5 body line height, 1.25 headings. Nav labels are 11px only below 360px |
| Spacing | 4/8/12/16/20/24/32px tokens; page/card/form sections use the shared scale |
| Radii / elevation | 10px controls, 12px cards, 16px dialogs; restrained card shadow, stronger dialog shadow |
| Controls | Minimum 44×44px target; standard buttons and fields 48px high; text may wrap; SVG does not shrink |
| Focus | 3px contrasting outline, 3px offset; search wrapper provides the focus ring for its input |
| Navigation | Five equal 68px phone slots, shared 40px icon frames and visible labels; teal Add circle sits in the same frame |
| Icons | Original coherent vectors in src/ui/icons.ts; 24×24 grid, 2px rounded stroke, decorative aria-hidden and focusable=false. Buttons provide names |
| Records | List summaries intentionally ellipsize; full detail text wraps and preserves line breaks. Contact/summary/headline text wraps anywhere when needed |
| Forms | Associated labels, optional/helper text, inline alert without replacing entered values; single column below 480px |
| Dialogs | Named/described dialog, inert background, focus trap/return, fixed header/footer and scrolling body; full-height mobile capture |
| Notifications | Bounded, static region inside dialogs; floating message above phone nav when no dialog is open |
| Motion | No essential animation; reduced-motion respects system preference |

## Responsive rules

- Below 768px: phone header and bottom navigation, one-column content, safe-area padding.
- 768–1023px: labelled sidebar rail; all current destinations stay available.
- From 1024px: full sidebar; two-column dashboard/profile only from 1200px to avoid crowded cards.
- Dialogs use VisualViewport height/offset while a keyboard reduces visible space. Below 500px visual height, optional dialog eyebrow/subtitle is hidden, while the title, Close, controls and warnings remain.
- Safe-area env values are used on header, page, nav and dialog edges. A zero-inset Chromium run is not proof of an iPhone safe-area result.

## Branding assets

`public/icon.svg` is the selected editable monogram. `npm run brand:assets` regenerates 192/512 PNGs, opaque maskable 512, opaque Apple touch 180 and transparent-corner 16/32 favicons. The separately generated `icon-maskable.svg` scales the symbol inward; its important content fits within the central 80% mask-safe circle. Platforms apply their own corner masks.

App/runtime dependencies remain unchanged. Rendering tools are development-only. Run `npm run brand:review` to refresh the selected-logo/icon-family review sheet.
