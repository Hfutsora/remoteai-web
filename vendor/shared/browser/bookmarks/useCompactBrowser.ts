import { useSyncExternalStore } from 'react';

const query = '(max-width: 600px)';
const snapshot = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia(query).matches;
const subscribe = (changed: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(query);
  media.addEventListener?.('change', changed);
  return () => media.removeEventListener?.('change', changed);
};
export const useCompactBrowser = () => useSyncExternalStore(subscribe, snapshot, () => false);
