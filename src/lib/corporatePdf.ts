/** Served from /public/Gaulaxmi.pdf at runtime (Vite copies public/ to dist root). */
export const CORPORATE_PDF_URL = '/Gaulaxmi.pdf';
export const CORPORATE_PDF_FILENAME = 'Gaulaxmi.pdf';

/** Triggers browser download of the corporate presentation PDF. */
export function downloadCorporatePdf(): void {
  const link = document.createElement('a');
  link.href = CORPORATE_PDF_URL;
  link.download = CORPORATE_PDF_FILENAME;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
