"use client";

import type { Channel } from "@/types/channel";
import { fetchChannelsFromApi } from "@/utils/apis/channelsApi";
import { SESSION_READY_EVENT } from "@/utils/sessionEvents";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const SELECTED_CHANNEL_STORAGE_KEY = "bulk_optimizer_selected_channel";

type ChannelContextValue = {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  selectedChannel: Channel | null;
  setSelectedChannel: (channel: Channel | null) => void;
};

const ChannelContext = createContext<ChannelContextValue | null>(null);

function hasSessionToken(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem("sessionToken"))
  );
}

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(
    null,
  );

  const loadChannels = useCallback(async () => {
    if (!hasSessionToken()) return;

    try {
      setLoading(true);
      setError(null);
      const fetched = await fetchChannelsFromApi();
      console.log("fetched:::::::::::::::::::::::::::::::::::::", fetched);
      setChannels(fetched);
      if (fetched.length > 0) {
        setSelectedChannel((prev) => prev ?? fetched[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();

    const onSessionReady = () => {
      loadChannels();
    };

    window.addEventListener(SESSION_READY_EVENT, onSessionReady);
    return () => {
      window.removeEventListener(SESSION_READY_EVENT, onSessionReady);
    };
  }, [loadChannels]);

  const value = {
    channels,
    loading,
    error,
    selectedChannel,
    setSelectedChannel,
  };

  return (
    <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
  );
}

export function useChannelContext(): ChannelContextValue {
  const ctx = useContext(ChannelContext);
  if (!ctx) {
    throw new Error("useChannelContext must be used within ChannelProvider");
  }
  return ctx;
}
