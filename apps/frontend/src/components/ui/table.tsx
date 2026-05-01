import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Composable table primitives styled for BlockKit.
 * Use inside a <Card> or wrap with <TableContainer /> for scroll + blocky frame.
 *
 *   <TableContainer>
 *     <Table>
 *       <TableHead>
 *         <TableRow>
 *           <TableHeaderCell>Name</TableHeaderCell>
 *         </TableRow>
 *       </TableHead>
 *       <TableBody>
 *         <TableRow><TableCell>…</TableCell></TableRow>
 *       </TableBody>
 *     </Table>
 *   </TableContainer>
 */

export const TableContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'overflow-x-auto rounded-block-lg border-3 border-paper-700 bg-white shadow-block',
      className,
    )}
    {...props}
  />
));
TableContainer.displayName = 'TableContainer';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn('w-full caption-bottom border-collapse text-sm', className)}
    {...props}
  />
));
Table.displayName = 'Table';

export const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-paper-100 text-paper-700', className)}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('divide-y-3 divide-paper-200 [&>tr]:bg-white', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export const TableFoot = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t-3 border-paper-300 bg-paper-50 text-paper-600', className)}
    {...props}
  />
));
TableFoot.displayName = 'TableFoot';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'transition-colors hover:bg-brand-50/60 data-[state=selected]:bg-brand-100',
      className,
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className, align = 'left', ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={cn(
        'h-12 border-b-3 border-paper-300 px-4 text-2xs font-semibold uppercase tracking-wider text-paper-600',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        align === 'left' && 'text-left',
        className,
      )}
      {...props}
    />
  ),
);
TableHeaderCell.displayName = 'TableHeaderCell';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  muted?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', muted, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-3 align-middle',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        muted && 'text-paper-500',
        className,
      )}
      {...props}
    />
  ),
);
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-3 text-sm text-paper-500', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// Optional empty-state row helper
export function TableEmpty({
  colSpan,
  children = 'No data',
}: {
  colSpan: number;
  children?: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-paper-500">
        {children}
      </TableCell>
    </TableRow>
  );
}
