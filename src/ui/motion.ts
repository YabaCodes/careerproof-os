/**
 * CP-UX-Fluid (DEC-038) — motion and touch feedback. Presentation only:
 * nothing here reads or writes records.
 *
 * The app redraws a whole screen on most taps (main.ts → render()), so motion
 * is tied to *changes*, never to a redraw on its own: a sheet slides up when it
 * opens (not each time its content redraws), a screen eases in when you move to
 * it, bars grow when a screen is opened and move from their old height when a
 * number changes. With Reduce Motion on, nothing animates; the result is the
 * same, just immediate.
 */

export function motionAllowed(): boolean {
  return typeof Element !== 'undefined' && Boolean(Element.prototype.animate)
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const EASE = 'cubic-bezier(.2,.8,.2,1)';

/** iOS Safari only shows :active styles when the page listens for touches. */
export function enableTouchFeedback(): void {
  document.addEventListener('touchstart', () => {}, { passive: true });
}

/** A newly opened sheet: the page dims and the sheet rises (phones) or settles (wider screens). */
export function enterSheet(scope: ParentNode): void {
  const backdrop = scope.querySelector<HTMLElement>('.modal-backdrop');
  if (!backdrop || !motionAllowed()) return;
  backdrop.classList.add('is-entering');
  backdrop.querySelector('.modal')?.addEventListener('animationend', () => backdrop.classList.remove('is-entering'), { once: true });
}

export type ScreenMove = 'tab' | 'forward' | 'back';
/** Moving to another tab fades the page up; opening an experience pushes in from the right, Back from the left. */
export function enterScreen(main: HTMLElement | null, move: ScreenMove): void {
  if (!main || !motionAllowed()) return;
  const from = move === 'forward' ? 'translateX(18px)' : move === 'back' ? 'translateX(-18px)' : 'translateY(8px)';
  main.animate([{ opacity: 0.35, transform: from }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE });
}

/** The next capture step slides in from the right; Back brings the previous one in from the left. */
export function slideStep(step: HTMLElement | null, forward: boolean): void {
  if (!step || !motionAllowed()) return;
  step.animate([{ opacity: 0, transform: `translateX(${forward ? 28 : -28}px)` }, { opacity: 1, transform: 'none' }],
    { duration: 240, easing: EASE });
}

/**
 * Bars: every fill carries data-bar="<key>" and an inline height. On opening a
 * screen they grow from empty, a little after one another; after a change on the
 * same screen, a bar moves from the height it had to the height it has now.
 */
export function snapshotBars(scope: ParentNode): Map<string, string> {
  const heights = new Map<string, string>();
  scope.querySelectorAll<HTMLElement>('[data-bar]').forEach(el => heights.set(el.dataset.bar!, el.style.height));
  return heights;
}
let barWatcher: IntersectionObserver | null = null;
const waiting = new Map<Element, Animation>();
/** Bars below the fold wait, already empty, until they scroll into view. */
function playWhenVisible(el: Element, animation: Animation): void {
  if (!('IntersectionObserver' in window)) return;
  barWatcher ??= new IntersectionObserver(entries => {
    let n = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const waitingAnimation = waiting.get(entry.target);
      barWatcher!.unobserve(entry.target);
      waiting.delete(entry.target);
      waitingAnimation?.effect?.updateTiming({ delay: Math.min(n++, 11) * 35 });
      waitingAnimation?.play();
    }
  }, { threshold: 0.3 });
  animation.pause();
  waiting.set(el, animation);
  barWatcher.observe(el);
}
export function animateBars(scope: ParentNode, before: Map<string, string> | null, entering: boolean): void {
  if (entering) { barWatcher?.disconnect(); waiting.clear(); }
  if (!motionAllowed()) return;
  let n = 0;
  scope.querySelectorAll<HTMLElement>('[data-bar]').forEach(el => {
    const to = el.style.height;
    const from = entering ? '0%' : before?.get(el.dataset.bar!) ?? '0%';
    if (!to || from === to || (entering && !(parseFloat(to) > 0))) return;
    const r = el.getBoundingClientRect(), onScreen = r.bottom > 0 && r.top < window.innerHeight;
    const animation = el.animate([{ height: from }, { height: to }], {
      duration: entering ? 620 : 520, delay: entering && onScreen ? Math.min(n++, 11) * 35 : 0, easing: EASE, fill: 'backwards'
    });
    if (entering && !onScreen) playWhenVisible(el, animation);
  });
}

/** The record just saved glows briefly where it now appears, scrolled into view if needed. */
export function glowRecord(scope: ParentNode, id: string): HTMLElement | null {
  const row = [...scope.querySelectorAll<HTMLElement>('[data-action="detail"][data-id]')]
    .find(el => el.dataset.id === id && el.getClientRects().length > 0) ?? null;
  if (!row) return null;
  row.classList.add('just-saved');
  // The glow is decoration; the class is removed so a later redraw does not replay it.
  window.setTimeout(() => row.classList.remove('just-saved'), 2400);
  const r = row.getBoundingClientRect();
  if (r.top < 0 || r.bottom > window.innerHeight) row.scrollIntoView({ block: 'center', behavior: motionAllowed() ? 'smooth' : 'auto' });
  return row;
}
