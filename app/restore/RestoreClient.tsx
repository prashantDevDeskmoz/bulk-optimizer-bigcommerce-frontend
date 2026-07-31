"use client";

import ChannelSelector from "@/app/components/ChannelSelector";
import { useChannelContext } from "@/context/ChannelContext";
import {
  getRestoreItemsList,
  restoreItemsApi,
} from "@/utils/apis/globalClientApi";
import { truncateText } from "@/utils/commonFunctions";
import { useDebounce } from "@/utils/customHooks";
import {
  ChevronDown,
  ExternalLink,
  Search
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";

type RestoreItem = {
  _id: number;
  name: string;
  pageUrl: string;
  capturedAt: string[];
  target: string[];
};

type RestorePoint = {
  target: string;
  capturedAt: string;
};

const TARGET_LABELS: Record<string, string> = {
  title: "Title Tag",
  meta: "Meta Description",
  alt: "Alt Text",
};

function buildRestorePoints(row: RestoreItem): RestorePoint[] {
  return row.target
    .map((target, i) => ({
      target: row.target[i],
      capturedAt: row.capturedAt[i],
    }))
    .sort(
      (a, b) =>
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
    );
}

function formatRestoreLabel(target: string, capturedAt: string) {
  const d = new Date(capturedAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${TARGET_LABELS[target] ?? target} (${date} ${time})`;
}

const MENU_MIN_WIDTH = 256;

function RowRestoreDropdown({row, isOpen, onRestore, onOpenChange, disabled}
  : {row: RestoreItem, isOpen: boolean, onRestore: (itemId: number, target: string) => void, onOpenChange: (open: boolean) => void, disabled: boolean}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const points = buildRestorePoints(row);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? points.length * 36 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;
      const top = openAbove
        ? rect.top - menuHeight - 4
        : rect.bottom + 4;
      const left = Math.min(
        Math.max(8, rect.right - MENU_MIN_WIDTH),
        window.innerWidth - MENU_MIN_WIDTH - 8,
      );

      setMenuStyle({
        position: "fixed",
        top,
        left,
        minWidth: MENU_MIN_WIDTH,
        zIndex: 9999,
      });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, points.length]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen, onOpenChange]);

  if (points.length === 0) {
    return <span className="text-sm text-[#616161]">—</span>;
  }

  const menu =
    mounted && isOpen
      ? createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="rounded-lg border border-[#e3e3e3] bg-white py-1 shadow-lg"
          >
            {points.map((point, i) => (
              <button
                key={`${point.target}-${i}`}
                type="button"
                className="block w-full px-4 py-2 text-left text-[12px] text-[#303030] hover:bg-[#f6f6f7]"
                onClick={() => {
                  onOpenChange(false);
                  onRestore(row._id, point.target);
                }}
              >
                {formatRestoreLabel(point.target, point.capturedAt)}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
        className="btn-outline flex h-8! items-center gap-1 text-sm"
      >
        Restore
        <ChevronDown className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}

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

function RestoreTableSkeleton({ rows = 10 }: { rows?: number }) {
  const rowGridClass =
    "grid min-h-[48px] w-full grid-cols-[minmax(0,1fr)_minmax(0,2fr)_140px] items-center gap-4 border-b border-[#eeeeee] px-4";

  return (
    <div className="w-full animate-pulse bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={rowGridClass}>
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-4 w-full rounded bg-[#ececec]" />
          <div className="h-8 w-[100px] rounded bg-[#ececec]" />
        </div>
      ))}
    </div>
  );
}

export default function RestoreClient() {
  const { selectedChannel } = useChannelContext();
  const [items, setItems] = useState<RestoreItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [openRestoreRowId, setOpenRestoreRowId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const bcChannelId = selectedChannel?.channel_id ?? 0;
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search,setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);
  const [itemType, setItemType] = useState<"product" | "category" | "brand" | "all">("product");

  const fetchItems = async () => {
    setProductsLoading(true);
    getRestoreItemsList({
    bcChannelId,
    itemType,
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
  })
    .then((res) => {
      setItems(Array.isArray(res.data) ? res.data : []);
      setTotalItems(res.total ?? 0);
      setProductsError(null);
    })
    .catch((e) => {
      setProductsError(
        e instanceof Error ? e.message : "Failed to load products",
      );
      setItems([]);
    })
    .finally(() => setProductsLoading(false));
  };

  useEffect(() => {
    console.log("Loading items:::::::::::::::::::::::::::::::::::::::::::", bcChannelId, rowsPerPage, page, debouncedSearch, itemType);
    fetchItems();
  }, [bcChannelId, rowsPerPage, page, debouncedSearch, itemType]);

  useEffect(() => {
    setPage(1);
}, [bcChannelId, rowsPerPage, debouncedSearch, itemType]);

  const handleRestore = async (
    itemId: number,
    target: string,
  ) => {
    try {
      setActionLoading(true);
      const response = await restoreItemsApi({
        itemId,
        itemType,
        target,
      });
      if (response.status) {
        toast.success(response.message ?? "Restore queued successfully");
        fetchItems();
      } else {
        toast.error(response.message ?? "Restore failed");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Restore failed",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const itemColumns: TableColumn<RestoreItem>[] = [
    {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => (
        <span className="text-sm truncate text-[#303030]">{truncateText(row.name, 30)}</span>
      ),
      grow: 1,
    },
    {
      name: "Page URL",
      selector: (row) => row.pageUrl,
      cell: (row) =>
        row.pageUrl ? (
          <a
            href={`${selectedChannel?.site_url ?? ""}${row.pageUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#2c6ecb] hover:underline break-all"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {truncateText(`${selectedChannel?.site_url ?? ""}${row.pageUrl}`, 80)}
          </a>
        ) : (
          <span className="text-sm text-[#616161]">—</span>
        ),
      grow: 2,
    },
    {
      name: "Restore",
      cell: (row) => (
        <RowRestoreDropdown
          row={row}
          isOpen={openRestoreRowId === row._id}
          onOpenChange={(open) =>
            setOpenRestoreRowId(open ? row._id : null)
          }
          onRestore={handleRestore}
          disabled={actionLoading}
        />
      ),
      ignoreRowClick: true,
      width: "140px",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-5 pt-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-[#303030]">Restore</h1>
          <p className="mt-1 text-sm text-[#616161]">
            Roll back SEO fields or generate a restore report for selected
            products.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ChannelSelector />
          <Link href="/bulkOptimizer" className="btn-outline no-underline">
            Back to Optimizer
          </Link>
        </div>
      </div>

      <div className="card mb-4 overflow-hidden p-0!">
        <div className="border-b flex justify-between items-center border-[#e3e3e3] px-5 py-4">
          <h2 className="text-base font-semibold text-[#303030]">
            Restore
          </h2>
        </div>

        {/* Static toolbar — UI only for now */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#eeeeee] px-5 py-3">
          <div className="custom-dropi w-[140px]">
            <select defaultValue="product" className="w-full" onChange={(e) => setItemType(e.target.value as "product" | "category" | "brand")}>
              <option value="product">Products</option>
              <option value="category">Categories</option>
              <option value="brand">Brands</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-8 w-full rounded-md border border-[#8a8a8a] bg-white py-1 pl-9 pr-3 text-sm text-[#303030] outline-none"
            />
          </div>
        </div>

        {productsError ? (
          <p className="border-b border-[#eeeeee] p-4 text-sm text-red-600">
            {productsError}
          </p>
        ) : null}

        
          <DataTable
            columns={itemColumns}
            data={items}
            pagination
            paginationServer
            paginationPage={page}
            paginationPerPage={rowsPerPage}
            paginationTotalRows={totalItems}
            customStyles={tableCustomStyles}
            progressPending={productsLoading}
            paginationResetDefaultPage={false}
            progressComponent={<RestoreTableSkeleton rows={rowsPerPage} />}
            onChangePage={(page) => {
              setPage(page);
            }}
            onChangeRowsPerPage={(newLimit) => {
              setRowsPerPage(newLimit);
              setPage(1);
            }}
          />
      </div>
    </div>
  );
}