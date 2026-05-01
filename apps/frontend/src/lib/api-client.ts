import type {
  ApiResponse,
  AuthResponse,
  LoginInput,
  PublicUser,
  RegisterInput,
  AppConfig,
  PublicApp,
  ListRecordsQuery,
  ImportPreview,
  ImportCommitResult,
  NotificationListQuery,
  NotificationListResult,
} from '@ai-gen/shared';
import { clientEnv } from '../env/client';
import { tokenStorage } from './token-storage';

const API_URL = clientEnv.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean; // attach Authorization header
  _retry?: boolean; // internal: prevent infinite refresh loops
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as ApiResponse<AuthResponse>;
      if (!body.ok) return null;
      tokenStorage.set(body.data.tokens.accessToken);
      return body.data.tokens.accessToken;
    } catch {
      return null;
    } finally {
      // Release the in-flight slot on next microtask so concurrent callers share it.
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();
  return refreshInFlight;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && opts.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(opts.headers ?? {}),
  };

  if (opts.auth !== false) {
    const token = tokenStorage.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.body === undefined) {
    body = undefined;
  } else if (isFormData) {
    body = opts.body as FormData;
  } else {
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
    credentials: 'include',
    body,
  });

  // Try a one-shot refresh on 401.
  if (res.status === 401 && opts.auth !== false && !opts._retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, { ...opts, _retry: true });
    }
    tokenStorage.set(null);
  }

  // 204 No Content — typical for DELETE.
  if (res.status === 204) {
    if (!res.ok) {
      throw new ApiError(res.status, 'UNKNOWN', `Request failed (${res.status})`);
    }
    return undefined as T;
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !json || !json.ok) {
    const err = json && !json.ok ? json.error : undefined;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Request failed (${res.status})`,
      err?.details,
    );
  }
  return json.data;
}

export type RecordItem = {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export interface RecordListResult {
  items: RecordItem[];
  page: number;
  pageSize: number;
  total: number;
}

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    qs.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export const api = {
  auth: {
    register: (input: RegisterInput) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: input, auth: false }),
    login: (input: LoginInput) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: input, auth: false }),
    me: () => request<PublicUser>('/auth/me', { method: 'GET' }),
    logout: () =>
      request<{ success: boolean }>('/auth/logout', { method: 'POST', auth: false }),
    refresh: refreshAccessToken,
  },

  apps: {
    list: () => request<PublicApp[]>('/apps'),
    get: (appId: string) => request<PublicApp>(`/apps/${appId}`),
    getConfig: (appId: string) => request<AppConfig>(`/apps/${appId}/config`),
    create: (input: { slug: string; name: string; description?: string; config?: unknown }) =>
      request<PublicApp>('/apps', { method: 'POST', body: input }),
    publishConfig: (appId: string, config: unknown, notes?: string) =>
      request<{ version: number; config: AppConfig; issues: unknown[] }>(
        `/apps/${appId}/config`,
        { method: 'POST', body: { config, notes } },
      ),
    /** Toggle public sharing on/off via the existing PATCH /apps/:id. */
    setVisibility: (appId: string, isPublic: boolean) =>
      request<PublicApp>(`/apps/${appId}`, {
        method: 'PATCH',
        body: { isPublic },
      }),
  },

  /** Unauthenticated read-only API for shared apps. */
  public: {
    getApp: (ownerId: string, slug: string) =>
      request<PublicApp>(`/public/apps/${ownerId}/${slug}`, { auth: false }),
    getConfig: (ownerId: string, slug: string) =>
      request<AppConfig>(`/public/apps/${ownerId}/${slug}/config`, { auth: false }),
    listRecords: (
      ownerId: string,
      slug: string,
      entity: string,
      query: Partial<ListRecordsQuery> = {},
    ) =>
      request<RecordListResult>(
        `/public/apps/${ownerId}/${slug}/entities/${entity}/records${buildQuery(query as Record<string, unknown>)}`,
        { auth: false },
      ),
  },

  ai: {
    generateConfig: (input: { prompt: string; slug?: string; name?: string }) =>
      request<{ config: AppConfig; issues: unknown[]; modelUsed: string }>(
        '/ai/generate-config',
        { method: 'POST', body: input },
      ),
  },

  records: {
    list: (appId: string, entity: string, query: Partial<ListRecordsQuery> = {}) =>
      request<RecordListResult>(
        `/apps/${appId}/entities/${entity}/records${buildQuery(query as Record<string, unknown>)}`,
      ),
    get: (appId: string, entity: string, recordId: string) =>
      request<RecordItem>(`/apps/${appId}/entities/${entity}/records/${recordId}`),
    create: (appId: string, entity: string, data: Record<string, unknown>) =>
      request<RecordItem>(`/apps/${appId}/entities/${entity}/records`, {
        method: 'POST',
        body: data,
      }),
    update: (appId: string, entity: string, recordId: string, data: Record<string, unknown>) =>
      request<RecordItem>(`/apps/${appId}/entities/${entity}/records/${recordId}`, {
        method: 'PUT',
        body: data,
      }),
    remove: (appId: string, entity: string, recordId: string) =>
      request<void>(`/apps/${appId}/entities/${entity}/records/${recordId}`, {
        method: 'DELETE',
      }),
  },

  notifications: {
    list: (query: Partial<NotificationListQuery> = {}) =>
      request<NotificationListResult>(
        `/notifications${buildQuery(query as Record<string, unknown>)}`,
      ),
    unreadCount: () =>
      request<{ unreadCount: number }>(`/notifications/unread-count`),
    markRead: (ids?: string[]) =>
      request<{ updated: number }>(`/notifications/mark-read`, {
        method: 'POST',
        body: ids ? { ids } : {},
      }),
    remove: (id: string) =>
      request<void>(`/notifications/${id}`, { method: 'DELETE' }),
  },

  imports: {
    preview: (appId: string, entity: string, file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return request<ImportPreview>(
        `/apps/${appId}/entities/${entity}/import`,
        { method: 'POST', body: fd },
      );
    },
    commit: (
      appId: string,
      entity: string,
      input: { uploadId: string; mapping: Record<string, string>; skipInvalid: boolean },
    ) =>
      request<ImportCommitResult>(
        `/apps/${appId}/entities/${entity}/import/commit`,
        { method: 'POST', body: input },
      ),
  },
};
