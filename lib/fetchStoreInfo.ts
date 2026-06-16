import type { StoreInfo } from "@/utils/apis/storeApi";
import { SESSION_TOKEN_COOKIE } from "@/utils/sessionCookie";
import { cookies } from "next/headers";

// make a common function to fetch from the server
export async function fetchFromServer(url: string): Promise<any | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_TOKEN_COOKIE)?.value;
  if (!token) return null;

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;

  const res = await fetch(`${base.replace(/\/$/, "")}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = await res.json();

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

export async function fetchStoreInfoServer(): Promise<StoreInfo | null> {
  return fetchFromServer("/store");
}

export async function getAllTemplates(): Promise<any | null> {
  return fetchFromServer("/bulk/get-all-templates");
}

export async function getDashboardInfo(): Promise<any | null> {
  return fetchFromServer("/bulk/get-dashboard-info");
}