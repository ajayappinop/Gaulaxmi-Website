import { api, ApiError } from './apiClient';

const API_RETRY_MS = 500;
const API_RETRY_COUNT = 12;

/** Poll /api/health until the backend is up (dev: API may start slightly after Vite). */
export async function waitForApiHealth(): Promise<boolean> {
  for (let i = 0; i < API_RETRY_COUNT; i++) {
    try {
      await api.health();
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, API_RETRY_MS));
    }
  }
  return false;
}

export function isLikelyNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof ApiError && err.status === 0) return true;
  return false;
}

export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Session expired — please sign in again.';
    if (err.status === 403) return err.message || 'You do not have permission for this action.';
    return err.message || `API error (${err.status})`;
  }
  if (isLikelyNetworkError(err)) {
    return 'Could not reach API. Start the stack with npm run dev:all or npm run dev:admin (starts API on port 4000).';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong while loading data.';
}
