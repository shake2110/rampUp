import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import React, { useState, useCallback, useRef } from "react";

export type TableData = {
  call_id: string;
  name: string;
  // Legacy interview fields
  overallScore: number;
  communicationScore: number;
  // Tutor screener fields
  clarityScore: number | null;
  simplicityScore: number | null;
  patienceScore: number | null;
  warmthScore: number | null;
  fluencyScore: number | null;
  callSummary: string;
};

interface DataTableProps {
  data: TableData[];
  interviewId: string;
}

function DataTable({ data, interviewId }: DataTableProps) {
  const hasTutorMetrics = React.useMemo(
    () => data.some((row) => row.clarityScore !== null && row.clarityScore !== undefined),
    [data],
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: hasTutorMetrics ? "clarityScore" : "overallScore", desc: true },
  ]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  React.useEffect(() => {
    setSorting([{ id: hasTutorMetrics ? "clarityScore" : "overallScore", desc: true }]);
  }, [hasTutorMetrics]);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback((rowId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredRowId(rowId);
    }, 400);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredRowId(null);
  }, []);

  const customSortingFn = useCallback((a: any, b: any) => {
    if (a === null || a === undefined) {
      return -1;
    }
    if (b === null || b === undefined) {
      return 1;
    }

    return a - b;
  }, []);

  const scoreCell = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return <div className="text-center text-gray-400 text-xs">—</div>;
    }
    const color =
      value >= 4
        ? "bg-green-100 text-green-700"
        : value >= 3
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700";
    return (
      <div className={`text-center text-xs font-bold px-2 py-1 rounded-full w-8 mx-auto ${color}`}>
        {value}
      </div>
    );
  }, []);

  const columns: ColumnDef<TableData>[] = React.useMemo(() => {
    const nameCol: ColumnDef<TableData> = {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className={`w-full justify-start font-semibold text-[15px] mb-1 ${
            column.getIsSorted() ? "text-indigo-600" : "text-black"
          }`}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-left min-h-[2.6em]">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer mr-2 flex-shrink-0">
                  <ExternalLink
                    size={16}
                    className="text-current hover:text-indigo-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `/interviews/${interviewId}?call=${row.original.call_id}`,
                        "_blank",
                      );
                    }}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-500 text-white font-normal">
                View Response
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="truncate">{row.getValue("name")}</span>
        </div>
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = rowA.getValue(columnId) as string;
        const b = rowB.getValue(columnId) as string;
        return a.toLowerCase().localeCompare(b.toLowerCase());
      },
    };

    const tutorCols: ColumnDef<TableData>[] = [
      {
        accessorKey: "clarityScore",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className={`w-full justify-center font-semibold text-[13px] mb-1 ${
              column.getIsSorted() ? "text-indigo-600" : "text-black"
            }`}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Clarity <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => scoreCell(row.getValue("clarityScore")),
        sortingFn: (rowA, rowB, columnId) =>
          customSortingFn(rowA.getValue(columnId), rowB.getValue(columnId)),
      },
      {
        accessorKey: "simplicityScore",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className={`w-full justify-center font-semibold text-[13px] mb-1 ${
              column.getIsSorted() ? "text-indigo-600" : "text-black"
            }`}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Simplicity <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => scoreCell(row.getValue("simplicityScore")),
        sortingFn: (rowA, rowB, columnId) =>
          customSortingFn(rowA.getValue(columnId), rowB.getValue(columnId)),
      },
      {
        accessorKey: "patienceScore",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className={`w-full justify-center font-semibold text-[13px] mb-1 ${
              column.getIsSorted() ? "text-indigo-600" : "text-black"
            }`}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Patience <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => scoreCell(row.getValue("patienceScore")),
        sortingFn: (rowA, rowB, columnId) =>
          customSortingFn(rowA.getValue(columnId), rowB.getValue(columnId)),
      },
      {
        accessorKey: "warmthScore",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className={`w-full justify-center font-semibold text-[13px] mb-1 ${
              column.getIsSorted() ? "text-indigo-600" : "text-black"
            }`}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Warmth <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => scoreCell(row.getValue("warmthScore")),
        sortingFn: (rowA, rowB, columnId) =>
          customSortingFn(rowA.getValue(columnId), rowB.getValue(columnId)),
      },
      {
        accessorKey: "fluencyScore",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className={`w-full justify-center font-semibold text-[13px] mb-1 ${
              column.getIsSorted() ? "text-indigo-600" : "text-black"
            }`}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fluency <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => scoreCell(row.getValue("fluencyScore")),
        sortingFn: (rowA, rowB, columnId) =>
          customSortingFn(rowA.getValue(columnId), rowB.getValue(columnId)),
      },
    ];

    const legacyCols: ColumnDef<TableData>[] = [
      {
        accessorKey: "overallScore",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className={`w-full justify-start font-semibold text-[15px] mb-1 ${
                column.getIsSorted() ? "text-indigo-600" : "text-black"
              }`}
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Overall Score
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="min-h-[2.6em] flex items-center justify-center">
            {row.getValue("overallScore") ?? "-"}
          </div>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as number | null;
          const b = rowB.getValue(columnId) as number | null;
          return customSortingFn(a, b);
        },
      },
      {
        accessorKey: "communicationScore",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              className={`w-full justify-start font-semibold text-[15px] mb-1 ${
                column.getIsSorted() ? "text-indigo-600" : "text-black"
              }`}
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Communication Score
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="min-h-[2.6em] flex items-center justify-center">
            {row.getValue("communicationScore") ?? "-"}
          </div>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as number | null;
          const b = rowB.getValue(columnId) as number | null;
          return customSortingFn(a, b);
        },
      },
    ];

    const summaryCol: ColumnDef<TableData> = {
      accessorKey: "callSummary",
      header: () => (
        <div className="w-full justify-start font-semibold text-[15px] mb-1 text-black">
          Summary
        </div>
      ),
      cell: ({ row }) => {
        const summary = row.getValue("callSummary") as string;
        return (
          <div className="text-xs text-justify pr-4">
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                hoveredRowId === row.id
                  ? "max-h-[1000px] opacity-100"
                  : "max-h-[2.6em] line-clamp-2 opacity-90"
              }`}
            >
              {summary}
            </div>
          </div>
        );
      },
    };

    return [nameCol, ...(hasTutorMetrics ? tutorCols : legacyCols), summaryCol];
  }, [hasTutorMetrics, interviewId, hoveredRowId, customSortingFn, scoreCell]);

  const safeSorting = React.useMemo(() => {
    const validIds = columns.map((c) => (c as any).accessorKey || c.id);
    const filtered = sorting.filter((s) => validIds.includes(s.id));
    return filtered.length > 0
      ? filtered
      : [{ id: hasTutorMetrics ? "clarityScore" : "overallScore", desc: true }];
  }, [sorting, columns, hasTutorMetrics]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: safeSorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-center">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onMouseEnter={() => handleMouseEnter(row.id)}
              onMouseLeave={handleMouseLeave}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="text-justify align-top py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
