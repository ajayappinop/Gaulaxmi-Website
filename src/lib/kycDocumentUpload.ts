/** Keep under Express JSON body limit (2mb) including other KYC fields. */
const MAX_KYC_DOC_BYTES = 1_800_000;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export function readKycDocumentAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      reject(new Error('Please upload a JPG, PNG, WebP, or PDF file.'));
      return;
    }
    if (file.size > MAX_KYC_DOC_BYTES) {
      reject(new Error('File must be 1.8 MB or smaller.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read the file.'));
    };
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

export function isKycImageDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/');
}
