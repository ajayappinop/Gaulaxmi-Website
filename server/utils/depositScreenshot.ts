const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_BYTES = 1_500_000;

export function validatePaymentScreenshot(
  dataUrl: unknown,
  fileName?: string
): { ok: true; dataUrl: string; fileName?: string } | { ok: false; error: string } {
  if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
    return { ok: false, error: 'Payment screenshot is required' };
  }
  const trimmed = dataUrl.trim();
  const match = trimmed.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return { ok: false, error: 'Screenshot must be a JPEG, PNG, or WebP image' };
  }
  const mime = match[1] as (typeof ALLOWED_MIME)[number];
  if (!ALLOWED_MIME.includes(mime)) {
    return { ok: false, error: 'Screenshot must be a JPEG, PNG, or WebP image' };
  }
  const base64 = match[2];
  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    return { ok: false, error: 'Screenshot must be 1.5 MB or smaller' };
  }
  const name =
    typeof fileName === 'string' && fileName.trim()
      ? fileName.trim().slice(0, 120)
      : undefined;
  return { ok: true, dataUrl: trimmed, fileName: name };
}
