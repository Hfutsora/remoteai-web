import { useContext, useId, type ReactNode } from 'react';
import { Popover, theme } from 'antd';
import { ChevronLeft, type LucideIcon } from 'lucide-react';
import { BrowserSettingsSubmenuContext, useBrowserSettingsColors } from './BrowserSettings';
import { useBrowserSubmenuKeyboard } from './useBrowserSubmenuKeyboard';

// Clear the parent popover's padding and border while leaving a small pointer-safe gap.
const SUBMENU_OFFSET = -24;

export function BrowserSettingsSubmenu({ icon: Icon, title, children, footer }: {
  icon: LucideIcon; title: string; children: ReactNode; footer?: ReactNode;
}) {
  const id = useId();
  const { active, change } = useContext(BrowserSettingsSubmenuContext);
  const open = active === id;
  const keyboard = useBrowserSubmenuKeyboard(open, value => change(id, value));
  const { token } = theme.useToken();
  const colors = useBrowserSettingsColors();
  return <Popover placement="leftTop" trigger={['hover', 'click']} open={open}
    onOpenChange={value => change(id, value)} arrow={false} destroyOnHidden zIndex={1720}
    autoAdjustOverflow={false} mouseLeaveDelay={0.15}
    align={{ offset: [SUBMENU_OFFSET, 0], overflow: { adjustX: false, adjustY: false, shiftY: true } }}
    overlayClassName="browser-chrome browser-settings-submenu-popup"
    styles={{ body: { padding: 6, borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}` } }}
    content={<div id={id} ref={keyboard.menu} role="menu" aria-label={title} onKeyDown={keyboard.onMenuKeyDown}
      className="browser-settings-submenu" style={colors}>
      <div className="browser-settings-submenu-list">{children}</div>
      {footer && <div className="browser-settings-submenu-footer">{footer}</div>}
    </div>}>
    <button ref={keyboard.trigger} type="button" className="browser-settings-action" aria-haspopup="menu"
      aria-expanded={open} aria-controls={open ? id : undefined} onKeyDown={keyboard.onTriggerKeyDown}>
      <Icon size="1.25em" /><span>{title}</span><ChevronLeft size="1.1em" />
    </button>
  </Popover>;
}
