"use client";

import { loginWithPayloadJWT } from "@/utils/apis/authApi";
import { dispatchSessionReady } from "@/utils/sessionEvents";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LoadStates: Record<number, string> = {
  1 : "Loading your app...",
  2 : "Verifying your identity...",
  3 : "Almost there...",
}

export default function LoadClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading,setLoading] = useState<number>(1);

  // BigCommerce sends `signed_payload_jwt` on the load callback
  const signed_payload_jwt =
    searchParams.get("signed_payload_jwt") ?? searchParams.get("signed_payload");

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        const response = await loginWithPayloadJWT(signed_payload_jwt ?? "");
        localStorage.setItem("sessionToken", response.sessionToken);
        dispatchSessionReady();
        router.push("/bulkOptimizer");
      } catch (error : any) {
        setError(error.message);
        console.error(error);
      }
    };

    verifyAndRedirect();
    const interval = setInterval(() => {
      setLoading(prev => prev + 1 < 3 ? prev + 1 : 3);
      if(loading >= 3) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);

  }, [router, signed_payload_jwt]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
        <p>{LoadStates[loading]}</p>
      </div>
    </div>
  );
}

