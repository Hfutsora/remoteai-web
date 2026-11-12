import { useState } from 'react';
import { Button, Drawer, Empty, Input } from 'antd';
import { ChevronLeft, ChevronRight, Folder, Globe } from 'lucide-react';
import type { Bookmark } from './model';
import type { MarketText } from '../../provider-market/i18n';
import { useBookmarks } from './context';
import { bookmarkStatusKeys } from './status';

export function BookmarkDrawer({ t, close, visit, add }: {
  t: MarketText; close: () => void; visit: (entry: Bookmark) => void; add: () => void;
}) {
  const { entries, status, store } = useBookmarks();
  const [folder, setFolder] = useState('');
  const [query, setQuery] = useState('');
  const parent = entries.find(entry => entry.id === folder && entry.kind === 'folder');
  const shown = entries.filter(entry => query.trim()
    ? `${entry.title} ${entry.url}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    : entry.parentId === (parent?.id ?? ''));
  return <Drawer open placement="bottom" height="75vh" zIndex={1750} title={parent?.title ?? t('market.bookmarkAll')}
    onClose={close} rootClassName="browser-bookmark-drawer">
    <div className="browser-bookmark-manager-tools">
      {parent && <Button aria-label={t('market.browserBack')} icon={<ChevronLeft size={16} />}
        onClick={() => setFolder(parent.parentId)} />}
      <Input value={query} placeholder={t('market.bookmarkSearch')} aria-label={t('market.bookmarkSearch')}
        onChange={event => setQuery(event.target.value)} />
      <Button onClick={add}>{t('market.bookmarkAdd')}</Button>
    </div>
    <div className="browser-bookmark-list">
      {!shown.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />}
      {shown.map(entry => <div key={entry.id} className="browser-bookmark-row">
        <button type="button" className="browser-bookmark-row-name" onClick={() => {
          if (entry.kind === 'folder') { setFolder(entry.id); setQuery(''); } else visit(entry);
        }}>
          {entry.kind === 'folder' ? <Folder size={20} /> : <Globe size={20} />}
          <span><strong>{entry.title}</strong>{entry.kind === 'link' && <small>{entry.url}</small>}</span>
          <ChevronRight size={16} />
        </button>
      </div>)}
    </div>
    <p role="status">{t(bookmarkStatusKeys[status])}</p>
    {(status === 'offline' || status === 'storage-error') && <Button onClick={store.refresh}>{t('market.retry')}</Button>}
  </Drawer>;
}
