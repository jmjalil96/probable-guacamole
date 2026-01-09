import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "../tables/data-table";

interface TestData {
  id: string;
  name: string;
  status: string;
}

const columnHelper = createColumnHelper<TestData>();

const testColumns = [
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("status", { header: "Status" }),
];

const testData: TestData[] = [
  { id: "1", name: "Item One", status: "Active" },
  { id: "2", name: "Item Two", status: "Pending" },
  { id: "3", name: "Item Three", status: "Inactive" },
];

describe("DataTable", () => {
  describe("rendering", () => {
    it("renders table with headers", () => {
      render(<DataTable data={testData} columns={testColumns} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("renders data rows", () => {
      render(<DataTable data={testData} columns={testColumns} />);

      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();
      expect(screen.getByText("Item Three")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("renders empty state when no data", () => {
      render(<DataTable data={[]} columns={testColumns} />);

      expect(screen.getByText("No results.")).toBeInTheDocument();
    });

    it("renders custom empty state", () => {
      render(
        <DataTable
          data={[]}
          columns={testColumns}
          emptyState="No items found"
        />
      );

      expect(screen.getByText("No items found")).toBeInTheDocument();
    });
  });

  describe("row clicks", () => {
    it("calls onRowClick when row is clicked", async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();

      render(
        <DataTable
          data={testData}
          columns={testColumns}
          onRowClick={onRowClick}
        />
      );

      await user.click(screen.getByText("Item One"));

      expect(onRowClick).toHaveBeenCalledWith(testData[0]);
    });

    it("makes rows keyboard navigable when onRowClick provided", () => {
      render(
        <DataTable data={testData} columns={testColumns} onRowClick={vi.fn()} />
      );

      const rows = screen.getAllByRole("button");
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe("sorting", () => {
    it("supports sorting when enabled", () => {
      const onSortingChange = vi.fn();

      render(
        <DataTable
          data={testData}
          columns={testColumns}
          enableSorting
          sorting={[]}
          onSortingChange={onSortingChange}
        />
      );

      expect(screen.getByText("Name")).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    it("renders pagination when enabled", () => {
      render(
        <DataTable
          data={testData}
          columns={testColumns}
          enablePagination
          pagination={{ pageIndex: 0, pageSize: 10 }}
          pageCount={1}
        />
      );

      expect(screen.getByText(/items/i)).toBeInTheDocument();
    });

    it("uses custom item name in pagination", () => {
      render(
        <DataTable
          data={testData}
          columns={testColumns}
          enablePagination
          pagination={{ pageIndex: 0, pageSize: 10 }}
          pageCount={1}
          itemName="claims"
        />
      );

      expect(screen.getByText(/claims/i)).toBeInTheDocument();
    });
  });

  describe("row selection", () => {
    it("renders checkboxes when row selection enabled", () => {
      const selectColumns = [
        columnHelper.display({
          id: "select",
          header: ({ table }) => <DataTable.SelectAll table={table} />,
          cell: ({ row }) => <DataTable.SelectRow row={row} />,
        }),
        ...testColumns,
      ];

      render(
        <DataTable
          data={testData}
          columns={selectColumns}
          enableRowSelection
          rowSelection={{}}
          onRowSelectionChange={vi.fn()}
          getRowId={(row) => row.id}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe("custom row id", () => {
    it("uses custom getRowId function", () => {
      const getRowId = vi.fn((row: TestData) => row.id);

      render(
        <DataTable data={testData} columns={testColumns} getRowId={getRowId} />
      );

      expect(getRowId).toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has accessible table role", () => {
      render(<DataTable data={testData} columns={testColumns} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renders column headers correctly", () => {
      render(<DataTable data={testData} columns={testColumns} />);

      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(2);
    });
  });
});
