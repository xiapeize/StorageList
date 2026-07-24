const API_BASE = '/api';

let authToken: string | null = localStorage.getItem('fm_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('fm_token', token);
  } else {
    localStorage.removeItem('fm_token');
  }
}

export function getToken(): string | null {
  return authToken;
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (resp.status === 401) {
    setToken(null);
    throw new ApiError('未授权，请重新登录', 401);
  }

  const data = await resp.json();
  if (!resp.ok) {
    throw new ApiError(data.error || '请求失败', resp.status);
  }
  return data as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  getConfig: () =>
    request<{ storages: unknown[] }>('/config'),

  saveConfig: (storages: unknown[]) =>
    request<{ ok: boolean }>('/config', {
      method: 'POST',
      body: JSON.stringify({ storages }),
    }),

  health: () => request<{ ok: boolean }>('/health'),
};