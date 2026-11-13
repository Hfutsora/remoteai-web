import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import './nativeBrowserPreview.css';

/** Decode and commit the replacement before hiding a native child above the host document. */
export function useNativeBrowserPreview() {
  const [image, setImage] = useState<string | null>(null);
  const preview = useCallback(async (data: string | null, current: () => boolean) => {
    if (data) {
      const image = new Image();
      image.src = data;
      await image.decode();
    }
    if (current()) flushSync(() => setImage(data));
  }, []);
  return { image, preview };
}
