/**
 * A2UI Table Component
 *
 * Data table component using TanStack Table.
 */

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import type { TableComponent } from "../types";

interface A2UITableProps {
  data: TableComponent;
  tableData: any[];
}

export function A2UITable({ data, tableData }: A2UITableProps) {
  // Create columns from A2UI column definitions
  // Support both formats: {key, label, type} and {accessorKey, header}
  const columns = data.columns.map((col: any) => ({
    accessorKey: col.accessorKey || col.key,
    header: col.header || col.label,
    cell: (info: any) => {
      const value = info.getValue();
      // Format based on type
      if (col.type === "number" && typeof value === "number") {
        return value.toLocaleString();
      }
      return value;
    },
  }));

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (tableData.length === 0) {
    return (
      <div className="a2ui-table-empty">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="a2ui-table-container">
      <table className="a2ui-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
