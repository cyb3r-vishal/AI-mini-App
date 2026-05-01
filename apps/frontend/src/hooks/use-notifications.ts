'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Notification, NotificationListQuery } from '@ai-gen/shared';
import { api } from '@/lib/api-client';

const POLL_MS = 30_000;

export interface UseNotificationsReturn {
  items: Notification[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'unread';
  setFilter: (f: 'all' | 'unread') => void;
  refresh: () => Promise<void>;
  markRead: (ids?: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/**
 * Polling notifications hook.
 *
 * - Polls every 30 s while the tab is visible.
 * - Pauses polling when the tab is hidden.
 * - Provides `refresh()`, `markRead()`, optimistic `remove()`.
 *
 * Swap the polling for WebSocket / SSE later without changing the API.
 */
export function useNotifications(
  options: { enabled?: boolean; pageSize?: number } = {},
): UseNotificationsReturn {
  const { enabled = true, pageSize = 20 } = options;

  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const reqIdRef = useRef(0);

  const fetchOnce = useCallback(async () => {
    if (!enabled) return;
    const myReq = ++reqIdRef.current;
    setError(null);
    try {
      const query: Partial<NotificationListQuery> = { filter, pageSize, page: 1 };
      const res = await api.notifications.list(query);
      if (myReq !== reqIdRef.current) return;
      setItems(res.items);
      setTotal(res.total);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      if (myReq !== reqIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      if (myReq === reqIdRef.current) setIsLoading(false);
    }
  }, [enabled, filter, pageSize]);

  useEffect(() => {
    void fetchOnce();
  }, [fetchOnce]);

  // Visibility-aware polling.
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      stop();
      timer = setInterval(() => void fetchOnce(), POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        void fetchOnce();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [enabled, fetchOnce]);

  const markRead = useCallback(
    async (ids?: string[]) => {
      // Optimistic
      setItems((prev) =>
        prev.map((n) =>
          (ids ? ids.includes(n.id) : true) && !n.readAt
            ? { ...n, readAt: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((c) => {
        if (!ids) return 0;
        const newly = items.filter((n) => ids.includes(n.id) && !n.readAt).length;
        return Math.max(0, c - newly);
      });
      try {
        await api.notifications.markRead(ids);
      } catch {
        // Resync on failure
        await fetchOnce();
      }
    },
    [items, fetchOnce],
  );

  const remove = useCallback(async (id: string) => {
    // Optimistic
    setItems((prev) => prev.filter((n) => n.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    try {
      await api.notifications.remove(id);
    } catch {
      await fetchOnce();
    }
  }, [fetchOnce]);

  return {
    items,
    total,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    refresh: fetchOnce,
    markRead,
    remove,
  };
}
