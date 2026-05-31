/**
 * Auth-aware fetch utility for admin API calls.
 * Automatically includes the Authorization Bearer token from localStorage.
 */

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Convenience wrapper: fetchWithAuth + parse JSON
 */
export async function fetchJson<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; ok: boolean; status: number }> {
  try {
    const res = await fetchWithAuth(url, options);
    if (res.ok) {
      const json = await res.json();
      return { data: json.data !== undefined ? json.data : json, ok: true, status: res.status };
    }
    return { data: null, ok: false, status: res.status };
  } catch {
    return { data: null, ok: false, status: 0 };
  }
}
