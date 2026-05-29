"use client";

import { getOptimizerHistory } from "@/utils/apis/globalApi";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";

const tableCustomStyles = {
  cells: {
    style: {
      whiteSpace: "normal" as const,
      wordBreak: "break-word" as const,
      alignItems: "center",
      justifyContent: "center",
    },
  },
  headCells: {
    style: {
      whiteSpace: "normal" as const,
    },
  },
};

const columns = [
  {
    name: "Started At",
    selector: (row: { startedAt?: string }) => row.startedAt,
    cell: (row: { startedAt?: string }) => (
      <div className="text-sm text-zinc-600 whitespace-normal break-words py-1 leading-snug">
        {row.startedAt ? new Date(row.startedAt).toLocaleString() : "—"}
      </div>
    ),
  },
  {
    name: "Completed At",
    selector: (row: { completedAt?: string | null }) => row.completedAt,
    cell: (row: { completedAt?: string | null }) => (
      <div className="text-sm text-zinc-600 whitespace-normal break-words py-1 leading-snug">
        {row.completedAt ? new Date(row.completedAt).toLocaleString() : "—"}
      </div>
    ),
  },
  {
    name: "Total Items",
    selector: (row: { totalProducts?: number; totalItems?: number }) =>
      row.totalProducts ?? row.totalItems,
    cell: (row: { totalProducts?: number; totalItems?: number }) => (
      <div className="text-sm text-zinc-600">
        {row.totalProducts ?? row.totalItems ?? "—"}
      </div>
    ),
  },
  {
    name: "Processed Items",
    selector: (row: { processedItems?: number }) => row.processedItems,
    cell: (row: { processedItems?: number }) => ( 
      <div className="text-sm text-zinc-600">
        {row.processedItems ?? "—"}
      </div>
    ),
  },
  {
    name: "Update Type",
    selector: (row: { blanksOnly?: Boolean }) => row.blanksOnly,
    cell: (row: { blanksOnly?: string }) => (
      <div className="text-sm text-zinc-600">
        {row.blanksOnly ? "Blanks Only" : "All"}
      </div>
    ),
  },
  {
    name: "Template",
    selector: (row: { template?: string | null }) => row.template ?? "",
    cell: (row: { template?: string | null }) => (
      <div
        className="text-sm text-zinc-600 whitespace-normal break-words py-1 leading-snug"
        title={row.template ?? ""}
      >
        {row.template ?? "—"}
      </div>
    ),
    wrap: true,
    minWidth: "280px",
    grow: 2,
  },
  {
    name: "Apply To",
    selector: (row: { resource?: string }) => row.resource,
    cell: (row: { resource?: string }) => (
      <div className="capitalize text-sm">{row.resource ?? "—"}</div>
    ),
  },
  {
    name: "Target",
    selector: (row: { target?: string | null }) => row.target,
    cell: (row: { target?: string | null }) => (
      <div className="capitalize text-sm">{row.target ?? "—"}</div>
    ),
  },
  {
    name: "Status",
    selector: (row: { status?: string }) => row.status,
    cell: (row: { status?: string }) => <StatusBox status={row.status ?? ""} />,
  },
];

const StatusBox = ({ status }: { status: string }) => {
  const statusColor: Record<string, string> = {
    fetching: "bg-yellow-500",
    pending: "bg-yellow-500",
    updating: "bg-yellow-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
    done: "bg-green-500",
  };

  return (
    <div className={`rounded-sm px-2 py-1 ${statusColor[status] ?? "bg-zinc-400"}`}>
      <span className="text-xs text-white">{status || "—"}</span>
    </div>
  );
};

export default function OptimizerHistoryPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptimizerHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOptimizerHistory();
        setData(Array.isArray(response.data) ? response.data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load history");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOptimizerHistory();
  }, []);

  return (
    <div className="p-4">
      <Link
        href="/bulkOptimizer"
        className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold mb-4">Optimizer History</h1>
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}
      <DataTable
        data={data}
        columns={columns as TableColumn<Record<string, unknown>>[]}
        pagination
        progressPending={loading}
        customStyles={tableCustomStyles}
      />
    </div>
  );
}
