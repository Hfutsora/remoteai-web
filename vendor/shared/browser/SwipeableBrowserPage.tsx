import { useEffect, useRef, useState, type HTMLAttributes, type PointerEvent } from 'react';
import { horizontalDirection, verticalSwipe, SWIPE_COMPLETE_DISTANCE } from '../navigation/pageSwipe';

interface Drag { pointer: number; x: number; y: number; claimed: boolean }

/** Keep this wrapper mounted in both layouts so switching to previews retains the iframe session. */
export function SwipeableBrowserPage({ enabled, dismiss, children, ...props }: HTMLAttributes<HTMLDivElement> & {
  enabled: boolean; dismiss: () => void;
}) {
  const drag = useRef<Drag>();
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  useEffect(() => { if (!enabled) { drag.current = undefined; setOffset(0); } }, [enabled]);
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled) return;
    event.stopPropagation(); suppressClick.current = false;
    if (!event.isPrimary || event.button !== 0) { drag.current = undefined; setOffset(0); return; }
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, claimed: false };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = event.clientX - start.x; const dy = event.clientY - start.y;
    if (!start.claimed) {
      if (verticalSwipe(dx, dy) || horizontalDirection(dx, dy) === 'left') { drag.current = undefined; return; }
      if (horizontalDirection(dx, dy) !== 'right') return;
      start.claimed = true; suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.stopPropagation(); setOffset(Math.max(0, dx));
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current; drag.current = undefined; setOffset(0);
    if (!start?.claimed || start.pointer !== event.pointerId) return;
    event.stopPropagation();
    if (horizontalDirection(event.clientX - start.x, event.clientY - start.y, SWIPE_COMPLETE_DISTANCE) === 'right') dismiss();
  };
  return <div {...props} style={enabled ? { transform: `translateX(${offset}px)`, opacity: 1 - Math.min(offset / 400, 0.7),
    touchAction: 'pan-y', transition: offset ? 'none' : 'transform 160ms ease' } : undefined}
    onPointerDown={down} onPointerMove={move} onPointerUp={up}
    onPointerCancel={() => { drag.current = undefined; setOffset(0); }}
    onClickCapture={event => {
      if (suppressClick.current) { event.stopPropagation(); event.preventDefault(); suppressClick.current = false; }
    }}>{children}</div>;
}
