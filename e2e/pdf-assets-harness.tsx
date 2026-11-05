import { createRoot } from 'react-dom/client';
import PdfPreview from '../../../shared/file-preview/PdfPreview';
import { PdfAssetReader } from '../../../shared/file-preview/pdfAssets';
import { cmapPdf } from '../../desktop/e2e/cmap-pdf-fixture';

declare global {
  interface Window {
    readPdfAsset: (filename: string) => Promise<number[]>;
  }
}
window.readPdfAsset = async filename => Array.from(await new PdfAssetReader().fetch({ filename }));
const file = new Blob([cmapPdf()], { type: 'application/pdf' });
createRoot(document.getElementById('root')!).render(<PdfPreview file={file} name="cmap.pdf" />);
