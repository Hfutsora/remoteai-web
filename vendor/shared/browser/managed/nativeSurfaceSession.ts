interface Visibility { visible: boolean; preservePreview?: boolean }

/** Serialize native placement, keeping the last rendered page beneath application overlays. */
export function nativeSurfaceSession<Request extends Visibility>(options: {
  apply: (request: Request) => Promise<void>;
  capture: () => Promise<string>;
  preview: (image: string | null, current: () => boolean) => Promise<void>;
  failed: (reason: unknown) => void;
}) {
  let pending: Request | undefined;
  let flight: Promise<void> | undefined;
  let closed = false;
  let visible = false;
  const preserve = async (current: () => boolean) => {
    try {
      const image = await options.capture();
      if (current()) await options.preview(image, current);
    } catch (error) {
      // A failed preview must not prevent the menu or the original page from being usable.
      console.debug('Native browser overlay preview unavailable', error);
    }
  };
  const flush = async () => {
    while (pending && !closed) {
      const request = pending; pending = undefined;
      const current = () => !closed && (!pending || pending.visible === request.visible
        && pending.preservePreview === request.preservePreview);
      try {
        if (visible && !request.visible && request.preservePreview) await preserve(current);
        if (!current()) continue;
        await options.apply(request);
        visible = request.visible;
        if (!closed && (visible || !request.preservePreview)) await options.preview(null, () => !closed);
      } catch (reason) { pending = undefined; if (!closed) options.failed(reason); }
    }
  };
  return {
    update: (request: Request) => {
      if (closed) return;
      pending = request;
      if (!flight) flight = flush().finally(() => { flight = undefined; });
    },
    close: async () => { closed = true; pending = undefined; await flight; },
  };
}
