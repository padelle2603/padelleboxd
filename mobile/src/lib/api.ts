import { API_URL } from '@/lib/config';
import { getToken } from '@/lib/storage';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type JsonObject = { error?: unknown };

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (init.headers) {
    for (const [k, v] of Object.entries(init.headers as Record<string, string>)) {
      headers[k] = String(v);
    }
  }
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Network error. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? ((await res.json().catch(() => null)) as unknown)
    : ((await res.text().catch(() => '')) as unknown);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (typeof body === 'object' && body !== null) {
      const maybe = (body as JsonObject).error;
      if (typeof maybe === 'string' && maybe) message = maybe;
    }
    throw new ApiError(res.status, message);
  }

  return body as T;
}