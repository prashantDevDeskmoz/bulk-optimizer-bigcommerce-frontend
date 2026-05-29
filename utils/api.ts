/**
 * Store identifier for channel fetch (matches app session JWT `storeHash`).
 */
export function getStoreId(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("sessionToken");
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { storeHash?: string };
    return payload.storeHash ?? null;
  } catch {
    return null;
  }
}
