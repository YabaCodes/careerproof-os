/** Only dismiss a dialog when its actual backdrop is clicked. */
export function resolveActionTarget(target:Element):HTMLElement|null {
  const node=target.closest<HTMLElement>('[data-action]');
  if(node?.dataset.action==='backdrop' && target!==node)return null;
  return node;
}
