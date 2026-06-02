"use client";

import { DollarSign, History, LayoutGrid } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/bulkOptimizer",
    label: ["Bulk", "Optimizer"],
    Icon: LayoutGrid,
    match: (path: string) =>
      path === "/bulkOptimizer" || path.startsWith("/bulkOptimizer/"),
  },
  {
    href: "/optimizerHistory",
    label: ["History"],
    Icon: History,
    match: (path: string) =>
      path === "/optimizerHistory" || path.startsWith("/optimizerHistory/"),
  },
  {
    href: "#upgrade",
    label: ["Upgrade"],
    Icon: DollarSign,
    match: () => false,
  },
] as const;

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: readonly string[];
  Icon: typeof LayoutGrid;
  active: boolean;
}) {
  const colorClass = active
    ? "text-[#5D5FEF]"
    : "text-zinc-700 hover:text-zinc-900";

  const content = (
    <>
      <Icon
        className={`h-6 w-6 shrink-0 ${colorClass}`}
        strokeWidth={active ? 2.25 : 2}
        aria-hidden
      />
      <span
        className={`mt-1.5 text-center text-[11px] font-medium leading-tight ${colorClass}`}
      >
        {label.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    </>
  );

  if (href.startsWith("#")) {
    return (
      <button
        type="button"
        className="flex w-full flex-col items-center border-0 bg-transparent p-0"
        aria-label={label.join(" ")}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="flex w-full flex-col items-center no-underline"
      aria-current={active ? "page" : undefined}
    >
      {content}
    </Link>
  );
}

export default function SideBar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-full w-[100px] flex-col items-center border-r border-zinc-200 bg-white py-8"
      aria-label="Main navigation"
    >
      <Link
        href="/bulkOptimizer"
        className="mb-10 flex shrink-0 items-center justify-center"
        aria-label="SEOKart home"
      >
        <Image
          src="/images/logo.svg"
          alt=""
          width={40}
          height={38}
          priority
        />
      </Link>

      <nav className="flex w-full flex-col items-center gap-9 px-2">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.Icon}
            active={item.match(pathname)}
          />
        ))}
      </nav>
    </aside>
  );
}
