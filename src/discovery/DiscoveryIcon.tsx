import { Compass } from 'lucide-react';
import { DownloadCountIcon } from '../../../../shared/downloads/DownloadCountIcon';

export function DiscoveryIcon({ owner, unread, size = 21 }: { owner?: string; unread: number; size?: number }) {
  if (!unread) return <DownloadCountIcon owners={[owner]}><Compass size={size} /></DownloadCountIcon>;
  return <span className="lounge-nav-icon"><Compass size={size} />
    <span className="mobile-lounge-badge">{unread > 99 ? '99+' : unread}</span></span>;
}
