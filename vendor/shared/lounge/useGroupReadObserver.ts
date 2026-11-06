import { useEffect, useRef } from 'react';
import type { LoungeController } from './controller';
import type { LoungeMessage } from './types';

const READ_VISIBLE_MS = 500;
const VISIBLE_FRACTION = 0.5;

export function useGroupReadObserver(options: {
  message: LoungeMessage; controller?: LoungeController; history?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { message, controller, history = false } = options;
  useEffect(() => {
    const node = ref.current;
    if (!node || !controller || !message.groupReceipt || message.recipient
      || message.sender.id === controller.snapshot().user?.id || typeof IntersectionObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      const height = Math.min(entry.boundingClientRect.height, entry.rootBounds?.height ?? innerHeight);
      const visible = entry.isIntersecting && entry.intersectionRect.height >= height * VISIBLE_FRACTION;
      if (visible) timer = setTimeout(() => controller.setGroupMessageVisible({ message, visible, history }),
        READ_VISIBLE_MS);
      else controller.setGroupMessageVisible({ message, visible, history });
    }, { threshold: [0, VISIBLE_FRACTION, 1] });
    observer.observe(node);
    return () => {
      clearTimeout(timer); observer.disconnect();
      controller.setGroupMessageVisible({ message, visible: false, history });
    };
  }, [message, controller, history]);
  return ref;
}
