import { useEffect, useRef, useState } from 'react';
import { Popover, theme } from 'antd';
import { Circle, Minimize2 } from 'lucide-react';
import type { MarketText } from '../provider-market/i18n';
import { useFullscreenControl } from './useFullscreenControl';
import './browserFullscreenControl.css';

export function BrowserFullscreenControl({ t, exit }: { t: MarketText; exit: () => void }) {
  const [open, setOpen] = useState(false);
  const control = useFullscreenControl({ dismiss: () => setOpen(false), activate: () => setOpen(value => !value) });
  const menuItem = useRef<HTMLButtonElement>(null);
  const { token } = theme.useToken();
  const dismiss = () => { setOpen(false); control.button.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => menuItem.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  return <div ref={control.host} className="browser-fullscreen-control" onKeyDown={event => {
    if (open && event.key === 'Escape') { event.stopPropagation(); dismiss(); }
  }}>
    {open && <div className="browser-fullscreen-dismiss" onPointerDown={dismiss} />}
    <Popover open={open} trigger={[]} placement="bottomRight" arrow={false}
      getPopupContainer={trigger => trigger.parentElement!} overlayClassName="browser-fullscreen-popover"
      styles={{ body: { padding: 6, borderRadius: 14, border: `1px solid ${token.colorBorderSecondary}` } }}
      content={<div role="menu" aria-label={t('market.moreActions')}>
        <button ref={menuItem} type="button" role="menuitem" className="browser-fullscreen-menu-item"
          onClick={() => { setOpen(false); exit(); }}>
          <Minimize2 size="1.25em" /><span>{t('market.browserRestore')}</span>
        </button>
      </div>}>
      <button ref={control.button} type="button" className="browser-fullscreen-button" style={control.style}
        aria-label={t('market.moreActions')} aria-haspopup="menu" aria-expanded={open} {...control.handlers}
        onClick={event => { if (!event.detail) setOpen(value => !value); }}>
        <Circle size={20} aria-hidden="true" />
      </button>
    </Popover>
  </div>;
}
