"use client";

import { useChannelContext } from "@/context/ChannelContext";
import { useChannelPreviewSamples } from "@/hooks/useChannelPreviewSamples";
import {
  mapBrandToSampleTokens,
  mapCategoryToSampleTokens,
  mapProductToSampleTokens,
} from "@/utils/channelPreviewCache";
import { useEffect, useMemo } from "react";

export type SeoTab = "title" | "meta" | "alt";

const BASE_SAMPLE_VALUES: Record<string, string> = {
  "[[product name]]": "product2",
  "[[sku]]": "WB-1002",
  "[[price]]": "24.99",
  "[[currency]]": "USD",
  "[[type]]": "Physical",
  "[[category name]]": "Widgets",
  "[[brand]]": "Acme",
  "[[mpn]]": "MPN-889",
  "[[condition]]": "New",
  "[[store name]]": "FavSEO Sandbox Store",
  "[[name]]": "Acme",
};

const CURRENT_PAGE_TITLE = (tab: string) => 
  `This is a very long existing ${tab} that demonstrates how the current product, category or brand ${tab} might look in the store before optimization — including extra marketing copy and keywords that push the length higher.`;

type ProductWithImages = Record<string, unknown> & {
  images?: { description?: string }[];
  custom_url?: { url?: string };
};

function applyTemplate(template: string, values: Record<string, string>): string {
  let out = template;
  for (const [key, val] of Object.entries(values)) {
    out = out.split(key).join(val);
  }
  return out;
}

function tabFieldLabel(tab: SeoTab): string {
  if (tab === "title") return "Page Title";
  if (tab === "meta") return "Meta Description";
  return "Alt Text";
}

function currentValueForTab (tab: SeoTab,sampleValues: Record<string, string>) {
  const defaultDisplay = CURRENT_PAGE_TITLE(tabFieldLabel(tab));
  switch (tab) {
    case "title":
      return sampleValues["[[page title]]"] || defaultDisplay;
    case "meta":
      return sampleValues["[[meta description]]"] || defaultDisplay;
    case "alt":
      return sampleValues["[[alt text]]"] || defaultDisplay;
  }
}

function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

type BulkOptimizerPreviewProps = {
  template: string;
  tab: SeoTab;
  applyTo: string;
  storeName: string | null;
  brandSample: Record<string, unknown> | null;
};

export default function BulkOptimizerPreview({
  template,
  tab,
  applyTo,
  storeName,
  brandSample,
}: BulkOptimizerPreviewProps) {
  const { selectedChannel } = useChannelContext();
  const channelPreview = useChannelPreviewSamples(selectedChannel?.id);

  useEffect(() => {
    console.log("channelPreview:::::::::::::::::::::::::::::::::::::", channelPreview);
  }, [channelPreview]);

  const sampleUrl = useMemo(() => {
    const base = selectedChannel?.site_url ?? "";
    const path =
      applyTo === "products"
        ? channelPreview.product?.custom_url?.url
        : applyTo === "categories"
          ? channelPreview.category?.url?.path
          : applyTo === "brands" ? (brandSample as any)?.custom_url?.url : null;
    if (!base) return null;
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }, [
    selectedChannel?.site_url,
    channelPreview.product,
    channelPreview.category,
    applyTo,
    brandSample,
  ]);

  const sampleValues = useMemo(() => {
    const brandName =
      brandSample && typeof brandSample.name === "string"
        ? brandSample.name
        : BASE_SAMPLE_VALUES["[[name]]"];
    return {
      ...BASE_SAMPLE_VALUES,
      "[[store name]]": storeName ?? BASE_SAMPLE_VALUES["[[store name]]"],
      ...(applyTo === "products" ?
         mapProductToSampleTokens(channelPreview.product as Parameters<typeof mapProductToSampleTokens>[0])
        : applyTo === "categories" ?
         mapCategoryToSampleTokens(channelPreview.category)
        : applyTo === "brands" ?
         mapBrandToSampleTokens(brandSample) : {}),
      "[[name]]": brandName,
    };
  }, [storeName, channelPreview.product, channelPreview.category, applyTo, brandSample]);

  const newPreview = useMemo(
    () => applyTemplate(template, sampleValues),
    [template, sampleValues],
  );

  useEffect(() => {
    console.log("sampleValues:::::::::::::::::::::::::::::::::::::", sampleValues);
  }, [sampleValues]);

  const fieldLabel = tabFieldLabel(tab);
  const currentDisplay = currentValueForTab(tab,sampleValues);
  const loading = channelPreview.loading;                       

  return (
    <section className="sticky top-30 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-zinc-100">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Live SEO Preview</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Preview how your optimized content may appear on search engines.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-red-700">
            Current {fieldLabel}
          </h3>
        </div>

        <p className="text-lg text-blue-700">
          {loading ? "Loading..." : currentDisplay}
        </p>

        <p className="mt-1 text-xs text-green-700">
          {loading ? (
            "Loading..."
          ) : (
            sampleUrl && <a
              href={sampleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 max-w-full items-center gap-1 break-all text-green-700 underline decoration-green-600/50 underline-offset-2 hover:text-green-800 hover:decoration-green-700"
            >
              <IconExternalLink className="mt-0.5 shrink-0" />
              {sampleUrl}
            </a>
          )}
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Generic title with weak keyword targeting and low click-through
          potential.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-700">
            New {fieldLabel}
          </h3>
        </div>

        <p className="text-lg text-blue-700">
          {loading ? "Loading..." : newPreview}
        </p>

        <p className="mt-1 text-xs text-green-700">
          {loading ? (
            "Loading..."
          ) : (
            sampleUrl && <a
              href={sampleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 max-w-full items-center gap-1 break-all text-green-700 underline decoration-green-600/50 underline-offset-2 hover:text-green-800 hover:decoration-green-700"
            >
              <IconExternalLink className="mt-0.5 shrink-0" />
              {sampleUrl}
            </a>
          )}
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Improved keyword structure with clearer product intent and stronger
          search visibility.
        </p>
      </div>
    </section>
  );
}
