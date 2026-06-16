"use client";

import { captureOrderApi, createOrderApi } from "@/utils/apis/globalApi";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useMemo, useState } from "react";

const UPGRADE_AMOUNT = "9.99";

export default function UpgradePage() {
  const [showPayPal, setShowPayPal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const providerOptions = useMemo(
    () => ({
      clientId: paypalClientId ?? "",
      currency: "USD",
      intent: "capture",
    }),
    [paypalClientId],
  );

  async function createOrder() {
    setErrorMessage(null);
    const reponse = await createOrderApi(UPGRADE_AMOUNT);
    return reponse.id;
  }

  async function onApprove(data: { orderID: string }) {
    setErrorMessage(null);
    const res = await captureOrderApi(data.orderID);
    if (res.success) {
      setIsSuccess(true);
    } else {
      throw new Error(res.message || "Payment capture failed");
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Upgrade to Premium</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Unlock all features with a one-click upgrade.
        </p>

        {isSuccess ? (
          <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Payment successful. Your upgrade is being activated.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowPayPal((prev) => !prev)}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              {showPayPal ? "Hide PayPal" : `Upgrade - $${UPGRADE_AMOUNT}`}
            </button>

            {errorMessage ? (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {showPayPal ? (
              paypalClientId || true ? (
                <div className="mt-4">
                  <PayPalScriptProvider options={providerOptions}>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "blue" }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onError={(err) => {
                        console.error("PayPal error", err);
                        setErrorMessage("PayPal checkout failed. Please try again.");
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID in frontend environment.
                </p>
              )
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}