"use client";

import { ChannelProvider } from "@/context/ChannelContext";
import { HeroUIProvider } from "@heroui/system";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ChannelProvider>{children}</ChannelProvider>
    </HeroUIProvider>
  );
}
