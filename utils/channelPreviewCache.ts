const CACHE_TTL_MS = 120_000; // 2 minutes

export type ChannelPreviewSamples = {
  product: Record<string, unknown> | null;
  category: Record<string, unknown> | null;
  productImage: Record<string, unknown> | null;
};

type CacheEntry = {
  fetchedAt: number;
  data: ChannelPreviewSamples;
};

const cache = new Map<number, CacheEntry>();

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sessionToken");
}

async function fetchChannelPreviewSamplesFromApi(
  bcChannelId: number,
): Promise<ChannelPreviewSamples> {
  const token = getSessionToken();
  if (!token) throw new Error("Not authenticated");

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");

  const url = new URL(`${base.replace(/\/$/, "")}/preview/channel-samples`);
  url.searchParams.set("bcChannelId", String(bcChannelId));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || res.statusText || "Failed to load preview samples");
  }

  const json = (await res.json()) as {
    status?: boolean;
    data?: ChannelPreviewSamples;
  };
  return json.data ?? { product: null, category: null, productImage: null };
}

/**
 * Returns cached preview samples for (storeHash, bcChannelId) when fresh (< 2 minutes),
 * otherwise fetches and updates the cache.
 */
export async function getCachedChannelPreviewSamples(
  bcChannelId: number,
): Promise<{ data: ChannelPreviewSamples; fromCache: boolean }> {
  const key = bcChannelId;
  const now = Date.now();
  const hit = cache.get(key);

  console.log("hit", cache);

  if (hit && now - hit.fetchedAt < CACHE_TTL_MS) {
    return { data: hit.data, fromCache: true };
  }

  const data = await fetchChannelPreviewSamplesFromApi(bcChannelId);
  cache.set(key, { fetchedAt: now, data });
  return { data, fromCache: false };
}

export function mapProductToSampleTokens(
  product: Record<string, unknown> & { images: { description: string }[] } | null,
) {
  if (!product) return {};

  const price =
    product.price != null
      ? String(product.price as string | number)
      : product.calculated_price != null
        ? String(product.calculated_price as string | number)
        : "";
  return {
    "[[product name]]": String(product.name ?? ""),
    "[[sku]]": String(product.sku ?? ""),
    "[[price]]": price,
    "[[currency]]": String(
      (product.currency as string) ??
        (product.currency_code as string) ??
        "",
    ),
    "[[type]]": String(product.type ?? ""),
    "[[brand]]": String(product.brand_name ?? ""),
    "[[mpn]]": String(product.mpn ?? ""),
    "[[condition]]": String(product.condition ?? ""),
    "[[page title]]": String(product.page_title ?? ""),
    "[[meta description]]": String(product.meta_description ?? ""),
    "[[alt text]]": product.images?.find(image => image.description && image.description != "")?.description ?? "",
  };
}

export function mapCategoryToSampleTokens(
  category: Record<string, unknown> | null,
) {
  if (!category) return {};
  return {
    "[[category name]]": String(category.name ?? ""),
    "[[page title]]": String(category.page_title ?? ""),
    "[[meta description]]": String(category.meta_description ?? ""),
  };
}

export function mapBrandToSampleTokens(
  brand: Record<string, unknown> | null,
) {
  if (!brand) return {};
  return {
    "[[name]]": String(brand.name ?? ""),
    "[[page title]]": String(brand.page_title ?? ""),
    "[[meta description]]": String(brand.meta_description ?? ""),
  };
}