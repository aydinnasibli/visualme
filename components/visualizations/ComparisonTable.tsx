"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { ComparisonTableData } from "@/lib/types/visualization";

interface ComparisonTableProps {
  data: ComparisonTableData;
  readOnly?: boolean;
}

const ACCENT = "#8b5cf6";

export default function ComparisonTable({ data }: ComparisonTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      (data?.columns || []).map((col) => ({
        id: col.id,
        accessorKey: col.accessorKey,
        header: col.header,
        cell: (info) => {
          const val = info.getValue();
          if (typeof val === "boolean") {
            return (
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                style={{ background: val ? "#10b98120" : "#ef444420", color: val ? "#10b981" : "#ef4444" }}
              >
                {val ? "✓" : "✗"}
              </span>
            );
          }
          if (val === null || val === undefined) return <span className="text-zinc-600">—</span>;
          return <span>{String(val)}</span>;
        },
      })),
    [data]
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!data?.columns?.length) return (
    <div className="w-full h-full flex items-center justify-center">
      <p className="text-zinc-500 text-sm">No data to display</p>
    </div>
  );

  return (
    <div className="w-full h-full overflow-auto p-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 cursor-pointer select-none hover:text-white transition-colors"
                  style={{ borderBottom: `1px solid #27272a` }}
                >
                  <div className="flex items-center gap-1.5">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? (
                      <ChevronUp className="w-3 h-3" style={{ color: ACCENT }} />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <ChevronDown className="w-3 h-3" style={{ color: ACCENT }} />
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
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
              className="transition-colors hover:bg-white/[0.03]"
              style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}
            >
              {row.getVisibleCells().map((cell, ci) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 text-zinc-200 border-b border-zinc-800/50"
                  style={{
                    fontWeight: ci === 0 ? 600 : 400,
                    color: ci === 0 ? "#e4e4e7" : "#a1a1aa",
                  }}
                >
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
