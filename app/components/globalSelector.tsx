"use client";

import { useChannelContext } from "@/context/ChannelContext";
import type { Channel } from "@/types/channel";
import { Select, SelectItem } from "@heroui/select";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export default function ChannelSelector() {
  const { channels, loading, selectedChannel, setSelectedChannel } = useChannelContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {setMounted(true)}, []);

  const handleChannelChange = (value: string) => {
    const channel = channels.find(channel => String(channel.id ?? "") === value);
    if (channel) setSelectedChannel(channel);
  };  
useEffect(() => {
  console.log("channels:::::::::::::::::::::::::::::::::::::", channels);
  console.log("selectedChannel:::::::::::::::::::::::::::::::::::::", selectedChannel);
}, []);

  if (!mounted) {
    return (
      <div className="text-sm text-gray-500 px-3 py-2">Loading channels…</div>
    );
  }

  const effectiveSelectedKeys =
    mounted && selectedChannel?.id != null && selectedChannel.id !== ""
      ? new Set([String(selectedChannel.id)])
      : new Set<string>();

  return (
    <div className="relative min-w-[140px] max-w-160 w-full">
      <div className="absolute top-[-8px] left-[4px] px-1.5 z-10 bg-white ">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">Channel</span>
          <a
            href={selectedChannel?.site_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
      <Select
        selectedKeys={effectiveSelectedKeys}
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0] as string;
          if (selectedKey) {
            handleChannelChange(selectedKey);
          }
        }}
        placeholder="Select Channel"
        isLoading={loading}
        size="sm"
        className="w-full"
        classNames={{
          trigger: "bg-white border border-gray-300 rounded-sm",
          value: "truncate",
        }}
        aria-label="Select Channel"
      >
        {channels.map((channel: Channel, index: number) => (
          <SelectItem
            key={String(channel.id ?? channel.channel_id ?? `ch-${index}`)}
          >
            {channel.channel_name || `Channel ${channel.channel_id}`}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
