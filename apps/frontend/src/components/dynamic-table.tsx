'use client';

import { useMemo, useState } from 'react';
import type { Entity, Field, TablePage } from '@ai-gen/shared';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { CellRenderer } from '@/registry';
import { useDynamicRecords } from '@/hooks/use-dynamic-records';
import type { RecordItem } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/cn';

/**
 * <DynamicTable />
 *
 * Config-driven table bound to the CRUD engine.
 *
 *  - `entity` + optional `columns` (from TablePage) decide rendering.
 *  - Columns without a matching field are shown with a warning badge — not hidden
 *    silently — so bad config is visible at a glance.
 *  - Unknown field types fall back to `UnknownCell` via the cell registry.
 *  - Supports search, pagination, sort, row actions (view/edit/delete).
 *  - Delete is optimistic + rolls back on failure.
 *
 * Rendering-only for actions: `onEdit` / `onView` are callbacks wired by the
 * hosting page (router.push, modal open, etc.).
 */

export type TableAction = 'view' | 'edit' | 'delete' | 'create';

export interface DynamicTableColumn {
  field: string;
  label?: string;
  sortable?: boolean;
  width?: number;
}

export interface DynamicTableProps {
  appId: string;
  entity: Entity | undefined;

  /** Columns from TablePage; if empty, all entity fields (minus `json`) are used. */
  columns?: DynamicTableColumn[];
  /** Available row/toolbar actions. */
  actions?: TableAction[];
  /** Rows per page (defaults to 25). */
  pageSize?: number;
  /** Enable free-text search input. */
  searchable?: boolean;

  title?: React.ReactNode;

  onCreate?: () => void;
  onView?: (row: RecordItem) => void;
  onEdit?: (row: RecordItem) => void;

  /** Wrap in a <Card>. Defaults to true. */
  card?: boolean;
  className?: string;
}

const DEFAULT_ACTIONS: TableAction[] = ['create', 'edit', 'delete'];

export function DynamicTable({
  appId,
  entity,
  columns,
  actions = DEFAULT_ACTIONS,
  pageSize = 25,
  searchable = true,
  title,
  onCreate,
  onView,
  onEdit,
  card = true,
  className,
}: DynamicTableProps) {
  // ---------- Resolve columns from entity -----------------------------------
  const resolvedColumns = useMemo(() => {
    if (!entity) return [];
    const baseCols =
      columns && columns.length > 0
        ? columns
        : entity.fields
            // JSON columns clutter; skip them by default.
            .filter((f) => f.type !== 'json')
            .map<DynamicTableColumn>((f) => ({
              field: f.key,
              label: f.label,
            }));

    return baseCols.map((col) => {
      const field = entity.fields.find((f) => f.key === col.field);
      return { ...col, resolved: field } as DynamicTableColumn & { resolved?: Field };
    });
  }, [entity, columns]);

  // ---------- Data ----------------------------------------------------------
  const records = useDynamicRecords({
    appId,
    entityKey: entity?.key ?? '',
    initialPageSize: pageSize,
    enabled: !!entity,
  });

  // ---------- Delete with rollback -----------------------------------------
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(row: RecordItem) {
    if (!entity) return;
    const confirmed =
      typeof window !== 'undefined' ? window.confirm('Delete this record?') : false;
    if (!confirmed) return;

    setDeletingId(row.id);
    records.removeLocal(row.id);
    try {
      await api.records.remove(appId, entity.key, row.id);
    } catch (err) {
      // Rollback: refetch to re-sync.
      await records.refetch();
      const msg = err instanceof Error ? err.message : 'Delete failed';
      if (typeof window !== 'undefined') window.alert(msg);
    } finally {
      setDeletingId(null);
    }
  }

  // ---------- Guard rails ---------------------------------------------------
  if (!entity) {
    return (
      <Card tone="ember" className={className}>
        <CardBody>
          <p className="text-sm text-paper-700">
            This table references an entity that no longer exists in the app config.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (resolvedColumns.length === 0) {
    return (
      <Card tone="sun" className={className}>
        <CardBody>
          <p className="text-sm text-paper-700">
            Entity <code>{entity.key}</code> has no columns to display.
          </p>
        </CardBody>
      </Card>
    );
  }

  const showActions = actions.some((a) => a === 'view' || a === 'edit' || a === 'delete');
  const canCreate = actions.includes('create') && !!onCreate;

  // ---------- Render --------------------------------------------------------
  const toolbar = (searchable || canCreate) && (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {searchable ? (
        <Input
          value={records.search}
          onChange={(e) => records.setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full sm:max-w-xs"
          leading={
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="2" />
              <path d="m14 14 3 3" stroke="currentColor" strokeWidth="2" />
            </svg>
          }
        />
      ) : (
        <span />
      )}
      {canCreate && (
        <Button
          onClick={onCreate}
          leftIcon={<PlusIcon />}
          className="w-full sm:w-auto"
        >
          New {entity.name}
        </Button>
      )}
    </div>
  );

  // Shared action row — used by both table and card views.
  const renderActions = (row: RecordItem) => (
    <div className="flex flex-wrap justify-end gap-1">
      {actions.includes('view') && onView && (
        <Button size="sm" variant="ghost" onClick={() => onView(row)} aria-label="View">
          View
        </Button>
      )}
      {actions.includes('edit') && onEdit && (
        <Button size="sm" variant="ghost" onClick={() => onEdit(row)} aria-label="Edit">
          Edit
        </Button>
      )}
      {actions.includes('delete') && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(row)}
          loading={deletingId === row.id}
          aria-label="Delete"
          className="text-ember-600 hover:bg-ember-50"
        >
          Delete
        </Button>
      )}
    </div>
  );

  const body = (
    <>
      {/* ===== Desktop / tablet: real table ===== */}
      <div
        className={cn(
          'hidden md:block',
          records.isRefetching && 'opacity-80 transition-opacity',
        )}
      >
        <TableContainer
          className={cn(card ? 'rounded-none border-0 shadow-none' : '')}
        >
          <Table>
            <TableHead>
              <TableRow>
                {resolvedColumns.map((col) => (
                  <TableHeaderCell
                    key={col.field}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label ?? col.resolved?.label ?? col.field}
                    {!col.resolved && <MissingFieldBadge />}
                  </TableHeaderCell>
                ))}
                {showActions && <TableHeaderCell align="right">Actions</TableHeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    {resolvedColumns.map((col) => (
                      <TableCell key={col.field}>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell align="right">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}

              {!records.isLoading &&
                !records.error &&
                records.items.map((row) => (
                  <TableRow key={row.id}>
                    {resolvedColumns.map((col) => (
                      <TableCell key={col.field}>
                        {col.resolved ? (
                          <CellRenderer
                            field={col.resolved}
                            value={row.data[col.field]}
                            row={row.data}
                          />
                        ) : (
                          <span className="text-paper-400">—</span>
                        )}
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell align="right">{renderActions(row)}</TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* ===== Mobile: stacked cards ===== */}
      <div
        className={cn(
          'flex flex-col gap-3 md:hidden',
          card && 'p-4 sm:p-5',
          records.isRefetching && 'opacity-80 transition-opacity',
        )}
      >
        {records.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`mskel-${i}`}
              className="rounded-block border-3 border-paper-200 bg-white p-4"
            >
              <Skeleton className="h-4 w-40" />
              <div className="mt-3 flex flex-col gap-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}

        {!records.isLoading &&
          !records.error &&
          records.items.map((row) => (
            <article
              key={row.id}
              className="rounded-block border-3 border-paper-200 bg-white p-4 shadow-block-sm"
            >
              <dl className="flex flex-col gap-2">
                {resolvedColumns.map((col, idx) => (
                  <div
                    key={col.field}
                    className={cn(
                      'flex flex-col gap-0.5',
                      idx === 0 && 'mb-1',
                    )}
                  >
                    <dt className="text-2xs font-semibold uppercase tracking-wider text-paper-500">
                      {col.label ?? col.resolved?.label ?? col.field}
                      {!col.resolved && <MissingFieldBadge />}
                    </dt>
                    <dd
                      className={cn(
                        'min-w-0 break-words text-sm',
                        idx === 0 && 'font-semibold text-paper-900',
                      )}
                    >
                      {col.resolved ? (
                        <CellRenderer
                          field={col.resolved}
                          value={row.data[col.field]}
                          row={row.data}
                        />
                      ) : (
                        <span className="text-paper-400">—</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {showActions && (
                <div className="mt-3 border-t-3 border-paper-100 pt-3">
                  {renderActions(row)}
                </div>
              )}
            </article>
          ))}
      </div>

      {/* ===== Shared empty / error (both breakpoints) ===== */}
      {!records.isLoading && records.error && (
        <div className="p-4 sm:p-6">
          <ErrorState
            inline
            title="Couldn't load records"
            message={records.error}
            onRetry={() => void records.refetch()}
          />
        </div>
      )}
      {!records.isLoading && !records.error && records.items.length === 0 && (
        <div className="p-4 sm:p-6">
          <EmptyState
            title={
              records.search
                ? `No results for “${records.search}”`
                : `No ${entity.name.toLowerCase()} yet`
            }
            description={
              records.search
                ? 'Try a different search term.'
                : canCreate
                ? `Create the first ${entity.name.toLowerCase()} to see it here.`
                : undefined
            }
            action={
              canCreate && !records.search ? (
                <Button onClick={onCreate} leftIcon={<PlusIcon />}>
                  New {entity.name}
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      <Pagination records={records} />
    </>
  );

  if (!card) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {toolbar}
        {body}
      </div>
    );
  }

  return (
    <Card className={className}>
      {(title || toolbar) && (
        <CardHeader className="gap-4">
          {title && <CardTitle>{title}</CardTitle>}
          {toolbar}
        </CardHeader>
      )}
      <CardBody className="p-0 sm:p-0">{body}</CardBody>
    </Card>
  );
}

// ---------- Helpers ---------------------------------------------------------

function MissingFieldBadge() {
  return (
    <Badge tone="ember" className="ml-2">
      missing
    </Badge>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path fill="currentColor" d="M7 2h2v5h5v2H9v5H7V9H2V7h5z" />
    </svg>
  );
}

// ---------- Pagination ------------------------------------------------------

function Pagination({
  records,
}: {
  records: ReturnType<typeof useDynamicRecords>;
}) {
  const { page, totalPages, total, pageSize } = records;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <CardFooter className="flex flex-col items-stretch gap-3 border-t-3 border-paper-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
        <p className="text-xs text-paper-600">
          {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
        </p>
        <Select
          size="sm"
          value={String(pageSize)}
          onChange={(e) => records.setPageSize(Number(e.target.value))}
          className="w-28"
          aria-label="Rows per page"
        >
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => records.setPage(page - 1)}
          className="flex-1 sm:flex-initial"
        >
          <span className="sm:hidden">Prev</span>
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="min-w-max text-xs tabular-nums text-paper-700">
          Page {page} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => records.setPage(page + 1)}
          className="flex-1 sm:flex-initial"
        >
          Next
        </Button>
      </div>
    </CardFooter>
  );
}

/** Re-export the column type when consumers configure via TablePage. */
export type { TablePage };
