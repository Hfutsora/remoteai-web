import { cloneElement, useState, type HTMLAttributes, type ReactElement } from 'react';
import { Dropdown } from 'antd';
import { Globe } from 'lucide-react';
import { displayText, type MessageTranslator } from '../localization/messages';
import { useThreadLongPress } from './useThreadLongPress';
import styles from '../conversation/FileMenu.module.less';

/** Keep a normal click for fullscreen viewing, with the same alternate action for mouse and touch. */
export function ImageOpenMenu({ children, openBrowser, translate = displayText }: {
  children: ReactElement<HTMLAttributes<HTMLButtonElement>>;
  openBrowser?: () => void; translate?: MessageTranslator;
}) {
  const [open, setOpen] = useState(false);
  const gesture = useThreadLongPress(() => setOpen(true), { enabled: Boolean(openBrowser) });
  if (!openBrowser) return children;
  return <Dropdown trigger={['contextMenu']} open={open} onOpenChange={setOpen} autoFocus
    overlayClassName={styles.popup} overlayStyle={{ maxWidth: 400 }}
    menu={{ items: [{ key: 'browser', icon: <Globe size={16} />,
      label: translate('client.filePreview.openInBuiltInBrowser'), onClick: () => {
        setOpen(false); openBrowser();
      } }] }}>
    {cloneElement(children, { ...gesture, 'aria-haspopup': 'menu', 'aria-expanded': open })}
  </Dropdown>;
}
