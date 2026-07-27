"use client";

import { getCruiseControlHistory, restoreCruiseControlHistoryApi } from "@/utils/apis/globalClientApi";
import { useDebounce } from "@/utils/customHooks";
import { Tooltip } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import { toast } from "react-toastify";

type CruiseControlHistoryTableProps = {
  maxRows?: number;
  onHistoryPage?: boolean;
};

type HistoryRow = Record<string, unknown> & {
  _id?: string;
  startedAt?: string;
  createdAt?: string;
  completedAt?: string | null;
  processedItems?: number;
  template?: string | null;
  resource?: string;
  target?: string | null;
  status?: string;
  itemName?: string | null;
  previous?: unknown;
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

const cruiseHistoryGridCols =
  "grid-cols-[170px_120px_140px_130px_minmax(0,2fr)_minmax(140px,1fr)]";

function CruiseControlHistoryTableSkeleton({
  rows = 10,
  showPagination = true,
}: {
  rows?: number;
  showPagination?: boolean;
}) {
  const rowGridClass = `grid min-h-[48px] w-full ${cruiseHistoryGridCols} items-center gap-4 border-b border-[#eeeeee] px-4`;

  return (
    <div className="w-full animate-pulse bg-white">
      <div
        className={`grid min-h-[40px] w-full ${cruiseHistoryGridCols} items-center gap-4 border-b border-[#e3e3e3] bg-[#f6f6f7] px-4 text-xs font-semibold text-[#616161]`}
      >
        <span>Date</span>
        <span>Item Type</span>
        <span>Template Type</span>
        <span>Template Value</span>
        <span>Item Name</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={rowGridClass}>
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
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
    const aTime = new Date(
      a.completedAt ?? a.startedAt ?? a.createdAt ?? 0,
    ).getTime();
    const bTime = new Date(
      b.completedAt ?? b.startedAt ?? b.createdAt ?? 0,
    ).getTime();
    return bTime - aTime;
  });
}

function formatResource(resource?: string) {
  if (!resource) return "—";
  const map: Record<string, string> = {
    products: "Product",
    categories: "Category",
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

function getUpdatedItems(row: HistoryRow) {
  if (row.processedItems != null) return row.processedItems;
  if (row.status === "done" || row.status === "completed") return 1;
  return 0;
}

export default function CruiseControlHistoryTable({
  maxRows,
  onHistoryPage = false,
}: CruiseControlHistoryTableProps) {
  const [data, setData] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const searchText = useDebounce(search);

  const isPreview = maxRows != null && maxRows > 0;

  const fetchCruiseControlHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCruiseControlHistory();
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

  useEffect(() => {
    fetchCruiseControlHistory();
  }, []);

  const handleRestore = async (row: HistoryRow) => {
    const id = row._id;
    if (!id || restoringId) return;
    try {
      setRestoringId(id);
      const response = await restoreCruiseControlHistoryApi(id);
      if (!response.status) {
        toast.error(response.message || "Restore failed");
        return;
      }
      toast.success(response.message || "Restored successfully");
      setData((prev) => prev.filter((item) => item._id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setRestoringId(null);
    }
  };

  const columns: TableColumn<HistoryRow>[] = useMemo(
    () => [
      {
        name: "Date",
        selector: (row) => row.completedAt ?? row.startedAt ?? row.createdAt ?? "",
        cell: (row) => (
          <span>
            {formatDateTime(row.completedAt ?? row.startedAt ?? row.createdAt)}
          </span>
        ),
        minWidth: "170px",
      },
      {
        name: "Item Type",
        selector: (row) => row.resource ?? "",
        cell: (row) => <span>{formatResource(row.resource)}</span>,
        width: "120px",
      },
      {
        name: "Template Type",
        selector: (row) => formatTarget(row.target),
        cell: (row) => <span>{formatTarget(row.target)}</span>,
        minWidth: "140px",
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
      {
        name: "Item Name",
        selector: (row) => row.itemName ?? "",
        cell: (row) => <span>{row.itemName ?? "—"}</span>,
        minWidth: "140px",
      },
      {
        name: "Action",
        cell: (row) => (
          <button
            type="button"
            className="custom-btn"
            disabled={!row._id || !row.previous || restoringId === row._id}
            onClick={() => handleRestore(row)}
          >
            {restoringId === row._id ? "Restoring…" : "Restore"}
          </button>
        ),
        minWidth: "140px",
      },
    ],
    [restoringId],
  );

  const tableData = useMemo(() => {
    const sorted = sortByLatest(data);

    const filtered = searchText.trim()
      ? sorted.filter((item) =>
          formatResource(item.resource)
            .toLowerCase()
            .includes(searchText.toLowerCase()),
        )
      : sorted;

    return isPreview ? filtered.slice(0, maxRows) : filtered;
  }, [data, searchText, isPreview, maxRows]);

  return (
    <div className="card p-0! mt-4">
      <div className="flex justify-start lg:justify-between items-start md:items-center gap-3 flex-col md:flex-row border-b border-[#DDDDDD] p-4">
        <h2 className="text-base font-bold text-[#303030]">
          Auto Seo History
        </h2>

        <div className="flex gap-2 flex-col xl:flex-row xl:items-center">
          <Tooltip delay={0}>
            <Tooltip.Trigger
              onClick={fetchCruiseControlHistory}
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
              placeholder="Item Type"
              className="form-control"
            />
          </div>

          {!onHistoryPage && (
            <Link href="/cruiseControlHistory" className="btn-outline shrink-0">
              View All History
            </Link>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
          {error && <p className="p-4 text-sm text-red-600">{error}</p>}
          {loading ? (
            <CruiseControlHistoryTableSkeleton
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
                <p className="py-10 text-sm text-[#616161]">
                  No auto seo history yet.
                </p>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
