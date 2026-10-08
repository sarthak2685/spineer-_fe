const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api';

export type Role = 'SuperAdmin' | 'BusinessAdmin' | 'Customer';
export interface User {
  id: number;
  role: Role;
  name: string;
  businessId: number | null;
  businessToken: string | null;
  kind: 'user' | 'customer';
}

function token() { return localStorage.getItem('rs_token') || ''; }

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const bearer = token();
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`);
  const controller = !options.signal ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), 20_000) : undefined;
  try {
    const response = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include', signal: options.signal || controller?.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.message || 'Request failed.';
      const { toastErr } = await import('../lib/toast');
      toastErr(message);
      throw new Error(message);
    }
    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const { toastErr } = await import('../lib/toast');
      toastErr('Request timed out. Check that the API is running.');
      throw new Error('Request timed out.');
    }
    if (error instanceof TypeError) {
      const { toastErr } = await import('../lib/toast');
      toastErr('Cannot reach the API. Is it running on 127.0.0.1:3001?');
    }
    throw error;
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

export const client = {
  login: (body: unknown) => api<{ user: User; redirect: string; accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  me: () => api<{ user: User | null; redirect: string | null }>('/auth/me'),
  forgot: (identifier: string) => api<{ message: string; resetPath: string }>('/auth/forgot', { method: 'POST', body: JSON.stringify({ identifier }) }),
  reset: (body: unknown) => api<{ message: string }>('/auth/reset', { method: 'POST', body: JSON.stringify(body) }),
  countries: () => api<{ countryid: number; countryname: string }[]>('/locations/countries'),
  states: (countryId?: number) => api<{ stateid: number; statename: string }[]>(`/locations/states${countryId ? `?countryId=${countryId}` : ''}`),
  districts: (stateId: number) => api<{ districtid: number; districtname: string }[]>(`/locations/districts?stateId=${stateId}`),
  cities: (districtId: number) => api<{ cityid: number; cityname: string }[]>(`/locations/cities?districtId=${districtId}`),
  types: () => api<Record<string, string | number>[]>('/locations/business-types'),
  registerBusiness: (body: FormData) => api<{ user: User; redirect: string; accessToken: string }>('/register/business', { method: 'POST', body }),
  registerCustomer: (body: unknown) => api<{ user: User; redirect: string; accessToken: string; message: string }>('/register/customer', { method: 'POST', body: JSON.stringify(body) }),
  get: <T = unknown>(path: string) => api<T>(path),
  post: <T = unknown>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
};

export function asset(path?: string | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:3001${path}`;
}
