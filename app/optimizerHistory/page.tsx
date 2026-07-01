"use client";

import OptimizerHistoryTable from "@/app/components/OptimizerHistoryTable";
import Link from "next/link";
import CruiseControlHistoryTable from "../components/CruiseControlHistoryTable";

export default function OptimizerHistoryPage() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] p-5 pt-0">
      <div className="flex justify-between items-center gap-2 py-4 mb-4">
        <h1 className="text-xl font-bold text-[#303030]">Optimizer History</h1>
        <Link href="/bulkOptimizer" className="btn-outline no-underline">
          Back to Optimizer
        </Link>
      </div>

      <div className="card p-0! mb-4">
        <OptimizerHistoryTable onHistoryPage={true} />
      </div>
      <div className="card p-0!">
        <CruiseControlHistoryTable onHistoryPage={true} />
      </div>
    </div>
  );
}
