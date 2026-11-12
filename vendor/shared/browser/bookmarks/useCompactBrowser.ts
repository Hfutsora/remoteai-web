import { useSyncExternalStore } from 'react';

const query = '(max-width: 600px)';
const snapshot = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
const subscribe = (changed: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', changed);
  return () => media.removeEventListener('change', changed);
};
export const useCompactBrowser = () => useSyncExternalStore(subscribe, snapshot, () => false);
