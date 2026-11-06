import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { uiText } from '../localization/uiText';
import './activityList.less';

const VISIBLE_ACTIVITY_COUNT = 5;

/** Keep the viewport at five summary rows even while individual tool details are open. */
export function ActivityList({ children, className, rowSelector }: {
  children: ReactNode; className: string; rowSelector: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = list.current;
    if (!node) return;
    const rows = Array.from(node.querySelectorAll<HTMLElement>(rowSelector)).slice(0, VISIBLE_ACTIVITY_COUNT);
    const measure = () => {
      const style = getComputedStyle(node);
      const spacing = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'] as const;
      const padding = spacing.reduce((sum, property) => sum + (parseFloat(style[property]) || 0), 0);
      const gap = parseFloat(style.rowGap) || 0;
      const height = rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0);
      if (height > 0) node.style.maxHeight = `${height + gap * (rows.length - 1) + padding}px`;
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    rows.forEach(row => observer.observe(row));
    return () => observer.disconnect();
  }, [children, rowSelector]);
  return <div ref={list} className={`${className} cs-activity-list`} data-activity-list tabIndex={0}
    role="region" aria-label={uiText('client.chat.activity')} onWheel={event => {
      if (event.currentTarget.scrollHeight > event.currentTarget.clientHeight) event.stopPropagation();
    }}>
    {children}
  </div>;
}
