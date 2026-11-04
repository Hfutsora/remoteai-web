import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { ComposerContextMenu } from '../../chat/ComposerContextMenu';
import { t } from '../../localization/browserClient';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { contextScope?: string; active?: boolean };

export const ComposerInput = forwardRef<HTMLTextAreaElement, Props>(
  function ComposerInput({ placeholder, contextScope, active, ...props }, ref) {
    return <div className="chat-composer-input">
      <ComposerContextMenu scope={contextScope} active={active} translate={t}>
        <textarea {...props} ref={ref} placeholder={placeholder} />
        {/* Browsers do not consistently ellipsize the native textarea placeholder. */}
        <span className="chat-composer-placeholder" aria-hidden="true">{placeholder}</span>
      </ComposerContextMenu>
    </div>;
  },
);
