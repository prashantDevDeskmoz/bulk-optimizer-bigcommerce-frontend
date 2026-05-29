function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sessionToken");
}

export type StoreBrand = {
  id?: number;
  name?: string;
  page_title?: string;
  meta_description?: string;
};

export type StoreInfo = {
  store_name: string | null;
  store_domain: string | null;
  store_url: string | null;
  currency: string | null;
  brand: StoreBrand | null;
};

export async function fetchStoreInfo(): Promise<StoreInfo> {
  const token = getSessionToken();
  if (!token) throw new Error("Not authenticated");

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");

  const res = await fetch(`${base.replace(/\/$/, "")}/store`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || res.statusText || "Failed to load store info");
  }

  const json = (await res.json()) as { status?: boolean; data?: StoreInfo };
  return (
    json.data ?? {
      store_name: null,
      store_domain: null,
      store_url: null,
      currency: null,
      brand: null,
    }
  );
}
