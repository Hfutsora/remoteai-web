/** Check every nested viewport before handing a wheel or history gesture to its parent. */
export function canScrollWithin(target: EventTarget, boundary: Element, deltaY: number): boolean {
  let node = target instanceof Element ? target : null;
  while (node && node !== boundary) {
    const remaining = deltaY < 0 ? node.scrollTop : node.scrollHeight - node.clientHeight - node.scrollTop;
    if (remaining > 0 && /^(auto|scroll)$/.test(getComputedStyle(node).overflowY)) return true;
    node = node.parentElement;
  }
  return false;
}
