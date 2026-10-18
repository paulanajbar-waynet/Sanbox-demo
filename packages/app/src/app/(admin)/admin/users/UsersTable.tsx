"use client";

import type { UserDto } from "@devmentor/core";
import { DataTable, useApiQuery, type DataTableColumn, type Page } from "@devmentor/ui";
import { useState } from "react";

const PAGE_SIZE = 20;

const columns: DataTableColumn<UserDto>[] = [
  { key: "name", header: "Name", cell: (user) => user.name },
  { key: "email", header: "Email", cell: (user) => user.email },
  {
    key: "createdAt",
    header: "Created",
    cell: (user) => new Date(user.createdAt).toLocaleDateString(),
    className: "text-right",
  },
];

/** Reference list screen: load through useApiQuery (apiCall), render through DataTable. Copy this shape for new lists. */
export function UsersTable() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, reload } = useApiQuery<Page<UserDto>>(`/api/users?page=${page}&pageSize=${PAGE_SIZE}`);

  return (
    <DataTable
      columns={columns}
      rows={data?.items}
      getRowId={(user) => user.id}
      isLoading={isLoading}
      error={error}
      onRetry={reload}
      emptyTitle="No users yet"
      pagination={data && { page: data.page, pageSize: data.pageSize, total: data.total, onPageChange: setPage }}
    />
  );
}
