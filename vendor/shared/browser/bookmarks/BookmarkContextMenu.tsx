import { Dropdown } from 'antd';
import type { ReactNode } from 'react';
import { useThreadLongPress } from '../../chat/useThreadLongPress';
import type { MarketText } from '../../provider-market/i18n';
import type { Bookmark } from './model';

export interface BookmarkActions {
  t: MarketText; visit: (entry: Bookmark, newTab?: boolean) => void; edit: (entry: Bookmark) => void;
  remove: (entry: Bookmark) => void; manage: () => void; menuChanged: (open: boolean) => void;
}

export function BookmarkContextMenu({ entry, children, ...actions }: BookmarkActions & {
  entry: Bookmark; children: ReactNode;
}) {
  const gesture = useThreadLongPress(press => {
    press.target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
      clientX: press.x, clientY: press.y }));
  }, { nativeContextMenu: true });
  const { t, visit, edit, remove, manage, menuChanged } = actions;
  return <Dropdown trigger={['contextMenu']} onOpenChange={menuChanged} overlayClassName="browser-bookmark-menu"
    menu={{ items: [
      ...(entry.kind === 'link' ? [{ key: 'open', label: t('market.bookmarkOpenNew'), onClick: () => visit(entry, true) }] : []),
      { key: 'edit', label: t('market.bookmarkEdit'), onClick: () => edit(entry) },
      { key: 'delete', label: t('market.bookmarkDelete'), danger: true, onClick: () => remove(entry) },
      { type: 'divider' }, { key: 'manage', label: t('market.bookmarkManage'), onClick: manage },
    ] }}>
    <span {...gesture} data-path={entry.id} className="browser-bookmark-context"
      onContextMenu={event => { event.stopPropagation(); gesture.onContextMenu(event); }}
      onPointerDown={event => { event.stopPropagation(); gesture.onPointerDown(event); }}
      onKeyDown={event => {
        if (event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10') event.stopPropagation();
        gesture.onKeyDown(event);
      }}>{children}</span>
  </Dropdown>;
}
