import { cookies } from "next/headers";
import { SESSION_TOKEN_COOKIE } from "../sessionCookie";



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


// make a common function to fetch from the server
export async function fetchFromServer(url: string): Promise<any | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_TOKEN_COOKIE)?.value;
  console.log("token:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::", token);
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

  console.log("resddddddddddddddddddddddddddddddddd", res);
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

export async function getPlanApi(): Promise<any | null> {
  return fetchFromServer("/store/get-plan");
}