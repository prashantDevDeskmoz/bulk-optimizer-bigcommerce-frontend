"use client";

import { useChannelContext } from "@/context/ChannelContext";
import { getDashboardInfoApi, saveTemplate, updateBulkApi, updateCruiseControl } from "@/utils/apis/globalClientApi";
import type { StoreInfo } from "@/utils/apis/globalServerApi";
import { getAllProductAndSaveTemplate, getBrandTemplateCache, getCategoryTemplateCache, getProductTemplateCache, setBrandTemplateCache, setCategoryTemplateCache, setProductTemplateCache } from "@/utils/cacheTemplate";
import { Clock, Package, PieChart, Sparkles, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import BulkOptimizerPreview, { type SeoTab } from "../components/BulkOptimizerPreview";
import ChannelSelector from "../components/ChannelSelector";
import OptimizerHistoryTable from "../components/OptimizerHistoryTable";
import SeoTemplateTextarea from "../components/SeoTemplateTextarea";

const PRODUCT_VARIABLES: { label: string; token: string }[] = [
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

const CATEGORY_VARIABLES: { label: string; token: string }[] = [
  { label: "Category Name", token: "[[category name]]" },
  { label: "Store Name", token: "[[store name]]" },
];

const BRAND_VARIABLES: { label: string; token: string }[] = [
  { label: "Name", token: "[[name]]" },
  { label: "Store Name", token: "[[store name]]" },
];

type BulkOptimizerClientProps = {
  initialStoreInfo: StoreInfo | null;
  allInitialTemplates: any[];
  dashboardInfo: any[] | null;
};

const STAT_CARDS = (dashboardInfo: any) => {
  return [
    { label: "Products", value: dashboardInfo?.totalProducts ?? "0", icon: Package },
    { label: "Optimized Items", value: dashboardInfo?.optimizedItemsCount ?? "0", icon: Sparkles },
    { label: "Queue", value: dashboardInfo?.queue ?? "0", icon: Clock },
    { label: "Quota Used", value: (dashboardInfo?.quotaUsed?.usage ?? "0") + "/" + (dashboardInfo?.quotaUsed?.planLimit ?? "0"), icon: PieChart,
      condition: Number(dashboardInfo?.quotaUsed?.usage) >= Number(dashboardInfo?.quotaUsed?.planLimit) ,
     },
  ];
}

function StatCard({
  label,
  value,
  icon: Icon,
  condition = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  condition?: boolean;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1]">
        <Icon className="h-6 w-6 text-[#303030]" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[13px] text-[#616161]">{label}</p>
        <p className={`text-[22px] font-bold leading-tight text-[#303030] ${condition ? "animate-bounce duration-500 text-red-500" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export default function BulkOptimizerClient({
  initialStoreInfo,
  allInitialTemplates,
  dashboardInfo,
}: BulkOptimizerClientProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [template, setTemplate] = useState("");
  const [tab, setTab] = useState<SeoTab>("title");
  const [applyTo, setApplyTo] = useState("products");
  const [cruiseOn, setCruiseOn] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { selectedChannel } = useChannelContext();
  
  const [cruiseLoading, setCruiseLoading] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [dashboard, setDashboard] = useState(dashboardInfo);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const brandSample = useMemo(() => {
    return initialStoreInfo?.brand ?? null;
  }, [initialStoreInfo?.brand]);

  const storeName = useMemo(() => {
    return initialStoreInfo?.store_name ?? null;
  }, [initialStoreInfo?.store_name]);

  const refetchDashboard = useCallback(async () => {
    try {
      const res = await getDashboardInfoApi();
      if (res?.data) {
        setDashboard(res.data);
        return res.data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, []);

  const pollDashboard = useCallback(async () => {
    const data = await refetchDashboard();
    if (Number(data?.queue) > 0) {
      setTimeout(pollDashboard, 5000);
    }
  }, [refetchDashboard]);

  const handleUpdate = useCallback(async (onlyBlanks?: boolean) => {
      if (isUpdating) return;
      const updateBlanksOnly = onlyBlanks;
      setIsUpdating(true);
      try {
        const response = await updateBulkApi({
          applyTo,
          target: tab,
          template,
          cruiseControl: cruiseOn,
          bcChannelId: selectedChannel?.channel_id,
          blanksOnly: updateBlanksOnly,
        });

        if (response.status) {
          toast.success("Added bulk update job to queue. Your template is saved and will be applied to new items.");
          setRefreshKey((k) => k + 1);
          pollDashboard();
        } else {
          toast.error(response.message || "Update failed");
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
      selectedChannel?.channel_id,
      pollDashboard,
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
        bcChannelId: selectedChannel?.channel_id ?? 0,
      });
      if (response.status) {
        if (applyTo === "products") {
          setProductTemplateCache(tab, selectedChannel?.channel_id ?? 0, !cruiseOn ? "true" : "false", "cruiseControl");
        } else if (applyTo === "categories") {
          setCategoryTemplateCache(tab, selectedChannel?.channel_id ?? 0, !cruiseOn ? "true" : "false", "cruiseControl");
        }
        setCruiseLoading(false);
        toast.success(response.message);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update cruise control");
    }
  }

  const handleSaveTemplate = async (onlyBlanks?: boolean, showToast: boolean = true) => {
    if (isSavingTemplate) return;
    const saveBlanksOnly = onlyBlanks;
    setIsSavingTemplate(true);
    try {
      const response = await saveTemplate({
        template,
        bcChannelId: selectedChannel?.channel_id ?? 0,
        applyTo,
        target: tab,
        blanksOnly: saveBlanksOnly,
      });

      if (response.status) {
        if (showToast) {
          toast.success(response.message || "Template has been saved");
        }
        if (applyTo === "products") {
          setProductTemplateCache(tab, selectedChannel?.channel_id ?? 0, template, "template");
        } else if (applyTo === "categories") {
          setCategoryTemplateCache(tab, selectedChannel?.channel_id ?? 0, template, "template");
        } else if (applyTo === "brands") {
          setBrandTemplateCache(tab, template);
        }
      } else {
        if (showToast) {
          toast.error(response.message || "Failed to save template");
        }
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
    setIsUpdating(true);
    await handleSaveTemplate(onlyBlanks,false);
    await handleUpdate(onlyBlanks);
    setIsUpdating(false);
  };

  const insertVariable = useCallback((token: string) => {
    const el = textareaRef.current;
    let resolvedToken = token;
  
    if (token === "[[store name]]" && storeName) {
      resolvedToken = storeName;
    }
  
    const buildInsertText = (before: string) => {
      const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
      return `${needsLeadingSpace ? " " : ""}${resolvedToken} `;
    };
  
    if (!el) {
      setTemplate((current) => current + buildInsertText(current));
      return;
    }
  
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = template.slice(0, start);
    const after = template.slice(end);
    const insertText = buildInsertText(before);
  
    setTemplate(before + insertText + after);
  
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insertText.length;
      el.setSelectionRange(pos, pos);
    });
  }, [storeName, template]);

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
      setTemplate(getProductTemplateCache(tab, selectedChannel?.channel_id ?? 0, "template") ?? storeName ?? "");
    } else if (applyTo === "categories") {
      setTemplate(getCategoryTemplateCache(tab, selectedChannel?.channel_id ?? 0, "template") ?? storeName ?? "");
    } else if (applyTo === "brands") {
      setTemplate(getBrandTemplateCache(tab) ?? storeName ?? "");
    }
  }, [storeName, applyTo, tab, selectedChannel?.channel_id]);

  useEffect(() => {
    // no alt option for brands and categories
    if ((applyTo === "brands" || applyTo === "categories") && tab === "alt") {
      setTab("title");
    }

    // setCuise on for products, categories and brands
    if (applyTo === "products") {
      setCruiseOn(getProductTemplateCache(tab, selectedChannel?.channel_id ?? 0, "cruiseControl") as unknown as boolean | false);
    } else if (applyTo === "categories") {
      setCruiseOn(getCategoryTemplateCache(tab, selectedChannel?.channel_id ?? 0, "cruiseControl") as unknown as boolean | false);
    }
  }, [applyTo, tab, selectedChannel?.channel_id]);

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

          <button onClick={() => router.push("/upgrade")} className="custom-btn">
            Upgrade
          </button>
        </div>
      </header>

      <main className="">
        {/* Impact Overview */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS(dashboard).map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              condition={stat.condition}
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
                    className={`flex h-6 w-13 shrink-0 items-center justify-between rounded-md p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${cruiseOn ? "bg-[#5d5fef]" : "bg-[#c9c9c9]"
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
        <OptimizerHistoryTable maxRows={5} onHistoryPage={false} refreshKey={refreshKey} />
      </main>
    </div>
  );
}
