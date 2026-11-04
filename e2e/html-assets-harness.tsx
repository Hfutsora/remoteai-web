import { createRoot } from 'react-dom/client';
import { ChatFilePreviewContent } from '../../../shared/remote-chat/views/ChatFilePreview';
import { ChatFileContext } from '../../../shared/remote-chat/views/ChatFileLink';
import { ChatDetailsWorkspace } from '../../../shared/remote-chat/views/ChatDetailsWorkspace';
import { ChatMarkdown } from '../../../shared/remote-chat/views/ChatMarkdown';
import { setLanguage } from '../../../shared/localization/browserClient';
import type { FileClient } from '../../../shared/remote-chat/fileDownload';
import '../src/styles.css';
import '../../../shared/remote-chat/views/chat.css';

interface Fixture {
  path: string; text: string; assets: Record<string, { data: string; mime: string }>; stalledPath?: string;
}
const fixture = (window as unknown as { htmlFixture: Fixture }).htmlFixture;
const sessions = new Map<string, string>();
const reads: string[] = [];
Object.assign(window, { assetReads: reads, assetSessions: sessions, setPreviewLanguage: setLanguage });
const client: FileClient = {
  open: async (threadId, path) => {
    if (threadId !== 'selected-remote-computer') throw new Error('Wrong computer');
    reads.push(path);
    if (path === fixture.stalledPath) await new Promise(() => {});
    const asset = fixture.assets[path];
    if (!asset) throw new Error('Missing asset');
    const id = crypto.randomUUID(); sessions.set(id, path);
    return { id, name: path.split('/').at(-1)!, size: atob(asset.data).length, mimeType: asset.mime };
  },
  read: async ({ id, offset, length }) => ({ offset,
    data: btoa(atob(fixture.assets[sessions.get(id)!].data).slice(offset, offset + length)) }),
  close: async (_threadId, id) => { sessions.delete(id); },
};
const context = { client, threadId: 'selected-remote-computer', ready: true,
  load: async () => ({ path: fixture.path, text: fixture.text }) };
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('drawer')
  ? <div className="chat-page" style={{ height: '100dvh' }}><ChatFileContext.Provider value={context}>
    <ChatDetailsWorkspace selected={context.threadId} active enabled>
      <ChatMarkdown text={`[Open report](${fixture.path.replaceAll(' ', '%20')})`} />
    </ChatDetailsWorkspace>
  </ChatFileContext.Provider></div>
  : <ChatFilePreviewContent path={fixture.path} context={context} />);
