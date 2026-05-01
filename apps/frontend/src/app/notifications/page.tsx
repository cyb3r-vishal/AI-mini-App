'use client';

import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, CardBody, CardFooter, EmptyState, ErrorState } from '@/components/ui';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/cn';

export default function NotificationsPage() {
  const n = useNotifications();

  return (
    <AppShell>
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="text-sm text-paper-500">
            {n.total.toLocaleString()} total · {n.unreadCount.toLocaleString()} unread
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={n.filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => n.setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={n.filter === 'unread' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => n.setFilter('unread')}
          >
            Unread
          </Button>
          {n.unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={() => n.markRead()}>
              Mark all read
            </Button>
          )}
        </div>
      </header>

      {n.error && (
        <ErrorState
          title="Couldn't load notifications"
          message={n.error}
          onRetry={() => void n.refresh()}
        />
      )}

      {n.isLoading && <p className="text-sm text-paper-500">Loading…</p>}

      {!n.isLoading && n.items.length === 0 && !n.error && (
        <EmptyState
          tone="sun"
          title="No notifications yet"
          description="Create or edit a record to trigger an event — it'll show up here within 30 seconds."
        />
      )}

      <div className="flex flex-col gap-3">
        {n.items.map((item) => {
          const unread = !item.readAt;
          return (
            <Card key={item.id} className={cn(unread && 'border-brand-400')}>
              <CardBody className="flex items-start gap-3">
                <Badge
                  tone={
                    item.type === 'RECORD_CREATED'
                      ? 'brand'
                      : item.type === 'RECORD_UPDATED'
                      ? 'sky'
                      : item.type === 'RECORD_DELETED'
                      ? 'ember'
                      : 'sun'
                  }
                >
                  {item.type.replace('RECORD_', '').toLowerCase()}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm',
                      unread ? 'font-semibold text-paper-900' : 'text-paper-700',
                    )}
                  >
                    {item.title}
                  </p>
                  {item.message && (
                    <p className="text-xs text-paper-500">{item.message}</p>
                  )}
                  <p className="mt-1 text-2xs uppercase tracking-wider text-paper-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardBody>
              <CardFooter className="justify-end gap-2">
                {unread && (
                  <Button variant="ghost" size="sm" onClick={() => n.markRead([item.id])}>
                    Mark read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => n.remove(item.id)}>
                  Dismiss
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
    </AppShell>
  );
}
