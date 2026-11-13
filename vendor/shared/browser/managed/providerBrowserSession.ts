import { invoke } from '@tauri-apps/api/core';
import { nativeSurfaceSession } from './nativeSurfaceSession';

interface Request {
  url: string; headers: Record<string, string>; headerOrigin: string; visible: boolean; navigate: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  preservePreview?: boolean;
}

/** Serialize resize/navigation work and close only after pending native creation completes. */
export function nativeBrowserSession(id: string, onError: (reason: unknown) => void,
  preview: (image: string | null, current: () => boolean) => Promise<void> = async () => {}) {
  let lastUrl = '';
  const session = nativeSurfaceSession<Request>({
    apply: async ({ preservePreview: _preview, ...request }) => {
      await invoke('provider_browser_sync', { request: { ...request, id,
        navigate: request.navigate && request.url !== lastUrl } });
      if (request.visible) lastUrl = request.url;
    },
    capture: async () => {
      const image = await invoke<{ mimeType: string; data: string }>('provider_browser_preview', { id });
      return `data:${image.mimeType};base64,${image.data}`;
    },
    preview, failed: onError,
  });
  return {
    update: session.update,
    close: async () => { await session.close();
      await invoke('provider_browser_close', { id }); },
  };
}
