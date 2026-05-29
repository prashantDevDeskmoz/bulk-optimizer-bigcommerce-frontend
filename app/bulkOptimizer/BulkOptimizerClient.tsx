"use client";

import { useChannelContext } from "@/context/ChannelContext";
import { saveTemplate, updateCruiseControl } from "@/utils/apis/globalApi";
import type { StoreInfo } from "@/utils/apis/storeApi";
import { getAllProductAndSaveTemplate, getBrandTemplateCache, getCategoryTemplateCache, getProductTemplateCache, setBrandTemplateCache, setCategoryTemplateCache, setProductTemplateCache } from "@/utils/cacheTemplate";
import { HistoryIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import BulkOptimizerPreview, {
  type SeoTab,
} from "../components/BulkOptimizerPreview";
import ChannelSelector from "../components/globalSelector";
import SeoTemplateTextarea from "../components/SeoTemplateTextarea";

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
  { label: "Store Name", token: "[[store name]]"},
];

let CATEGORY_VARIABLES: { label: string; token: string }[] = [
  { label: "Category Name", token: "[[category name]]" },
  { label: "Store Name", token: "[[store name]]"},
];

let BRAND_VARIABLES: { label: string; token: string }[] = [
  { label: "Name", token: "[[name]]" },
  { label: "Store Name", token: "[[store name]]"},
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

  console.log("asdddddddddddddddddddddddddddddddddddddddddddddd")

  const handleUpdate = useCallback(async () => {
    if (isUpdating) return;
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
          applyTo, // products | categories | ...
          target: tab, // title | meta | alt
          template,
          cruiseControl: cruiseOn,
          bcChannelId: selectedChannel?.id,
          blanksOnly
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message || err?.error || "Update failed");
      }else{
        toast.success('Bulk update is in progress')
      }
    } catch (e:any) {
      console.error(e);
      toast.error(e.message || "Update failed")
    } finally {
      setIsUpdating(false);
    }
  }, [applyTo, cruiseOn, isUpdating, tab, template, selectedChannel?.id, blanksOnly]);

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
      if(response.status) {
        if(applyTo === "products") {
          setProductTemplateCache(tab, selectedChannel?.id ?? "", !cruiseOn ? "true" : "false", "cruiseControl");
        } else if(applyTo === "categories") {
          setCategoryTemplateCache(tab, selectedChannel?.id ?? "", !cruiseOn ? "true" : "false", "cruiseControl");
        }
        setCruiseLoading(false);
        toast.success(response.message);
      }
    } catch (e : any) {
      console.error(e);
      toast.error(e.message || "Failed to update cruise control");
    }
  }

  const handleSaveTemplate = async () => {
    if (isSavingTemplate) return;
    setIsSavingTemplate(true);
    try {
      const response = await saveTemplate({
        template,
        bcChannelId: selectedChannel?.id,
        applyTo,
        target: tab,
        blanksOnly
      });
      
      if(response.status) {
        toast.success(response.message || "Template has been saved")
        if(applyTo === "products") {
          setProductTemplateCache(tab, selectedChannel?.id ?? "", template, "template");
        } else if(applyTo === "categories") {
          setCategoryTemplateCache(tab, selectedChannel?.id ?? "", template, "template");
        } else if(applyTo === "brands") {
          setBrandTemplateCache(tab, template);
        }
      } else {
        toast.error(response.message || "Failed to save template");
      }
      
    } catch (e : any) {
      console.error(e);
      toast.error(e.message || "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  }

  const insertVariable = useCallback((token: string) => {
    const el = textareaRef.current;
    if(token === "[[store name]]" && storeName){
      token = storeName ;
    }
    if (!el) {
      setTemplate((current) => current + token);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    setTemplate((current) => current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }, [storeName]);

  const tabLabels: { id: SeoTab; label: string }[] = [
    { id: "title", label: "Title Tag" },
    { id: "meta", label: "Meta Description" },
    { id: "alt", label: "Alt Text" },
  ];

  useEffect(() => {
    if(applyTo === "products") {
      setTemplate(getProductTemplateCache(tab, selectedChannel?.id ?? "", "template") ?? storeName ?? "");
    } else if(applyTo === "categories") {
      setTemplate(getCategoryTemplateCache(tab, selectedChannel?.id ?? "", "template") ?? storeName ?? "");
    } else if(applyTo === "brands") {
      setTemplate(getBrandTemplateCache(tab) ?? storeName ?? "");
    }
  }, [storeName,applyTo,tab,selectedChannel?.id]);

  useEffect(() => {
    if((applyTo === "brands" || applyTo === "categories") && tab === "alt"){
      setTab("title");
    }

    if(applyTo === "products") {
      setCruiseOn(getProductTemplateCache(tab, selectedChannel?.id ?? "", "cruiseControl") as unknown as boolean | false);
    } else if(applyTo === "categories") {
      setCruiseOn(getCategoryTemplateCache(tab, selectedChannel?.id ?? "", "cruiseControl") as unknown as boolean | false);
    }
  }, [applyTo,tab,selectedChannel?.id]);

  // return (
  //   <div className="min-h-screen px-4 bg-[#f1f1f1] text-zinc-900">
  //     <div className="mx-auto max-w-6xl">
  //       <header className="py-3 lg:py-6">
  //         <div className="flex items-center flex-col gap-4 lg:flex-row lg:justify-between lg:gap-8">
  //           <div className="min-w-0 max-w-3xl space-y-3">
  //             <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
  //               <p className="text-xs font-semibold tracking-widest text-zinc-400">
  //                 BULK OPTIMIZER
  //               </p>
  //               <span className="badge rounded-full inline-flex items-center gap-1.5 border border-zinc-200 bg-white ext-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">
  //                 <IconInfo className="text-zinc-500" />
  //                 How it works
  //               </span>
  //             </div>
  //             <div className="flex flex-wrap items-center gap-3">
  //               <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
  //                 Template-based SEO Updates
  //               </h1>
  //               <span className="badge badge-success rounded-full">
  //                 Quota Used: 1724/∞
  //               </span>
  //             </div>
  //             <p className="text-sm leading-relaxed text-zinc-600">
  //               Create one smart template and apply it safely to hundreds of
  //               products at once.
  //             </p>
  //           </div>
  //           <div className="flex shrink-0 items-center gap-3 lg:pt-0.5">
  //             <ChannelSelector />
  //             <button
  //               type="button"
  //               className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm transition hover:bg-zinc-50"
  //               aria-label="Menu"
  //             >
  //               <IconMenu />
  //             </button>
  //           </div>
  //         </div>
  //       </header>
  //       <div className=" bulk-optimizer-container rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
  //         {/* Choose what to optimize */}
  //         <section className="mb-8">
  //           <h2 className="mb-3 text-sm font-semibold text-zinc-900">
  //             Choose What To Optimize
  //           </h2>
  //           <div className="mb-4 flex flex-wrap items-center gap-3">
  //             <label className="flex items-center gap-2 text-sm text-zinc-600">
  //               Apply to
  //               <select
  //                 value={applyTo}
  //                 onChange={(e) => setApplyTo(e.target.value)}
  //                 className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800"
  //               >
  //                 <option value="products">Products</option>
  //                 <option value="categories">Categories</option>
  //                 <option value="brands">Brands</option>
  //               </select>
  //             </label>
  //           </div>
  //           <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
  //             {tabLabels.filter(({ id }) => applyTo === "products" ? true : id !== "alt").map(({ id, label }) => (
  //               <button
  //                 key={id}
  //                 type="button"
  //                 onClick={() => setTab(id)}
  //                 className={`rounded-md px-4 py-2 text-sm font-medium transition ${
  //                   tab === id
  //                     ? "bg-white text-zinc-900 shadow-sm"
  //                     : "text-zinc-600 hover:text-zinc-900"
  //                 }`}
  //               >
  //                 {label}
  //               </button>
  //             ))}
  //           </div>
  //         </section>

  //         {/* Two columns */}
  //         <div className="grid gap-8 lg:grid-cols-2">
  //           <section>
  //             <h2 className="mb-1 text-sm font-semibold text-zinc-900">
  //               Build Your Template
  //             </h2>
  //             <p className="mb-3 text-sm text-zinc-600">
  //               Use variables to keep titles consistent across all items.
  //             </p>
  //             <textarea
  //               ref={textareaRef}
  //               value={template}
  //               onChange={(e) => setTemplate(e.target.value)}
  //               rows={6}
  //               className="mb-4 w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-800 shadow-inner outline-none ring-zinc-300 focus:ring-2"
  //               spellCheck={false}
  //             />
  //             <div className="flex flex-wrap gap-2">
  //               {(applyTo === "products" ? PRODUCT_VARIABLES : applyTo === "categories" ? CATEGORY_VARIABLES : BRAND_VARIABLES).map(({ label, token }) => (
  //                 <button
  //                   key={token}
  //                   type="button"
  //                   onClick={() => insertVariable(token)}
  //                   className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-white"
  //                 >
  //                   + {label}
  //                 </button>
  //               ))}
  //             </div>
  //           </section>
  //           <section>
  //             <h2 className="mb-1 text-sm font-semibold text-zinc-900">
  //               Live Preview
  //             </h2>
  //             <p className="mb-3 text-sm text-zinc-600">
  //               Our app will apply this template to each product. Here is a
  //               sample product&apos;s{" "}
  //               {tab === "title"
  //                 ? "Title Tag"
  //                 : tab === "meta"
  //                   ? "Meta Description"
  //                   : "Alt Text"}
  //               .
  //             </p>
  //             <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
  //               <div className="mb-4 flex items-start gap-2 text-sm">
  //                 <span className="shrink-0 font-medium text-zinc-600">
  //                   Product URL:
  //                 </span>
  //                 <a
  //                   href={SAMPLE_PRODUCT_URL}
  //                   target="_blank"
  //                   rel="noopener noreferrer"
  //                   className="inline-flex min-w-0 items-center gap-1 break-all text-blue-600 hover:underline"
  //                 >
  //                   <IconExternalLink className="mt-0.5 shrink-0" />
  //                   {SAMPLE_PRODUCT_URL}
  //                 </a>
  //               </div>
  //               <div className="grid gap-4 sm:grid-cols-2">
  //                 <div>
  //                   <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
  //                     Current {tabLabels.find((t) => t.id === tab)?.label}
  //                   </p>
  //                   <div className="relative">
  //                     <textarea
  //                       readOnly
  //                       value={CURRENT_PAGE_TITLE}
  //                       rows={5}
  //                       className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
  //                     />
  //                     <span className="absolute bottom-2 right-2 text-xs text-zinc-400">
  //                       {CURRENT_PAGE_TITLE.length}
  //                     </span>
  //                   </div>
  //                 </div>
  //                 <div>
  //                   <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
  //                     New {tabLabels.find((t) => t.id === tab)?.label}
  //                   </p>
  //                   <div className="relative">
  //                     <textarea
  //                       readOnly
  //                       value={newPreview}
  //                       rows={5}
  //                       className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
  //                     />
  //                     <span className="absolute bottom-2 right-2 text-xs text-zinc-400">
  //                       {newPreview.length}
  //                     </span>
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>
  //           </section>
  //         </div>

  //         {/* Footer actions */}
  //         <footer className="mt-10 flex flex-col gap-6 border-t border-zinc-100 pt-8 sm:flex-row sm:items-end sm:justify-between">
  //           <div>
  //             <p className="mb-2 max-w-sm text-xs text-zinc-500">
  //               Choose whether to update all items or only those with issues.
  //             </p>
  //             <button
  //               type="button"
  //               onClick={handleUpdate}
  //               disabled={isUpdating}
  //               className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900"
  //             >
  //               {isUpdating ? "Updating..." : "Update"}
  //               <IconChevronDown />
  //             </button>
  //           </div>
  //           <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:max-w-xs">
  //             <h3 className="text-sm font-semibold text-zinc-900">
  //               Cruise Control
  //             </h3>
  //             <p className="mt-1 text-xs text-zinc-600">
  //               Auto-apply this template to new products.
  //             </p>
  //             <button
  //               type="button"
  //               role="switch"
  //               aria-label="Cruise control"
  //               aria-checked={cruiseOn}
  //               onClick={() => setCruiseOn((v) => !v)}
  //               className={`mt-3 flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition ${
  //                 cruiseOn ? "bg-emerald-600" : "bg-zinc-300"
  //               }`}
  //             >
  //               <span
  //                 className={`h-6 w-6 rounded-full bg-white shadow transition ${
  //                   cruiseOn ? "translate-x-5" : "translate-x-0.5"
  //                 }`}
  //               />
  //             </button>
  //           </div>
  //         </footer>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Bulk Optimizer
              </span>
  
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                1724 Optimizations Used
              </span>
            </div>
  
            <h1 className="text-2xl font-bold tracking-tight">
              Template-based SEO Updates
            </h1>
  
            <p className="mt-1 text-sm text-zinc-500">
              Optimize hundreds of products safely with reusable SEO templates.
            </p>
          </div>
  
          <div className="flex items-center gap-3">
            <ChannelSelector />
            <Link href="/optimizerHistory" className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
              <HistoryIcon className="w-4 h-4" />
              History
            </Link>
            <Link href="/cruiseControlHistory" className="text-sm text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
              <HistoryIcon className="w-4 h-4" />
              Cruise History
            </Link>
  
            <button className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 shadow-sm transition hover:bg-zinc-50">
              <IconInfo />
            </button>
  
            <button className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 shadow-sm transition hover:bg-zinc-50">
              <IconMenu />
            </button>
          </div>
        </div>
      </header>
  
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Impact Overview */}
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <p className="text-sm text-zinc-500">Products Selected</p>
            <h3 className="mt-2 text-3xl font-bold">1,248</h3>
            <p className="mt-1 text-xs text-emerald-600">
              +12% from previous run
            </p>
          </div>
  
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <p className="text-sm text-zinc-500">Missing SEO Fields</p>
            <h3 className="mt-2 text-3xl font-bold">326</h3>
            <p className="mt-1 text-xs text-amber-600">
              Needs immediate optimization
            </p>
          </div>
  
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <p className="text-sm text-zinc-500">Estimated SEO Fixes</p>
            <h3 className="mt-2 text-3xl font-bold">892</h3>
            <p className="mt-1 text-xs text-indigo-600">
              Based on current template
            </p>
          </div>
        </section>
  
        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT SIDE */}
          <div className="space-y-8">
            {/* Step 1 */}
            <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-zinc-100">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 font-semibold text-indigo-700">
                  1
                </div>
  
                <div>
                  <h2 className="text-lg font-semibold">
                    Choose What To Optimize
                  </h2>
  
                  <p className="mt-1 text-sm text-zinc-500">
                    Select which content type should receive template updates.
                  </p>
                </div>
              </div>
  
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm font-medium text-zinc-700">
                  Apply to
                </label>
  
                <select
                  value={applyTo}
                  onChange={(e) => setApplyTo(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="products">Products</option>
                  <option value="categories">Categories</option>
                  <option value="brands">Brands</option>
                </select>
              </div>
  
              <div className="mt-5 flex flex-wrap gap-3">
                {tabLabels
                  .filter(({ id }) =>
                    applyTo === "products" ? true : id !== "alt"
                  )
                  .map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                        tab === id
                          ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/10"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
              </div>
            </section>
  
            {/* Step 2 */}
            <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-zinc-100">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 font-semibold text-indigo-700">
                  2
                </div>
  
                <div>
                  <h2 className="text-lg font-semibold">
                    Build Your SEO Template
                  </h2>
  
                  <p className="mt-1 text-sm text-zinc-500">
                    Create reusable SEO rules with dynamic variables.
                  </p>
                </div>
              </div>
  
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <SeoTemplateTextarea
                  textareaRef={textareaRef}
                  value={template}
                  onChange={setTemplate}
                  rows={6}
                  placeholder="Example: [[product name]] | [[store name]]"
                />
              </div>
  
              {/* Variables */}
              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Available Variables
                </p>
  
                <div className="flex flex-wrap gap-2">
                  {(applyTo === "products"
                    ? PRODUCT_VARIABLES
                    : applyTo === "categories"
                      ? CATEGORY_VARIABLES
                      : BRAND_VARIABLES
                  ).map(({ label, token }) => (
                    <button
                      key={token}
                      onClick={() => insertVariable(token)}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
  
              {/* Validation */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  ✓ SEO length optimized
                </div>
  
                <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  ✓ Variables detected
                </div>
  
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  ⚠ Missing CTA keyword
                </div>
              </div>
            </section>
  
            {/* Step 3 */}
            <section className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-zinc-100">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 font-semibold text-indigo-700">
                  3
                </div>
  
                <div>
                  <h2 className="text-lg font-semibold">
                    Safety & Automation
                  </h2>
  
                  <p className="mt-1 text-sm text-zinc-500">
                    Prevent accidental overwrites and automate future updates.
                  </p>
                </div>
              </div>
  
              <div className="space-y-4">
                <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-300">
                  <input onClick={(e:any) => setBlanksOnly(e.target.checked)} type="checkbox" className="mt-1" />
  
                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      Only update empty SEO fields
                    </p>
  
                    <p className="mt-1 text-xs text-zinc-500">
                      Keeps manually optimized products untouched.
                    </p>
                  </div>
                </label>
  
                {(applyTo !== "brands" && tab !== "alt") && <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">
                      Cruise Control
                    </p>
  
                    <p className="mt-1 text-xs text-zinc-500">
                      Automatically apply this template to future products.
                    </p>
                  </div>
  
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cruiseOn}
                    onClick={handleCruiseControl}
                    className={`flex h-7 w-12 items-center rounded-full p-0.5 transition ${
                      cruiseOn ? "bg-emerald-600" : "bg-zinc-300"
                    }`}
                    disabled={cruiseLoading}
                  >
                    <span
                      className={`h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center transition ${
                        cruiseOn ? "translate-x-5" : "translate-x-0"
                      }`}
                    >
                      {cruiseLoading && <div className="mx-auto w-[80%] h-[80%] animate-spin rounded-full border-4 border-dotted border-blue-500" />}
                    </span>
                  </button>
                </div>}
              </div>
            </section>
          </div>
  
          {/* RIGHT SIDE */}
          <div className="space-y-8">
            <BulkOptimizerPreview
              template={template}
              tab={tab}
              applyTo={applyTo}
              storeName={storeName}
              brandSample={brandSample}
            />
          </div>
        </div>
      </main>
  
      {/* Sticky Footer */}
      <footer className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Ready to optimize 1,248 products
            </p>
  
            <p className="text-xs text-zinc-500">
              Changes will be applied safely using your selected rules.
            </p>
          </div>
  
          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate}
              className={`rounded-xl border px-5 py-3 text-sm font-medium transition ${
                isSavingTemplate
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-300 text-zinc-500"
                  : "border-zinc-200 bg-yellow-500 text-zinc-700 hover:bg-yellow-400"
              }`}
            >
              {isSavingTemplate ? "Saving..." : "Save Template"}
            </button>
  
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`rounded-xl px-6 py-3 text-sm font-semibold shadow-lg shadow-zinc-900/10 transition ${
                isUpdating
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-300 text-zinc-500"
                  : "border-zinc-200 bg-zinc-900 text-white hover:bg-black"
              }`}
            >
              {isUpdating ? "Updating..." : "Apply SEO Updates"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
