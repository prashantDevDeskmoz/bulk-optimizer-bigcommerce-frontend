"use client";

import { usePathname } from "next/navigation";
import SideBar from "./SideBar";

const SIDEBAR_HIDDEN_PREFIXES = ["/install", "/load"];

function shouldHideSidebar(pathname: string) {
  if (pathname === "/") return true;
  return SIDEBAR_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = shouldHideSidebar(pathname);

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <SideBar />
      <div className="min-h-screen pl-[100px]">{children}</div>
    </div>
  );
}
