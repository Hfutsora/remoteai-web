import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

const DRAG_THRESHOLD = 6;
type Point = { x: number; y: number };
type Drag = { id: number; start: Point; origin: Point; moved: boolean };

export function useFullscreenControl({ dismiss, activate }: { dismiss: () => void; activate: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<Point>();
  const drag = useRef<Drag>();
  const constrain = (point: Point) => {
    const container = host.current!, control = button.current!;
    const padding = getComputedStyle(container);
    return {
      x: Math.max(parseFloat(padding.paddingLeft), Math.min(point.x,
        container.clientWidth - control.offsetWidth - parseFloat(padding.paddingRight))),
      y: Math.max(parseFloat(padding.paddingTop), Math.min(point.y,
        container.clientHeight - control.offsetHeight - parseFloat(padding.paddingBottom))),
    };
  };
  useLayoutEffect(() => {
    const resize = new ResizeObserver(() => {
      setPosition(current => constrain(current ?? { x: host.current!.clientWidth, y: 0 }));
      dismiss();
    });
    resize.observe(host.current!);
    return () => resize.disconnect();
  }, []);
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    drag.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY },
      origin: { x: event.currentTarget.offsetLeft, y: event.currentTarget.offsetTop }, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.start.x, dy = event.clientY - current.start.y;
    if (!current.moved && Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
    current.moved = true; dismiss();
    setPosition(constrain({ x: current.origin.x + dx, y: current.origin.y + dy }));
    event.preventDefault(); event.stopPropagation();
  };
  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    if (event.type === 'lostpointercapture' && event.target !== event.currentTarget) return;
    const pressed = event.type === 'pointerup' && !drag.current.moved;
    drag.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    // Touch browsers may suppress the synthetic click after a captured drag; release is authoritative.
    if (pressed) activate();
  };
  return { host, button, style: position ? { left: position.x, top: position.y, right: 'auto' } : undefined,
    handlers: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish } };
}
