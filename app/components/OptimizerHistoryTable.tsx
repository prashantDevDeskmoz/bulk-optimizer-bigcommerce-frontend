"use client";

import { getOptimizerHistory } from "@/utils/apis/globalApi";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";

type OptimizerHistoryTableProps = {
  maxRows?: number;
  showViewAll?: boolean;
};

type HistoryRow = Record<string, unknown> & {
  startedAt?: string;
  createdAt?: string;
  completedAt?: string | null;
  totalItems?: number;
  totalProducts?: number;
  processedItems?: number;
  blanksOnly?: boolean;
  template?: string | null;
  resource?: string;
  target?: string | null;
  status?: string;
};

const tableCustomStyles = {
  table: {
    style: {
      backgroundColor: "#ffffff",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f6f6f7",
      borderBottom: "1px solid #e3e3e3",
      minHeight: "40px",
    },
  },
  headCells: {
    style: {
      fontSize: "12px",
      fontWeight: 600,
      color: "#616161",
      whiteSpace: "nowrap" as const,
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  rows: {
    style: {
      minHeight: "48px",
      borderBottom: "1px solid #eeeeee",
      fontSize: "13px",
      color: "#303030",
      backgroundColor: "#ffffff",
    },
  },
  cells: {
    style: {
      whiteSpace: "nowrap" as const,
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  pagination: {
    style: {
      borderTop: "1px solid #eeeeee",
      fontSize: "13px",
      color: "#616161",
    },
  },
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function sortByLatest(rows: HistoryRow[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(a.startedAt ?? a.createdAt ?? 0).getTime();
    const bTime = new Date(b.startedAt ?? b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}

function formatResource(resource?: string) {
  if (!resource) return "—";
  const map: Record<string, string> = {
    products: "Product",
    categories: "Category",
    brands: "Brand",
  };
  return map[resource] ?? resource.charAt(0).toUpperCase() + resource.slice(1);
}

function formatUpdateType(blanksOnly?: boolean) {
  return blanksOnly ? "Update Blank" : "Update All";
}

function formatTarget(target?: string | null) {
  if (!target) return "—";
  const map: Record<string, string> = {
    title: "Title Tag",
    meta: "Meta Description",
    alt: "Alt Text",
  };
  return map[target] ?? target;
}

function formatStatusLabel(status?: string) {
  if (!status) return "—";
  const map: Record<string, string> = {
    done: "Completed",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    fetching: "Fetching",
    updating: "Updating",
  };
  return map[status] ?? status;
}

function StatusBadge({ status }: { status: string }) {
  const label = formatStatusLabel(status);
  const normalized = status.toLowerCase();

  const tone =
    normalized === "done" || normalized === "completed"
      ? "bg-[#cdfee1] text-[#0d5c2e]"
      : normalized === "failed"
        ? "bg-[#fde2e2] text-[#b42318]"
        : normalized === "pending" ||
            normalized === "fetching" ||
            normalized === "updating"
          ? "bg-[#fff3cd] text-[#8a6116]"
          : "bg-[#f1f1f1] text-[#616161]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

const columns: TableColumn<HistoryRow>[] = [
  {
    name: "Created Date",
    selector: (row) => row.startedAt ?? row.createdAt ?? "",
    cell: (row) => (
      <span>{formatDateTime(row.startedAt ?? row.createdAt)}</span>
    ),
    minWidth: "170px",
  },
  {
    name: "Completed Date",
    selector: (row) => row.completedAt ?? "",
    cell: (row) => <span>{formatDateTime(row.completedAt)}</span>,
    minWidth: "170px",
  },
  {
    name: "Item Type",
    selector: (row) => row.resource ?? "",
    cell: (row) => <span>{formatResource(row.resource)}</span>,
    width: "100px",
  },
  {
    name: "Update Type",
    selector: (row) => formatUpdateType(row.blanksOnly),
    cell: (row) => <span>{formatUpdateType(row.blanksOnly)}</span>,
    minWidth: "120px",
  },
  {
    name: "Template Type",
    selector: (row) => formatTarget(row.target),
    cell: (row) => <span>{formatTarget(row.target)}</span>,
    minWidth: "130px",
  },
  {
    name: "Total Items",
    selector: (row) => String(row.totalItems ?? row.totalProducts ?? ""),
    cell: (row) => <span>{row.totalItems ?? row.totalProducts ?? "—"}</span>,
    width: "110px",
  },
  {
    name: "Updated Items",
    selector: (row) => String(row.processedItems ?? ""),
    cell: (row) => <span>{row.processedItems ?? "—"}</span>,
    width: "120px",
  },
  {
    name: "Status",
    selector: (row) => row.status ?? "",
    cell: (row) => <StatusBadge status={row.status ?? ""} />,
    width: "120px",
  },
  {
    name: "Template Value",
    selector: (row) => row.template ?? "",
    cell: (row) => (
      <span
        className="block max-w-[360px] whitespace-normal break-words leading-snug"
        title={row.template ?? ""}
      >
        {row.template ?? "—"}
      </span>
    ),
    minWidth: "280px",
    grow: 2,
  },
];

export default function OptimizerHistoryTable({
  maxRows,
  showViewAll = false,
}: OptimizerHistoryTableProps) {
  const [data, setData] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPreview = maxRows != null && maxRows > 0;

  const sortedData = useMemo(() => sortByLatest(data), [data]);
  const tableData = isPreview ? sortedData.slice(0, maxRows) : sortedData;

  useEffect(() => {
    const fetchOptimizerHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOptimizerHistory();
        setData(
          Array.isArray(response.data) ? (response.data as HistoryRow[]) : [],
        );
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
    <div className="overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
      {error && <p className="p-4 text-sm text-red-600">{error}</p>}
      <DataTable
        columns={columns}
        data={tableData}
        pagination={!isPreview}
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 25, 50]}
        progressPending={loading}
        customStyles={tableCustomStyles}
        theme="material"
        noDataComponent={
          <p className="py-10 text-sm text-[#616161]">No optimizer history yet.</p>
        }
      />
      {showViewAll && !loading && !error && (
        <div className="flex justify-center border-t border-[#eeeeee] bg-white py-4">
          <Link href="/optimizerHistory" className="btn-outline">
            View All
          </Link>
        </div>
      )}
    </div>
  );
}
