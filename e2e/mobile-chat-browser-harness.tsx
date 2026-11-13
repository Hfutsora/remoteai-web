import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ApplicationTypography } from '../../../shared/appearance/ApplicationTypography';
import { BrowserNavigationProvider } from '../../../shared/browser/BrowserNavigationProvider';
import { BrowserPage } from '../../../shared/browser/BrowserPage';
import { BookmarkProvider } from '../../../shared/browser/bookmarks/context';
import { ChatDetailsWorkspace } from '../../../shared/remote-chat/views/ChatDetailsWorkspace';
import { ChatFileContext } from '../../../shared/remote-chat/views/ChatFileLink';
import { ChatMarkdown } from '../../../shared/remote-chat/views/ChatMarkdown';
import { setLanguage } from '../../../shared/localization/browserLanguage';
import { WebLocaleProvider } from '../src/i18n/WebLocaleProvider';
import { initializeTheme } from '../src/theme/preference';
import 'antd/dist/reset.css';
import '../src/styles.css';
import '../../../shared/remote-chat/views/chat.css';
import '../../../shared/remote-chat/views/messages.css';

initializeTheme(); setLanguage('zh');
const files: Record<string, string> = {
  'C:/fixture/页面预览.html': '<!doctype html><h1>聊天页面预览</h1><input aria-label="draft" value="保留页面状态">',
  'C:/fixture/说明文档.md': '# 中文预览标题\n\n聊天预览在独立标签中打开。\n\n[相关文件](代码预览.ts#L2)',
  'C:/fixture/代码预览.ts': 'const retained = true;\nconst newTab = true;\n',
};
const context = { threadId: 'fixture', ready: true,
  load: async (_thread: string, path: string) => ({ path, text: files[path] }),
  client: { open: async () => { throw new Error('Unavailable fixture file'); },
    read: async () => { throw new Error('Unavailable fixture file'); }, close: async () => {} },
};
function Fixture() {
  const [browser, setBrowser] = useState(false);
  return <ApplicationTypography><WebLocaleProvider><BookmarkProvider scope="chat-browser-fixture">
    <BrowserNavigationProvider onOpen={() => setBrowser(true)}>
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <main className="chat-page" hidden={browser} style={{ flex: 1, minHeight: 0 }}>
          <ChatFileContext.Provider value={context}>
            <ChatDetailsWorkspace selected="fixture" active={!browser} enabled={false}>
              <div className="chat-conversation" style={{ padding: 16 }}><ChatMarkdown text={
                Object.keys(files).map(path => `[${path.split('/').at(-1)}](${path})`).join('\n\n')
                + `\n\n[下载文件.zip](C:/fixture/下载文件.zip)\n\n[网页链接](${location.origin}/preview-site/page)`
                + `\n\n![图片菜单](${location.origin}/preview-site/image.svg)`} /></div>
            </ChatDetailsWorkspace>
          </ChatFileContext.Provider>
        </main>
        <BrowserPage language="zh" active={browser} onClose={() => setBrowser(false)} />
        <nav style={{ display: 'flex', justifyContent: 'space-around', padding: 12 }}>
          <button onClick={() => setBrowser(false)}>聊天</button><button onClick={() => setBrowser(true)}>浏览器</button>
        </nav>
      </div>
    </BrowserNavigationProvider>
  </BookmarkProvider></WebLocaleProvider></ApplicationTypography>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
