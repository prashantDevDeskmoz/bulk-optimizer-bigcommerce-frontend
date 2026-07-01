import type { Channel } from "@/types/channel";

type DbChannelRow = {
  bcChannelId: number;
  name: string;
  site_url: string | null;
  status: string;
  platform: string;
};

export function mapDbChannelToChannel(row: DbChannelRow): Channel {
  return {
    channel_id: row.bcChannelId,
    channel_name: row.name ?? "",
    site_url: row.site_url ?? "",
    status: row.status ?? "",
    platform: row.platform ?? "",
  };
}

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sessionToken");
}

export async function fetchChannelsFromApi(): Promise<Channel[]> {
  const token = getSessionToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/channels`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || res.statusText || "Failed to load channels");
  }

  const json = (await res.json()) as { status?: boolean; data?: DbChannelRow[] };
  const rows = Array.isArray(json.data) ? json.data : [];
  return rows.map(mapDbChannelToChannel);
}
