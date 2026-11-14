import { createContext, useState, type CSSProperties, type ReactNode } from 'react';
import { theme } from 'antd';
import { Settings, type LucideIcon } from 'lucide-react';
import './browserSettings.css';

export const BrowserSettingsSubmenuContext = createContext<{
  active: string; change: (id: string, open: boolean) => void;
}>({ active: '', change: () => {} });

export function useBrowserSettingsColors() {
  const { token } = theme.useToken();
  return {
    '--browser-settings-border': token.colorSplit,
    '--browser-settings-hover': token.colorFillTertiary,
    '--browser-settings-accent': token.colorPrimary,
    '--browser-settings-muted': token.colorTextSecondary,
    '--browser-settings-disabled': token.colorTextDisabled,
    '--browser-settings-surface': token.colorFillQuaternary,
  } as CSSProperties;
}

export function BrowserSettingsPanel({ title, children, footer }: {
  title: string; children: ReactNode; footer: ReactNode;
}) {
  const colors = useBrowserSettingsColors();
  const [active, setActive] = useState('');
  const change = (id: string, open: boolean) => setActive(current => open ? id : current === id ? '' : current);
  return <BrowserSettingsSubmenuContext.Provider value={{ active, change }}>
    <div className="browser-bookmark-settings" style={colors}>
      <div className="browser-settings-heading"><Settings size="1.25em" /><strong>{title}</strong></div>
      <div className="browser-settings-list">{children}</div>
      <div className="browser-settings-footer">{footer}</div>
    </div>
  </BrowserSettingsSubmenuContext.Provider>;
}

export function BrowserSettingsAction({ icon: Icon, children, onClick, disabled, pressed, trailing }: {
  icon: LucideIcon; children: ReactNode; onClick: () => void; disabled?: boolean;
  pressed?: boolean; trailing?: ReactNode;
}) {
  return <button type="button" className="browser-settings-action" onClick={onClick}
    disabled={disabled} aria-pressed={pressed}>
    <Icon size="1.25em" /><span>{children}</span>{trailing}
  </button>;
}
