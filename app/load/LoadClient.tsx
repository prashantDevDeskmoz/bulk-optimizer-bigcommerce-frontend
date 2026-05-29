"use client";

import { loginWithPayloadJWT } from "@/utils/apis/authApi";
import { dispatchSessionReady } from "@/utils/sessionEvents";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LoadClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
      } catch (error) {
        console.error(error);
      }
    };

    verifyAndRedirect();
  }, [router, signed_payload_jwt]);

  useEffect(() => {
    router.push("/bulkOptimizer");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
        <p>Loading your app , verifying your identity...</p>
      </div>
    </div>
  );
}

