import { downloadManager } from '../../../shared/downloads/manager';
import type { DownloadClient } from '../../../shared/remote-chat/downloads';
import type { FileClient } from '../../../shared/remote-chat/fileDownload';

export const browserDownloads = { delay: 300, snapshot: downloadManager.snapshot };
declare global { interface Window { browserDownloads: typeof browserDownloads } }
window.browserDownloads = browserDownloads;
const FILE_SIZE = 8 * 1024 * 1024;
const client: DownloadClient = {
  open: async ({ path }) => ({ id: '11111111-1111-4111-8111-111111111111', name: path.split('/').at(-1)!,
    size: FILE_SIZE, mimeType: 'application/zip', revision: 'browser-download-fixture' }),
  read: async ({ offset, length }) => {
    await new Promise(resolve => setTimeout(resolve, browserDownloads.delay));
    return { offset, data: btoa('A'.repeat(Math.min(length, FILE_SIZE - offset))) };
  },
  close: async () => {},
  browse: async () => ({ directory: '/', parent: null, entries: [], truncated: false }),
};
export function bindBrowserDownloads(files: FileClient) {
  downloadManager.bind({ owner: 'browser-fixture', deviceId: 'fixture-pc', deviceName: 'PC',
    ready: true, windowSize: 1, client, files });
}
