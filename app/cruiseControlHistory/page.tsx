"use client";

import CruiseControlHistoryTable from "@/app/components/CruiseControlHistoryTable";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function CruiseControlHistoryPage() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] p-5 pt-0">
      <Link
        href="/bulkOptimizer"
        className="mb-4 flex items-center gap-1 py-3 text-sm text-[#616161] hover:text-[#303030]"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-xl font-bold text-[#303030] mb-4">
        Cruise Control History
      </h1>

      <div className="card p-0!">
        <CruiseControlHistoryTable onHistoryPage={true} />
      </div>
    </div>
  );
}
