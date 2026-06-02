"use client";

import { useChannelContext } from "@/context/ChannelContext";
import { saveTemplate, updateCruiseControl } from "@/utils/apis/globalApi";
import type { StoreInfo } from "@/utils/apis/storeApi";
import { getAllProductAndSaveTemplate, getBrandTemplateCache, getCategoryTemplateCache, getProductTemplateCache, setBrandTemplateCache, setCategoryTemplateCache, setProductTemplateCache } from "@/utils/cacheTemplate";
import {
  Clock,
  HistoryIcon,
  Package,
  PieChart,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import BulkOptimizerPreview, {
  type SeoTab,
} from "../components/BulkOptimizerPreview";
import ChannelSelector from "../components/globalSelector";
import OptimizerHistoryTable from "../components/OptimizerHistoryTable";
import SeoTemplateTextarea from "../components/SeoTemplateTextarea";
import Image from "next/image";
import { Tooltip } from "@heroui/react";

let PRODUCT_VARIABLES: { label: string; token: string }[] = [
  { label: "Product Name", token: "[[product name]]" },
  { label: "SKU", token: "[[sku]]" },
  { label: "Price", token: "[[price]]" },
  { label: "Currency", token: "[[currency]]" },
  { label: "Type", token: "[[type]]" },
  { label: "Category Name", token: "[[category name]]" },
  { label: "Brand", token: "[[brand]]" },
  { label: "MPN", token: "[[mpn]]" },
  { label: "Condition", token: "[[condition]]" },
  { label: "Store Name", token: "[[store name]]" },
];

let CATEGORY_VARIABLES: { label: string; token: string }[] = [
  { label: "Category Name", token: "[[category name]]" },
  { label: "Store Name", token: "[[store name]]" },
];

let BRAND_VARIABLES: { label: string; token: string }[] = [
  { label: "Name", token: "[[name]]" },
  { label: "Store Name", token: "[[store name]]" },
];

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

type BulkOptimizerClientProps = {
  initialStoreInfo: StoreInfo | null;
  allInitialTemplates: any[];
};

const STAT_CARDS: {
  label: string;
  value: string;
  icon: LucideIcon;
}[] = [
    { label: "Products", value: "1,248", icon: Package },
    { label: "Optimized", value: "87%", icon: Sparkles },
    { label: "Queue", value: "0", icon: Clock },
    { label: "Quota Used", value: "87/100", icon: PieChart },
  ];

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1]">
        <Icon className="h-6 w-6 text-[#303030]" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[13px] text-[#616161]">{label}</p>
        <p className="text-[22px] font-bold leading-tight text-[#303030]">{value}</p>
      </div>
    </div>
  );
}

export default function BulkOptimizerClient({
  initialStoreInfo,
  allInitialTemplates,
}: BulkOptimizerClientProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [template, setTemplate] = useState("");
  const [tab, setTab] = useState<SeoTab>("title");
  const [applyTo, setApplyTo] = useState("products");
  const [cruiseOn, setCruiseOn] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(
    initialStoreInfo?.store_name ?? null,
  );
  const { selectedChannel } = useChannelContext();
  const [brandSample, setBrandSample]: any = useState(
    initialStoreInfo?.brand ?? null,
  );
  const [cruiseLoading, setCruiseLoading] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [blanksOnly, setBlanksOnly] = useState(false);

  const handleUpdate = useCallback(
    async (onlyBlanks?: boolean) => {
      if (isUpdating) return;
      const updateBlanksOnly = onlyBlanks ?? blanksOnly;
      setIsUpdating(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("sessionToken")
            : null;

        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
          throw new Error("NEXT_PUBLIC_API_URL is not set");
        }

        const res = await fetch(`${apiBase}/bulk/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            applyTo,
            target: tab,
            template,
            cruiseControl: cruiseOn,
            bcChannelId: selectedChannel?.id,
            blanksOnly: updateBlanksOnly,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.message || err?.error || "Update failed");
        } else {
          toast.success("Bulk update is in progress");
        }
      } catch (e: unknown) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Update failed");
      } finally {
        setIsUpdating(false);
      }
    },
    [
      applyTo,
      cruiseOn,
      isUpdating,
      tab,
      template,
      selectedChannel?.id,
      blanksOnly,
    ],
  );

  useEffect(() => {
    if (allInitialTemplates && allInitialTemplates.length > 0) {
      getAllProductAndSaveTemplate(allInitialTemplates);
    }
  }, [allInitialTemplates])

  const handleCruiseControl = async () => {
    try {
      setCruiseOn(!cruiseOn);
      setCruiseLoading(true);
      const response = await updateCruiseControl({
        cruiseControl: !cruiseOn,
        applyTo,
        target: tab,
        bcChannelId: selectedChannel?.id ?? "",
      });
      if (response.status) {
        if (applyTo === "products") {
          setProductTemplateCache(tab, selectedChannel?.id ?? "", !cruiseOn ? "true" : "false", "cruiseControl");
        } else if (applyTo === "categories") {
          setCategoryTemplateCache(tab, selectedChannel?.id ?? "", !cruiseOn ? "true" : "false", "cruiseControl");
        }
        setCruiseLoading(false);
        toast.success(response.message);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update cruise control");
    }
  }

  const handleSaveTemplate = async (onlyBlanks?: boolean) => {
    if (isSavingTemplate) return;
    const saveBlanksOnly = onlyBlanks ?? blanksOnly;
    setIsSavingTemplate(true);
    try {
      const response = await saveTemplate({
        template,
        bcChannelId: selectedChannel?.id,
        applyTo,
        target: tab,
        blanksOnly: saveBlanksOnly,
      });

      if (response.status) {
        toast.success(response.message || "Template has been saved");
        if (applyTo === "products") {
          setProductTemplateCache(
            tab,
            selectedChannel?.id ?? "",
            template,
            "template",
          );
        } else if (applyTo === "categories") {
          setCategoryTemplateCache(
            tab,
            selectedChannel?.id ?? "",
            template,
            "template",
          );
        } else if (applyTo === "brands") {
          setBrandTemplateCache(tab, template);
        }
      } else {
        toast.error(response.message || "Failed to save template");
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSaveAndUpdate = async (onlyBlanks: boolean) => {
    if (isSavingTemplate || isUpdating) return;
    setBlanksOnly(onlyBlanks);
    await handleSaveTemplate(onlyBlanks);
    await handleUpdate(onlyBlanks);
  };

  const insertVariable = useCallback((token: string) => {
    const el = textareaRef.current;
    if (token === "[[store name]]" && storeName) {
      token = storeName;
    }
    const insertText = `${token} `;

    if (!el) {
      setTemplate((current) => current + insertText);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    setTemplate(
      (current) => current.slice(0, start) + insertText + current.slice(end),
    );
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insertText.length;
      el.setSelectionRange(pos, pos);
    });
  }, [storeName]);

  const tabLabels: { id: SeoTab; label: string }[] = [
    { id: "title", label: "Title Tag" },
    { id: "meta", label: "Meta Description" },
    { id: "alt", label: "Alt Text" },
  ];

  const applyToLabel =
    applyTo === "products"
      ? "Products"
      : applyTo === "categories"
        ? "Categories"
        : "Brands";

  const visibleTabs = tabLabels.filter(({ id }) =>
    applyTo === "products" ? true : id !== "alt",
  );

  const showCruiseControl = applyTo !== "brands" && tab !== "alt";
  const actionBusy = isSavingTemplate || isUpdating;

  useEffect(() => {
    if (applyTo === "products") {
      setTemplate(getProductTemplateCache(tab, selectedChannel?.id ?? "", "template") ?? storeName ?? "");
    } else if (applyTo === "categories") {
      setTemplate(getCategoryTemplateCache(tab, selectedChannel?.id ?? "", "template") ?? storeName ?? "");
    } else if (applyTo === "brands") {
      setTemplate(getBrandTemplateCache(tab) ?? storeName ?? "");
    }
  }, [storeName, applyTo, tab, selectedChannel?.id]);

  useEffect(() => {
    if ((applyTo === "brands" || applyTo === "categories") && tab === "alt") {
      setTab("title");
    }

    if (applyTo === "products") {
      setCruiseOn(getProductTemplateCache(tab, selectedChannel?.id ?? "", "cruiseControl") as unknown as boolean | false);
    } else if (applyTo === "categories") {
      setCruiseOn(getCategoryTemplateCache(tab, selectedChannel?.id ?? "", "cruiseControl") as unknown as boolean | false);
    }
  }, [applyTo, tab, selectedChannel?.id]);

  return (
    <div className="min-h-screen bg-[#F1F1F1] p-5 pt-0">
      {/* Header */}
      <header className="py-3 lg:py-6 flex justify-between items-start lg:items-center gap-3 flex-col lg:flex-row">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">
            Bulk Optimizer
          </h1>

          <p className="text-xs text-[#616161] mt-0.5">
            Optimiz hundreds of products safely with resuable SEO templates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ChannelSelector />

          <button className="custom-btn">
            Upgrade
          </button>
        </div>
      </header>

      <main className="">
        {/* Impact Overview */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
            />
          ))}
        </section>

        {/* Template builder + live preview */}
        <div className="flex gap-4">
          <section className="card p-0! flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-4 border-b border-[#DDDDDD]">
              <div>
                <h2 className="text-base font-bold text-[#303030]">
                  Build Your Template
                </h2>
                <p className="mt-0.5 text-xs text-[#616161]">
                  Create one smart template and apply it safely.
                </p>
              </div>

              <div className="custom-dropi">
                <select
                  value={applyTo}
                  onChange={(e) => setApplyTo(e.target.value)}
                  className=""
                  aria-label="Apply template to"
                >
                  <option value="products">Products</option>
                  <option value="categories">Categories</option>
                  <option value="brands">Brands</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-wrap gap-1">
                {visibleTabs.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-[#f1f1f1] ${tab === id
                      ? "bg-[#f1f1f1] text-[#303030]"
                      : "text-[#616161]"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="custom-textarea">
                <SeoTemplateTextarea
                  textareaRef={textareaRef}
                  value={template}
                  onChange={setTemplate}
                  placeholder="Select dynamic labels from below."
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(applyTo === "products"
                  ? PRODUCT_VARIABLES
                  : applyTo === "categories"
                    ? CATEGORY_VARIABLES
                    : BRAND_VARIABLES
                ).map(({ label, token }) => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => insertVariable(token)}
                    className="rounded-lg border border-[#c9c9c9] bg-white px-2.5 text-xs font-medium text-[#303030] transition hover:bg-[#f6f7fb] h-[24px] cursor-pointer">
                    + {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between p-4 border-t border-[#DDDDDD]">
              <div className="min-w-0 flex-1">
                <p className="mb-3 text-xs text-[#616161]">
                  Choose whether to update all items or only those with issues.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveTemplate()}
                    disabled={actionBusy}
                    className="btn-outline"
                  >
                    {isSavingTemplate && !isUpdating
                      ? "Saving..."
                      : "Save Template"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAndUpdate(true)}
                    disabled={actionBusy}
                    className="custom-btn"
                  >
                    {actionBusy
                      ? "Processing..."
                      : "Save & Update All Blanks (Recommended)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAndUpdate(false)}
                    disabled={actionBusy}
                    className="btn-outline"
                  >
                    Save & Update All
                  </button>
                </div>
              </div>

              {showCruiseControl && (
                <div className="flex min-w-[220px] items-center justify-between gap-4 rounded-lg border border-[#e3e3e3] bg-[#fafafa] px-3.5 py-3">
                  <div>
                    <p className="text-[12px] font-semibold text-[#303030]">
                      Cruise Control
                    </p>
                    <p className="mt-0.5 text-xs text-[#616161]">
                      Auto-apply template to new {applyToLabel.toLowerCase()}.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cruiseOn}
                    aria-label={`Cruise Control ${cruiseOn ? "on" : "off"}`}
                    onClick={handleCruiseControl}
                    disabled={cruiseLoading}
                    className={`flex h-6 w-13 shrink-0 items-center justify-between rounded-md p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${cruiseOn ? "bg-[#303030]" : "bg-[#c9c9c9]"
                      }`}
                  >
                    {cruiseOn ? (
                      <>
                        <span className="pl-1 text-[10px] font-bold leading-none text-white">
                          ON
                        </span>
                        <span className="flex h-[15px] w-[15px] items-center justify-center rounded-sm bg-white shadow-sm mr-0.5">
                          {cruiseLoading && (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#303030] border-t-transparent" />
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-[15px] w-[15px] items-center justify-center rounded-sm bg-white shadow-sm ml-0.5">
                          {cruiseLoading && (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#303030] border-t-transparent" />
                          )}
                        </span>
                        <span className="pr-1 text-[10px] font-bold leading-none text-[#303030]">
                          OFF
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>

          <BulkOptimizerPreview
            template={template}
            tab={tab}
            applyTo={applyTo}
            storeName={storeName}
            brandSample={brandSample}
          />
        </div>

        <div className="card p-0! mt-4">
          <div className="flex justify-start lg:justify-between items-start md:items-center gap-3 flex-col md:flex-row border-b border-[#DDDDDD] p-4">
            <div className="flex gap-2 flex-col xl:flex-row">
              <h2 className="text-base font-bold text-[#303030]">
                Optimizer History
              </h2>
              <span className="badge badge-success whitespace-normal">No pending queue</span>
            </div>
            <div className="flex gap-2 flex-col xl:flex-row xl:items-center">
              <Tooltip delay={0}>
                <Tooltip.Trigger
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
                  placeholder="Item Type / Update Type"
                  className="form-control"
                />
              </div>

              <Link href="/optimizerHistory" className="btn-outline shrink-0">
                View All History
              </Link>
            </div>
          </div>
          <div className="p-4">
            <OptimizerHistoryTable maxRows={5} />
          </div>
        </div>
      </main>
    </div>
  );
}
