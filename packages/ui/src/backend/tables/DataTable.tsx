"use client";

import type { ReactNode } from "react";

import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { EmptyState } from "../feedback/EmptyState";
import { ErrorMessage } from "../feedback/ErrorMessage";
import { LoadingMessage } from "../feedback/LoadingMessage";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableRowAction<T> {
  label: string;
  onSelect: (row: T) => void;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowActions?: DataTableRowAction<T>[];
  pagination?: DataTablePagination;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  rowActions = [],
  pagination,
}: DataTableProps<T>) {
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />;
  if (!rows) return <LoadingMessage />;
  if (rows.length === 0 && !isLoading) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  const hasActions = rowActions.length > 0;

  return (
    <div className="flex flex-col gap-3" aria-busy={isLoading}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {hasActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell className="text-right">
                  {rowActions.map((action) => (
                    <Button key={action.label} variant="ghost" size="sm" onClick={() => action.onSelect(row)}>
                      {action.label}
                    </Button>
                  ))}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && <Pagination {...pagination} isLoading={isLoading} />}
    </div>
  );
}

function Pagination({ page, pageSize, total, onPageChange, isLoading }: DataTablePagination & { isLoading: boolean }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {page} of {pageCount} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={isLoading || page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
