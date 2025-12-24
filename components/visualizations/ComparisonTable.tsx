"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { ComparisonTableData } from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ComparisonTableProps {
  data: ComparisonTableData;
  readOnly?: boolean;
}

export default function ComparisonTable({ data }: ComparisonTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Dynamically create columns based on definition
  const columns = useMemo(() => {
    return data.columns.map((col) => ({
      accessorKey: col.accessorKey,
      header: col.header,
      cell: (info: any) => {
        const value = info.getValue();
        if (typeof value === "boolean") {
          return value ? (
            <span className="text-green-500 font-bold">✓</span>
          ) : (
            <span className="text-red-500 font-bold">✗</span>
          );
        }
        return value;
      },
    }));
  }, [data.columns]);

  const table = useReactTable({
    data: data.data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <VisualizationContainer>
      <div className="w-full h-full p-8 overflow-auto">
        <div className="rounded-xl border border-zinc-700/50 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-zinc-800/80">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4 text-sm font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-700/50 cursor-pointer hover:bg-zinc-700/50 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp size={14} />,
                          desc: <ChevronDown size={14} />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`
                    border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30
                    ${i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"}
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-4 text-zinc-300 text-sm border-r border-zinc-800/50 last:border-r-0"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </VisualizationContainer>
  );
}
