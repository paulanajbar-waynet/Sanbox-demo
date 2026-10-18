import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DataTable, type DataTableColumn } from "../src";

interface Row {
  id: string;
  name: string;
}

const columns: DataTableColumn<Row>[] = [{ key: "name", header: "Name", cell: (row) => row.name }];
const rows: Row[] = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Grace" },
];

describe("DataTable", () => {
  it("shows the loading state before rows arrive", () => {
    render(<DataTable columns={columns} rows={undefined} getRowId={(r) => r.id} isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("shows the error state with a retry action", async () => {
    const onRetry = vi.fn();
    render(<DataTable columns={columns} rows={undefined} getRowId={(r) => r.id} error="Boom" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows the empty state", () => {
    render(<DataTable columns={columns} rows={[]} getRowId={(r) => r.id} emptyTitle="No users" />);
    expect(screen.getByText("No users")).toBeInTheDocument();
  });

  it("renders rows and row actions", async () => {
    const onSelect = vi.fn();
    render(
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} rowActions={[{ label: "Open", onSelect }]} />,
    );
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByText("Grace")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: "Open" })[1]);
    expect(onSelect).toHaveBeenCalledWith(rows[1]);
  });

  it("paginates and disables buttons at the bounds", async () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        pagination={{ page: 1, pageSize: 2, total: 5, onPageChange }}
      />,
    );
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
