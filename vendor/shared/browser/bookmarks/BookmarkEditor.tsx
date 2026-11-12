import { useState } from 'react';
import { Alert, Button, Input, Modal, Select } from 'antd';
import type { MarketText } from '../../provider-market/i18n';
import { bookmarkDescendants, bookmarkUrl, type Bookmark } from './model';
import { useBookmarks } from './context';

export function BookmarkEditor({ entry, t, close }: { entry: Bookmark; t: MarketText; close: () => void }) {
  const { store, entries } = useBookmarks();
  const [title, setTitle] = useState(entry.title);
  const [url, setUrl] = useState(entry.url);
  const [parentId, setParentId] = useState(entry.parentId);
  const [error, setError] = useState(false);
  const excluded = bookmarkDescendants(entries, entry.id);
  const existing = entries.some(item => item.id === entry.id);
  const submit = () => {
    const address = entry.kind === 'link' ? bookmarkUrl(url.trim()) : '';
    if (!title.trim() || entry.kind === 'link' && !address || !store.save({ ...entry,
      title: title.trim(), url: address ?? '', parentId })) { setError(true); return; }
    close();
  };
  return <Modal open title={t(entry.kind === 'folder' ? 'market.bookmarkFolder' : 'market.bookmarkEdit')}
    onCancel={close} width={400} zIndex={1800} footer={<>
      {existing && <Button danger onClick={() => { store.remove(entry.id); close(); }}>{t('market.bookmarkDelete')}</Button>}
      <Button onClick={close}>{t('market.cancel')}</Button><Button type="primary" onClick={submit}>{t('market.save')}</Button>
    </>}>
    <form className="browser-bookmark-form" onSubmit={event => { event.preventDefault(); submit(); }}>
      <label>{t('market.bookmarkName')}<Input autoFocus value={title} maxLength={200}
        aria-label={t('market.bookmarkName')} onChange={event => setTitle(event.target.value)} /></label>
      {entry.kind === 'link' && <label>{t('market.browserAddress')}<Input value={url} maxLength={4096}
        aria-label={t('market.browserAddress')} onChange={event => setUrl(event.target.value)} /></label>}
      <label>{t('market.bookmarkLocation')}<Select value={parentId} aria-label={t('market.bookmarkLocation')}
        onChange={setParentId} options={[{ value: '', label: t('market.bookmarkBar') },
          ...entries.filter(item => item.kind === 'folder' && !excluded.has(item.id))
            .map(item => ({ value: item.id, label: item.title }))]} /></label>
      {error && <Alert type="error" showIcon message={t('market.bookmarkInvalid')} />}
    </form>
  </Modal>;
}
