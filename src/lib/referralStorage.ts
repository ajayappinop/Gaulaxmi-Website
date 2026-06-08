const REFERRER_STORAGE_KEY = 'gaulaxmi_referrer_id';

export function parseReferrerFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/\/ref\/([^/?#]+)/i);
  return match?.[1]?.trim() || null;
}

export function storeReferrerId(referrerId: string): void {
  const id = referrerId.trim();
  if (!id) return;
  localStorage.setItem(REFERRER_STORAGE_KEY, id);
}

export function consumeStoredReferrerId(): string | null {
  const fromUrl = parseReferrerFromUrl();
  if (fromUrl) {
    storeReferrerId(fromUrl);
    return fromUrl;
  }
  return localStorage.getItem(REFERRER_STORAGE_KEY);
}

export function clearStoredReferrerId(): void {
  localStorage.removeItem(REFERRER_STORAGE_KEY);
}
