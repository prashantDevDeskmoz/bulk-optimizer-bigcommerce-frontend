"use client";

import { useChannelContext } from "@/context/ChannelContext";
import type { Channel } from "@/types/channel";
import Image from "next/image";
import { useEffect, useState } from "react";

function getChannelKey(channel: Channel, index: number) {
  return String(channel.id ?? channel.channel_id ?? `ch-${index}`);
}

function getChannelDisplayText(channel: Channel) {
  const url = channel.site_url ?? "";
  const withoutProtocol = url.replace(/^https?:\/\//, "");
  return (
    withoutProtocol ||
    channel.channel_name ||
    `Channel ${channel.channel_id ?? ""}`
  );
}

export default function ChannelSelector() {
  const { channels, loading, selectedChannel, setSelectedChannel } =
    useChannelContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChannelChange = (value: string) => {
    const channel = channels.find(
      (ch, index) => getChannelKey(ch, index) === value,
    );
    if (channel) setSelectedChannel(channel);
  };

  if (!mounted) {
    return (
      <div className="custom-dropi link-iconDropi flex-1 lg:flex-none lg:w-[240px]">
        <span className="dropiLabel">Channel</span>
        <select
          className="form-select w-full"
          disabled
          aria-label="Select Channel"
          defaultValue=""
        >
          <option value="">Loading channels…</option>
        </select>
      </div>
    );
  }

  const selectedKey =
    selectedChannel != null ? getChannelKey(selectedChannel, 0) : "";
  const displayText = selectedChannel
    ? getChannelDisplayText(selectedChannel)
    : "";
  const linkHref = selectedChannel?.site_url || "#";

  return (
    <div className="custom-dropi link-iconDropi flex-1 lg:flex-none lg:w-[240px]">
      <span className="dropiLabel">
        Channel
        <a href={linkHref} target="_blank" rel="noopener noreferrer">
          <Image
            src="/images/link-icon.svg"
            alt=""
            width={20}
            height={20}
          />
        </a>
      </span>
      <div className="relative w-full overflow-hidden">
        <select
          className="form-select w-full"
          aria-label="Select Channel"
          value={selectedKey}
          disabled={loading && channels.length === 0}
          onChange={(e) => handleChannelChange(e.target.value)}
          title={displayText}
        >
          {loading && channels.length === 0 ? (
            <option value="">Loading...</option>
          ) : (
            channels.map((channel: Channel, index: number) => {
              const key = getChannelKey(channel, index);
              return (
                <option key={key} value={key}>
                  {getChannelDisplayText(channel)}
                </option>
              );
            })
          )}
        </select>
      </div>
    </div>
  );
}
