import { getPlanApi } from "@/utils/apis/globalServerApi";
import { Suspense } from "react";
import UpgradeClient from "./UpgradeClient";

const UPGRADE_AMOUNT = "9.99";

export default async function UpgradePage() {
  
  const getPlan = async () => {
    const response = await getPlanApi();
    return response;
  };

  const { plan, totalOptimizations } = await getPlan();

  return (
    <Suspense fallback={<UpgradePageSkeleton />}>
      <UpgradeClient plan={plan} totalOptimizations={totalOptimizations} />
    </Suspense>
  )
  
}

 function UpgradePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] p-5 pt-0 animate-pulse">
      <div className="w-full lg:w-[950px] mx-auto">
        <header className="py-3 lg:py-6 flex justify-between items-start lg:items-center gap-3 flex-col lg:flex-row">
          <div className="flex flex-col gap-2">
            <div className="h-6 w-24 rounded bg-[#e5e5e5]" />
            <div className="h-3 w-72 max-w-full rounded bg-[#ececec]" />
          </div>
          <div className="h-9 w-24 rounded-md bg-[#e5e5e5]" />
        </header>

        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="h-6 w-28 rounded-full bg-[#e5e5e5]" />
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#ececec]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 rounded bg-[#e5e5e5]" />
                    <div className="h-3 w-full max-w-sm rounded bg-[#ececec]" />
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-[#ececec]" />
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-[#ececec]" />
                  <div className="h-3 w-full rounded bg-[#ececec]" />
                  <div className="h-3 w-2/3 rounded bg-[#ececec]" />
                </div>
              </div>

              <div className="hidden lg:block w-px bg-[#e5e5e5]" />
              <div className="lg:hidden h-px bg-[#e5e5e5]" />

              <div className="flex-1 space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#ececec]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-44 rounded bg-[#e5e5e5]" />
                    <div className="h-3 w-full max-w-xs rounded bg-[#ececec]" />
                  </div>
                </div>
                <div className="h-7 w-28 rounded bg-[#e5e5e5]" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-[#ececec]" />
                  <div className="h-3 w-full rounded bg-[#ececec]" />
                  <div className="h-3 w-4/5 rounded bg-[#ececec]" />
                  <div className="h-3 w-3/4 rounded bg-[#ececec]" />
                </div>
                <div className="h-9 w-full rounded-md bg-[#e5e5e5]" />
              </div>
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <div className="h-5 w-36 rounded bg-[#e5e5e5]" />
            <div className="h-48 w-full rounded-xl bg-[#ececec]" />
          </div>
        </div>
      </div>
    </div>
  );
}