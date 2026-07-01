"use client";

import { getOptimizerHistory } from "@/utils/apis/globalClientApi";
import { useDebounce } from "@/utils/customHooks";
import { Tooltip } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";

type OptimizerHistoryTableProps = {
  maxRows?: number;
  onHistoryPage? : boolean;
  refreshKey?: number;
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
  restoreStatus?: string | null;
  updateType?: string;
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

const optimizerHistoryGridCols =
  "grid-cols-[170px_170px_100px_120px_130px_110px_120px_120px_minmax(0,2fr)]";

function OptimizerHistoryTableSkeleton({
  rows = 10,
  showPagination = true,
}: {
  rows?: number;
  showPagination?: boolean;
}) {
  const rowGridClass = `grid min-h-[48px] w-full ${optimizerHistoryGridCols} items-center gap-4 border-b border-[#eeeeee] px-4`;

  return (
    <div className="w-full animate-pulse bg-white">
      <div
        className={`grid min-h-[40px] w-full ${optimizerHistoryGridCols} items-center gap-4 border-b border-[#e3e3e3] bg-[#f6f6f7] px-4 text-xs font-semibold text-[#616161]`}
      >
        <span>Created Date</span>
        <span>Completed Date</span>
        <span>Item Type</span>
        <span>Update Type</span>
        <span>Template Type</span>
        <span>Total Items</span>
        <span>Updated Items</span>
        <span>Status</span>
        <span>Template Value</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={rowGridClass}>
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-6 w-20 rounded-full bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
        </div>
      ))}
      {showPagination ? (
        <div className="border-t border-[#eeeeee] px-4 py-3">
          <div className="h-4 w-40 rounded bg-[#ececec]" />
        </div>
      ) : null}
    </div>
  );
}

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
      ? "badge-success"
      : normalized === "failed"
        ? "badge-error"
        : normalized === "pending" ||
            normalized === "fetching" ||
            normalized === "updating"
          ? "badge-warning"
          : "";

  return (
    <span
      className={`badge ${tone}`}
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
    selector: (row) => row.updateType ?? "",
    cell: (row) => <span>{row.updateType ?? "—"}</span>,
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
    cell: (row) => <StatusBadge status={row.status ?? "pending"} />,
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
  onHistoryPage=false,
  refreshKey,
}: OptimizerHistoryTableProps) {
  const [data, setData] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingQueque, setPendingQueque] = useState<any[]>([])
  const [search, setSearch] = useState<string>("")
  const searchText = useDebounce(search)

  const isPreview = maxRows != null && maxRows > 0;

  const fetchOptimizerHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOptimizerHistory();
      setData(
        Array.isArray(response.data) ? (response.data as HistoryRow[]) : [],
      );
      
      const pendingQueue = response.data.find((item: HistoryRow) => item.status !== "completed" && item.status !== "failed")
      if(pendingQueue) setPendingQueque([pendingQueue])
      else setPendingQueque([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { 
    fetchOptimizerHistory();
  }, [refreshKey]);

  const handleRefresh = () => {
    fetchOptimizerHistory()
  }

 // Derive everything in one chain
 const tableData = useMemo(() => {
  const sorted = sortByLatest(data);

  // filter first on all data
  const filtered = searchText.trim()
    ? sorted.filter((item) => {
        const resource = formatResource(item.resource).toLowerCase();
        const updateType = String(item.updateType ?? "").toLowerCase();
        return resource.includes(searchText.toLowerCase()) || updateType.includes(searchText.toLowerCase());
      })
    : sorted;

  // then slice
  return isPreview ? filtered.slice(0, maxRows) : filtered;
}, [data, searchText, isPreview, maxRows]);

  useEffect(() => console.log(search),[search])

  return (

    <div className="card p-0! mt-4">
          <div className="flex justify-start lg:justify-between items-start md:items-center gap-3 flex-col md:flex-row border-b border-[#DDDDDD] p-4">
            <div className="flex gap-2 flex-col xl:flex-row">
              <h2 className="text-base font-bold text-[#303030]">
                Bulk Optimizer History
              </h2>
              {
                pendingQueque && pendingQueque.length > 0 ? 
                <span className="badge badge-warning whitespace-normal">{pendingQueque.length} pending queue</span> 
                : <span className="badge badge-success whitespace-normal">No pending queue</span>
              }
            </div>
            <div className="flex gap-2 flex-col xl:flex-row xl:items-center">
              <Tooltip delay={0}>
                <Tooltip.Trigger
                  onClick={handleRefresh}
                  aria-label="Refresh history"
                  className="custom-btn flex h-[28px] w-[28px] shrink-0 items-center justify-center p-0! border-0"
                >
                  <Image src="/images/refresh-icon.svg" alt="" width={20} height={20} />
                </Tooltip.Trigger>
                <Tooltip.Content placement="top" showArrow>
                  <Tooltip.Arrow />
                  <p>Refresh history</p>
                </Tooltip.Content>
              </Tooltip>

              <div className="custom-input">
                <input
                  type="text"
                  onChange={(e) => setSearch(e.target.value)}
                  value={search}
                  placeholder="Item Type / Update Type"
                  className="form-control"
                />
              </div>

              {!onHistoryPage && <Link href="/optimizerHistory" className="btn-outline shrink-0">
                View All History
              </Link>}
            </div>
          </div>
          <div className="p-4">
              <div className="overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <OptimizerHistoryTableSkeleton
              rows={isPreview ? (maxRows ?? 5) : 10}
              showPagination={!isPreview}
            />
          ) : (
            <DataTable
              columns={columns}
              data={tableData}
              pagination={!isPreview}
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              customStyles={tableCustomStyles}
              theme="material"
              noDataComponent={
                <p className="py-10 text-sm text-[#616161]">No optimizer history yet.</p>
              }
            />
          )}
        </div>
          </div>
        </div>

    
  );
}