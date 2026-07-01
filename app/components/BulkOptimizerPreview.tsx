"use client";

import { useChannelContext } from "@/context/ChannelContext";
import { useChannelPreviewSamples } from "@/hooks/useChannelPreviewSamples";
import {
  mapBrandToSampleTokens,
  mapCategoryToSampleTokens,
  mapProductToSampleTokens,
} from "@/utils/channelPreviewCache";
import { useMemo } from "react";

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

function applyTemplate(template: string, values: Record<string, string | undefined>): string {
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

function previewSubtitle(tab: SeoTab): string {
  if (tab === "title") return "Preview optimized title appearance.";
  if (tab === "meta") return "Preview optimized meta description appearance.";
  return "Preview optimized alt text appearance.";
}

function currentValueForTab(tab: SeoTab, sampleValues: Record<string, string | undefined>) {
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
  brandSample: Record<string, any> | null;
};

export default function BulkOptimizerPreview({ template, tab, applyTo, storeName, brandSample }: BulkOptimizerPreviewProps) {
  const { selectedChannel } = useChannelContext();
  const channelPreview = useChannelPreviewSamples(selectedChannel?.channel_id || 0);

  const sampleUrl = useMemo(() => {
    const base = selectedChannel?.site_url ?? "";
    const path =
      applyTo === "products"
        ? (tab === "alt" ? channelPreview.productImage : channelPreview.product)?.custom_url?.url
        : applyTo === "categories"
          ? channelPreview.category?.url?.path
          : applyTo === "brands"
            ? (brandSample)?.custom_url?.url
            : null;
    if (!base || !path) return null;
    if (path.startsWith("http")) return path;
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }, 
   [ selectedChannel?.site_url, channelPreview.product, channelPreview.category, applyTo, brandSample]
  );

  const sampleValues = useMemo(() => {
    const brandName = brandSample && brandSample?.name ? brandSample.name : BASE_SAMPLE_VALUES["[[name]]"];
    return {
      ...BASE_SAMPLE_VALUES,
      "[[store name]]": storeName ?? BASE_SAMPLE_VALUES["[[store name]]"],
      ...(applyTo === "products"
        ? mapProductToSampleTokens(
          (tab === "alt" ? channelPreview.productImage : channelPreview.product) as Record<string, unknown> & { images: { description: string }[] } | null,
        )
        : applyTo === "categories"
          ? mapCategoryToSampleTokens(channelPreview.category)
          : applyTo === "brands"
            ? mapBrandToSampleTokens(brandSample)
            : {}),
      "[[name]]": brandName,
    };
  }, [ storeName, channelPreview.product, channelPreview.productImage, channelPreview.category, applyTo, brandSample, tab]);

  const newPreview = useMemo(
    () => applyTemplate(template, sampleValues),
    [template, sampleValues],
  );

  const fieldLabel = tabFieldLabel(tab);
  const currentDisplay = currentValueForTab(tab, sampleValues);
  const loading = channelPreview.loading;

  return (
    <section className="card w-[486px] p-0!">
      <div className="p-4 border-b border-[#DDDDDD]">
        <h2 className="text-base font-bold text-[#303030]">Live SEO Preview</h2>
        <p className="mt-0.5 text-xs text-[#616161]">{previewSubtitle(tab)}</p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-lg border border-[#f5c2c7] bg-[#fff5f5] p-4">
          <h3 className="mb-2 text-xs font-semibold text-[#d72c0d]">
            Current {fieldLabel}
          </h3>
          <p className="h-[42px] overflow-y-auto overflow-x-hidden break-words text-sm leading-snug text-[#1a0dab]">
            {loading ? "Loading..." : currentDisplay}
          </p>
          <p className="mt-1 text-xs text-[#188038]">
            {loading ? (
              "Loading..."
            ) : (
              sampleUrl && (
                <a
                  href={sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 max-w-full items-center gap-1 break-all hover:underline"
                >
                  <IconExternalLink className="mt-0.5 shrink-0" />
                  {sampleUrl}
                </a>
              )
            )}
          </p>
        </div>

        <div className="rounded-lg border border-[#b7ebc6] bg-[#f3fff6] p-4">
          <h3 className="mb-2 text-xs font-semibold text-[#188038]">
            New {fieldLabel}
          </h3>
          <p className="h-[42px] overflow-y-auto overflow-x-hidden break-words text-sm leading-snug text-[#1a0dab]">
            {loading ? "Loading..." : newPreview || "—"}
          </p>
          <p className="mt-1 text-xs text-[#188038]">
            {loading ? (
              "Loading..."
            ) : (
              sampleUrl && (
                <a
                  href={sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 max-w-full items-center gap-1 break-all hover:underline"
                >
                  <IconExternalLink className="mt-0.5 shrink-0" />
                  {sampleUrl}
                </a>
              )
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
