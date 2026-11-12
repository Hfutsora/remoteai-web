import { useState, type ReactNode } from 'react';
import { Button, Modal, Popover, Switch, theme } from 'antd';
import { Settings, Star } from 'lucide-react';
import type { BrowserTab } from '../../provider-market/browserState';
import type { MarketText } from '../../provider-market/i18n';
import { bookmarkUrl, type Bookmark } from './model';
import { useBookmarks } from './context';
import { BookmarkBar } from './BookmarkBar';
import { BookmarkEditor } from './BookmarkEditor';
import { BookmarkManager } from './BookmarkManager';
import { bookmarkStatusKeys } from './status';
import { BookmarkDrawer } from './BookmarkDrawer';
import { useCompactBrowser } from './useCompactBrowser';
import './bookmarks.css';


export function useBrowserBookmarks(options: {
  tab?: BrowserTab; t: MarketText; navigate: (url: string) => void; newTab: (url: string) => void;
  close?: () => void;
  settingsContent?: ReactNode;
}) {
  const { tab, t } = options;
  const compact = useCompactBrowser();
  const { token } = theme.useToken();
  const { entries, showBar, status, store } = useBookmarks();
  const [settings, setSettings] = useState(false);
  const [menu, setMenu] = useState(false);
  const [manager, setManager] = useState(false);
  const [editor, setEditor] = useState<Bookmark>();
  const [deleting, setDeleting] = useState<Bookmark>();
  const [dragging, setDragging] = useState(false);
  const address = tab && bookmarkUrl(tab.url);
  const saved = address && entries.find(entry => entry.kind === 'link' && entry.url === address);
  const create = (kind: Bookmark['kind'], current = false) => {
    setEditor({ id: crypto.randomUUID(), kind, title: current ? tab?.title || (address ? new URL(address).hostname : '') : '',
      url: current ? address ?? '' : '', parentId: '', position: Math.max(-1, ...entries.map(entry => entry.position)) + 1 });
  };
  const visit = (entry: Bookmark, newTab = false) => {
    setMenu(false); setManager(false);
    if (newTab || !tab) options.newTab(entry.url); else options.navigate(entry.url);
  };
  const manage = () => { setMenu(false); setSettings(false); setManager(true); };
  const edit = (entry: Bookmark) => { setMenu(false); setEditor(entry); };
  const remove = (entry: Bookmark) => { setMenu(false); setDeleting(entry); };
  return {
    overlayOpen: settings || menu || manager || !!editor || !!deleting || dragging,
    star: <button type="button" aria-label={t(saved ? 'market.bookmarkEdit' : 'market.bookmarkAdd')}
      title={t(saved ? 'market.bookmarkEdit' : 'market.bookmarkAdd')} disabled={!address} aria-pressed={!!saved}
      className="browser-bookmark-star" onClick={() => saved ? edit(saved) : create('link', true)}>
      <Star size={17} fill={saved ? 'currentColor' : 'none'} /></button>,
    settings: <Popover trigger="click" placement="bottomRight" open={settings} onOpenChange={setSettings}
      overlayClassName="browser-bookmark-settings-popup" zIndex={1700} title={t('market.browserSettings')}
      content={<div className="browser-bookmark-settings">
        {options.settingsContent}
        <label><span>{t('market.bookmarkShowBar')}</span><Switch checked={showBar}
          aria-label={t('market.bookmarkShowBar')} onChange={store.setShowBar} /></label>
        <Button block onClick={manage}>{t(compact ? 'market.bookmarkAll' : 'market.bookmarkManage')}</Button>
        {compact && options.close && <Button block onClick={() => {
          setSettings(false); options.close?.();
        }}>{t('market.close')}</Button>}
        <span role="status" style={{ color: token.colorTextSecondary }}>{t(bookmarkStatusKeys[status])}</span>
        {(status === 'offline' || status === 'storage-error') && <Button size="small" onClick={store.refresh}>
          {t('market.retry')}</Button>}
      </div>}>
      <button type="button" aria-label={t('market.browserSettings')} title={t('market.browserSettings')}>
        <Settings size={17} /></button>
    </Popover>,
    bar: showBar && <BookmarkBar entries={entries} t={t} visit={visit} edit={edit} remove={remove}
      manage={manage} menuChanged={setMenu} dragChanged={setDragging} />,
    overlays: <>{manager && (compact
      ? <BookmarkDrawer t={t} close={() => setManager(false)} visit={visit} add={() => create('link', true)} />
      : <BookmarkManager t={t} close={() => setManager(false)} edit={edit} create={create} visit={visit} />)}
      {deleting && <Modal open width={400} zIndex={1850} title={t('market.bookmarkDelete')}
        okText={t('market.bookmarkDelete')} cancelText={t('market.cancel')} okButtonProps={{ danger: true }}
        onCancel={() => setDeleting(undefined)} onOk={() => { store.remove(deleting.id); setDeleting(undefined); }}>
        <p>{t('market.bookmarkDeleteConfirm')}</p>
        <span style={{ overflowWrap: 'anywhere', color: token.colorTextSecondary }}>{deleting.title}</span>
      </Modal>}
      {editor && <BookmarkEditor key={editor.id} entry={editor} t={t} close={() => setEditor(undefined)} />}</>,
  };
}
