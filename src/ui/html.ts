/**
 * Single HTML escaping helper for every template that interpolates user text.
 *
 * CP-012.0: Experience Portfolio previously kept its own copy that emitted
 * `&#39` without the terminating semicolon. An apostrophe followed by digits
 * (e.g. `'24`) was then decoded by the browser as a different numeric
 * character reference (`&#3924` → U+0F54), and saving an unchanged edit form
 * wrote the corrupted text back to IndexedDB. Keep one implementation here.
 */
const ENTITIES: Readonly<Record<string, string>> = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, ch => ENTITIES[ch]!);
}
