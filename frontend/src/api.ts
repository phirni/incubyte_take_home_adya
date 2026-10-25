import type { Filters, Session, Vehicle, VehicleInput } from './types';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.message ?? 'Something went wrong. Try again.',
    );
  }
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const dollarsToCents = (v: string) => Math.round(Number(v) * 100);

export const api = {
  register: (email: string, password: string) =>
    request<Session>('/api/auth/register', json('POST', { email, password })),
  login: (email: string, password: string) =>
    request<Session>('/api/auth/login', json('POST', { email, password })),

  async listVehicles(f: Filters, token: string): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (f.make.trim()) params.set('make', f.make.trim());
    if (f.model.trim()) params.set('model', f.model.trim());
    if (f.category.trim()) params.set('category', f.category.trim());
    if (f.minPrice.trim()) params.set('minPrice', String(dollarsToCents(f.minPrice)));
    if (f.maxPrice.trim()) params.set('maxPrice', String(dollarsToCents(f.maxPrice)));
    const qs = params.toString();
    const path = qs ? `/api/vehicles/search?${qs}` : '/api/vehicles';
    return (await request<{ vehicles: Vehicle[] }>(path, {}, token)).vehicles;
  },
  async purchase(id: string, token: string) {
    return (await request<{ vehicle: Vehicle }>(`/api/vehicles/${id}/purchase`, json('POST'), token)).vehicle;
  },
  async createVehicle(v: VehicleInput, token: string) {
    return (await request<{ vehicle: Vehicle }>('/api/vehicles', json('POST', v), token)).vehicle;
  },
  async updateVehicle(id: string, v: VehicleInput, token: string) {
    return (await request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, json('PUT', v), token)).vehicle;
  },
  deleteVehicle: (id: string, token: string) =>
    request<void>(`/api/vehicles/${id}`, json('DELETE'), token),
  async restock(id: string, quantity: number, token: string) {
    return (await request<{ vehicle: Vehicle }>(`/api/vehicles/${id}/restock`, json('POST', { quantity }), token)).vehicle;
  },
};
