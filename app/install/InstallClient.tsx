"use client";

import { dispatchSessionReady } from "@/utils/sessionEvents";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function InstallClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleInstall = () => {
      const sessionToken = searchParams.get("sessionToken");
      const storeHash = searchParams.get("storeHash");
      const sessionExpiresAt = searchParams.get("sessionExpiresAt");
      const storeId = searchParams.get("storeId");
  
      if (sessionToken) {
        localStorage.setItem("sessionToken", sessionToken);
      }
      if (storeHash) {
        localStorage.setItem("storeHash", storeHash);
      }
      if (sessionExpiresAt) {
        localStorage.setItem("sessionExpiresAt", sessionExpiresAt);
      }
      if (storeId) {
        localStorage.setItem("storeId", storeId);
      }

      if (sessionToken) {
        dispatchSessionReady();
      }

      router.replace("/bulkOptimizer");
    }

    handleInstall();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
        <p>Completing installation...</p>
      </div>
    </div>
  );
}
