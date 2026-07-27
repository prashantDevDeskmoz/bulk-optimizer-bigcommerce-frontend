"use client";

import { createSubscriptionApi, getSubscriptionStatusApi } from "@/utils/apis/globalClientApi";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Crown, Gift, Lock, Settings, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

async function pollSubscriptionStatus(
  subscriptionID: string,
  attempts = 10,
  delayMs = 1500,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const res = await getSubscriptionStatusApi(subscriptionID);
    if (res.status === "active") return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

export default function UpgradeClient({ plan , totalOptimizations }: { plan: any, totalOptimizations: number }) {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
    const [isConfirmingSubscription, setIsConfirmingSubscription] = useState(false);
    const [isRefreshingPlan, startRefreshTransition] = useTransition();
    const router = useRouter();

    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    const createSubscription = useCallback(async () => {
      setErrorMessage(null);
      setIsCreatingSubscription(true);
      try {
        const response = await createSubscriptionApi();
        if (!response?.id) {
          throw new Error(response?.message || response?.error || "Failed to create subscription");
        }
        return response.id;
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to create subscription");
        throw err;
      } finally {
        setIsCreatingSubscription(false);
      }
    }, []);

    const onApprove = useCallback(async (data: { subscriptionID?: string }) => {
      setErrorMessage(null);
      setIsConfirmingSubscription(true);
      try {
        if (!data.subscriptionID) {
          throw new Error("Missing subscription ID");
        }
        const confirmed = await pollSubscriptionStatus(data.subscriptionID);
        if (confirmed) {
          setIsSuccess(true);
          startRefreshTransition(() => {
            router.refresh();
          });
        } else {
          // Payment went through; only the webhook is still catching up. Don't
          // throw — that would surface as a scary "checkout failed" error.
          setErrorMessage("Payment is processing. Please refresh in a moment.");
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Subscription confirmation failed");
      } finally {
        setIsConfirmingSubscription(false);
      }
    }, [router]);

    const onPayPalError = useCallback((err: unknown) => {
      console.error("PayPal error", err);
      setErrorMessage("PayPal checkout failed. Please try again.");
    }, []);
    
      return (
        <div className="min-h-screen bg-[#F1F1F1] p-5 pt-0">
          <div className="w-full lg:w-[950px] mx-auto">
            <header className="py-3 lg:py-6 flex justify-between items-start lg:items-center gap-3 flex-col lg:flex-row">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight">Pricing</h1>
                <p className="text-xs text-[#616161] mt-0.5">Choose the plan that fits your business and automate your SEO in bulk.</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="btn-outline" onClick={() => router.push("/bulkOptimizer")}>Back To Optimizer</button>
              </div>
            </header>
    
            <div className="flex flex-col gap-4">
            {
                plan.plan.name === "free" ? (
                    <FreePlan
                      totalOptimizations={totalOptimizations}
                      limit={plan.plan.itemLimit ?? 50}
                      paypalClientId={paypalClientId}
                      createSubscription={createSubscription}
                      onApprove={onApprove}
                      isSuccess={isSuccess}
                      isCreatingSubscription={isCreatingSubscription}
                      isConfirmingSubscription={isConfirmingSubscription}
                      isRefreshingPlan={isRefreshingPlan}
                      errorMessage={errorMessage}
                      onPayPalError={onPayPalError}
                    />
                ) : (
                    <ProPlan />
                )
            }
    
              {/* Compare features table (responsive) */}
              <div className="card overflow-hidden">
                <div>
                  <h3 className="text-base font-bold text-[#303030]">
                    Compare Features
                  </h3>
                </div>
    
                <div>
                  <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
                    <table className="w-full min-w-[720px] border-collapse">
                      <thead>
                        {/* Pricing + plan name row */}
                        <tr>
                          <td className="px-4 py-4 bg-white border-b border-r border-[#e5e5e5] align-middle">
                            <h4 className="text-base font-bold text-[#303030]">
                              Features &amp; Benefits
                            </h4>
                            <p className="mt-1 text-xs text-[#616161]">
                              Choose the plan that fits your needs
                            </p>
                          </td>
    
                          {/* Free Plan */}
                          <td className="px-4 py-4 text-center bg-white border-b border-r border-[#e5e5e5]">
                            <span className="inline-block mb-2 text-xs font-semibold text-[#303030] border border-[#c9c9c9] rounded-full px-3 py-0.5">
                              Free Plan
                            </span>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-[22px] font-bold leading-tight text-[#303030]">
                                US$ 0
                              </span>
                              <span className="text-xs text-[#616161]">/ month</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#616161]">
                              {plan.plan.itemLimit ?? 50} Monthly Optimizations
                            </p>
                          </td>
    
                          {/* Pro Plan */}
                          <td className="px-4 py-4 text-center bg-[#EFF7F1] border-b border-[#e5e5e5]">
                            <span className="inline-block mb-2 text-xs font-semibold text-[#166534] border border-[#cfe7d7] rounded-full px-3 py-0.5">
                              Pro Plan
                            </span>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-[22px] font-bold leading-tight text-[#303030]">
                                US$ 10
                              </span>
                              <span className="text-xs text-[#616161]">/ month</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#616161]">
                              Unlimited Optimizations
                            </p>
                          </td>
                        </tr>
                      </thead>
    
                      <tbody>
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            Monthly Optimizations
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="font-medium text-[#616161]">{plan.plan.itemLimit ?? 50}</span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="font-medium text-[#166534]">Unlimited</span>
                          </td>
                        </tr>
    
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            Title Optimization
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#166534]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
    
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            Meta Description Optimization
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#166534]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
    
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            Alt Text Optimization
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#166534]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
    
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            Smart Templates
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#166534]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
    
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            Bulk Update Blank Fields
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#166534]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
    
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            <div className="flex items-center gap-2">
                              <span className="whitespace-nowrap">Cruise Control</span>
                              <span
                                className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#c9c9c9] bg-white text-[11px] font-bold leading-none text-[#616161]"
                                title="More info"
                                aria-hidden
                              >
                                i
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="text-[#8a8a8a] font-medium">—</span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#166534]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
    
                        <tr className="bg-white">
                          <td className="px-4 py-4 text-[13px] text-[#303030] border-b border-r border-[#e5e5e5]">
                            <div className="flex items-center gap-2">
                              <span className="whitespace-nowrap">Auto Optimize New Products</span>
                              <span
                                className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#c9c9c9] bg-white text-[11px] font-bold leading-none text-[#616161]"
                                title="More info"
                                aria-hidden
                              >
                                i
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] text-[#616161] border-b border-r border-[#e5e5e5]">
                            <span className="text-[#8a8a8a] font-medium">—</span>
                          </td>
                          <td className="px-4 py-4 text-center text-[13px] border-b border-[#e5e5e5]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#166534]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
    
                        {/* CTA row
                        <tr>
                          <td className="px-4 py-4 bg-white border-r border-[#e5e5e5]" />
    
                          //Free — current plan, disabled //
                          <td className="px-4 py-4 text-center bg-white border-r border-[#e5e5e5]">
                            <button
                              disabled
                              className="btn-outline w-full max-w-[180px] h-9 opacity-50 cursor-not-allowed"
                            >
                              Current Plan
                            </button>
                          </td>
    
                          // Pro — upgrade CTA //
                          <td className="px-4 py-4 text-center bg-[#EFF7F1]">
                            <button type="button" className="custom-btn w-full max-w-[180px] h-9">
                              Choose Pro
                            </button>
                          </td>
                        </tr> */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
    
            </div>
    
          </div>
        </div >
      );
}

const ProPlan = () => {
    return (
        <div className="card p-0 overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Pro Plan (Current) */}
                  <div className="flex-1">
                    <div className="badge w-fit bg-[#5d5fef]! text-white!">Current Plan</div>
    
                    <div className="mt-3 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#EEEDFC] flex items-center justify-center text-[#5d5fef] shrink-0">
                        <Crown className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-[#303030]">
                            Pro Plan
                          </h2>
                        </div>
    
                        <p className="text-xs text-[#616161]">
                          Unlimited Monthly Optimizations
                        </p>
                        <p className="mt-0.5 text-xs text-[#616161]">
                          You have full access to all premium features.
                        </p>
                      </div>
                    </div>
    
                    <div className="mt-4 mb-1">
                      <div className="flex items-center justify-between py-3 border-b border-[#e5e5e5]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                          <span className="text-xs text-[#616161]">Status</span>
                        </div>
                        <span className="badge badge-success">Active</span>
                      </div>
    
                      <div className="flex items-center justify-between py-3 border-b border-[#e5e5e5]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                          <span className="text-xs text-[#616161]">Price</span>
                        </div>
                        <span className="text-xs font-medium text-[#303030]">US$ 10 / month</span>
                      </div>
    
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                          <span className="text-xs text-[#616161]">Next billing date</span>
                        </div>
                        <span className="text-xs font-medium text-[#303030]">May 31, 2025</span>
                      </div>
                    </div>
    
                    <button
                      type="button"
                      className="btn-outline w-full mt-4 h-9 flex items-center justify-center gap-2"
                    >
                      <Settings className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      <span>Manage Subscription</span>
                    </button>
                  </div>
    
                  {/* Divider */}
                  <div className="hidden lg:block w-px bg-[#e5e5e5]" />
                  <div className="lg:hidden h-px bg-[#e5e5e5]" />
    
                  {/* Right: Already on Pro */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#5d5fef] flex items-center justify-center text-white shrink-0">
                        <TrendingUp className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#303030]">
                          Already on Pro
                        </h3>
                        <p className="mt-0.5 text-xs text-[#616161]">
                          Thanks for upgrading! You are getting the most out of Bulk
                          Optimizer.
                        </p>
                      </div>
                    </div>
    
                    <div className="mt-5 space-y-3">
                      {[
                        "Unlimited optimizations",
                        "Advanced automation features",
                        "Priority support",
                      ].map((label) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a] shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </span>
                          <span className="text-xs text-[#616161]">{label}</span>
                        </div>
                      ))}
                    </div>
    
                    <div className="mt-5 rounded-xl border border-[#cfe7d7] bg-[#EFF7F1] p-4 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#DEF2E2] flex items-center justify-center text-[#0f6a3a] shrink-0">
                        <Gift className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f6a3a]">
                          You are all set!
                        </p>
                        <p className="mt-0.5 text-xs text-[#616161]">
                          Focus on growing your business while we handle your SEO in
                          bulk.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
    )
}

type PayPalCheckoutProps = {
  createSubscription: () => Promise<string>;
  onApprove: (data: { subscriptionID?: string }) => Promise<void>;
  onPayPalError: (err: unknown) => void;
  onLoadFailed: () => void;
  isCreatingSubscription: boolean;
  isConfirmingSubscription: boolean;
  isRefreshingPlan: boolean;
};

const PayPalCheckout = ({
  createSubscription,
  onApprove,
  onPayPalError,
  onLoadFailed,
  isCreatingSubscription,
  isConfirmingSubscription,
  isRefreshingPlan,
}: PayPalCheckoutProps) => {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        Failed to load PayPal. Please refresh and try again.
      </p>
    );
  }

  if (!isResolved) {
    return (
      <p className="rounded-md bg-[#f5f5f5] px-3 py-2 text-sm text-[#616161]">
        Loading PayPal checkout...
      </p>
    );
  }

  return (
    <div className="w-full min-h-[45px] space-y-2">
      {isCreatingSubscription && (
        <div className="flex items-center justify-center gap-2 rounded-md bg-[#f5f5f5] px-3 py-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#5d5fef] border-t-transparent" />
          <p className="text-sm text-[#616161]">Creating subscription...</p>
        </div>
      )}
      {isConfirmingSubscription || isRefreshingPlan ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md bg-[#f5f5f5] px-3 py-6">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#5d5fef] border-t-transparent" />
          <p className="text-sm font-medium text-[#303030]">
            {isConfirmingSubscription ? "Confirming your subscription..." : "Refreshing your plan..."}
          </p>
          <p className="text-xs text-[#616161]">Please don&apos;t close this window.</p>
        </div>
      ) : (
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect" }}
          disabled={isCreatingSubscription}
          createSubscription={async () => createSubscription()}
          onApprove={async (data) => {
            // Don't await — resolve immediately so the PayPal popup closes
            // right after approval instead of hanging blank while we poll.
            void onApprove({ subscriptionID: data.subscriptionID ?? undefined });
          }}
          onError={(err) => {
            onPayPalError(err);
            onLoadFailed();
          }}
          onCancel={() => onLoadFailed()}
        />
      )}
    </div>
  );
};

type FreePlanProps = {
  totalOptimizations: number;
  limit: number;
  paypalClientId?: string;
  createSubscription: () => Promise<string>;
  onApprove: (data: { subscriptionID?: string }) => Promise<void>;
  isSuccess: boolean;
  isCreatingSubscription: boolean;
  isConfirmingSubscription: boolean;
  isRefreshingPlan: boolean;
  errorMessage: string | null;
  onPayPalError: (err: unknown) => void;
};

const FreePlan = ({
  totalOptimizations,
  limit,
  paypalClientId,
  createSubscription,
  onApprove,
  isSuccess,
  isCreatingSubscription,
  isConfirmingSubscription,
  isRefreshingPlan,
  errorMessage,
  onPayPalError,
}: FreePlanProps) => {
  const [showPayPal, setShowPayPal] = useState(false);

  const handleUpgradeToPro = () => {
    setShowPayPal(true);
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Free Plan (Current) */}
        <div className="flex-1">
          <div className="badge w-fit bg-[#5d5fef]! text-white!">Current Plan</div>

          <div className="mt-3 flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#EEEDFC] flex items-center justify-center text-[#5d5fef] shrink-0">
              <Crown className="h-5 w-5 text-[#5d5fef]" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#303030]">Free Plan</h2>
              <p className="text-xs text-[#616161]">
                Optimize your products in bulk with essential SEO features.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold leading-tight text-[#303030]">
                {totalOptimizations}
              </span>
              <span className="text-xs font-medium text-[#616161]">
                / {limit} Optimizations Used
              </span>
            </div>

            <div className="mt-2 h-2 w-full rounded-full bg-[#e5e5e5] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#3f3f3f]"
                style={{ width: `${(totalOptimizations / limit) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-4 mb-1">
            <div className="flex items-center justify-between py-3 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-xs text-[#616161]">Status</span>
              </div>
              <span className="badge bg-[#5d5fef]! text-white!">Free</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-xs text-[#616161]">Price</span>
              </div>
              <span className="text-xs font-medium text-[#303030]">US$ 0 / month</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-xs text-[#616161]">Monthly Optimizations</span>
              </div>
              <span className="text-xs font-medium text-[#303030]">{limit}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-[#e5e5e5]" />
        <div className="lg:hidden h-px bg-[#e5e5e5]" />

        {/* Right: Pro upgrade */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#5d5fef] flex items-center justify-center text-white shrink-0">
              <TrendingUp className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#303030]">
                Need more optimizations?
              </h3>
              <p className="text-xs text-[#616161]">
                Upgrade to Pro. Unlock more features.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-[22px] font-bold leading-tight text-[#5d5fef]">
              US$ 10
            </span>
            <span className="text-xs font-medium text-[#616161]">/ month</span>
          </div>

          <div className="mt-5 space-y-3">
            {[
              "Unlimited optimizations",
              "Advanced automation features",
              "Cruise Control",
              "Auto optimize new products",
            ].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f6a3a] shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-xs text-[#616161]">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6">
            {isSuccess ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Payment successful. Your upgrade is being activated.
              </p>
            ) : showPayPal ? (
              paypalClientId ? (
                <PayPalCheckout
                  createSubscription={createSubscription}
                  onApprove={onApprove}
                  onPayPalError={onPayPalError}
                  onLoadFailed={() => setShowPayPal(false)}
                  isCreatingSubscription={isCreatingSubscription}
                  isConfirmingSubscription={isConfirmingSubscription}
                  isRefreshingPlan={isRefreshingPlan}
                />
              ) : (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID in frontend environment.
                </p>
              )
            ) : (
              <button type="button" onClick={handleUpgradeToPro} className="custom-btn w-full h-9">
                Upgrade to Pro
              </button>
            )}

            {showPayPal && !isSuccess ? (
              <button
                type="button"
                onClick={() => setShowPayPal(false)}
                className="btn-outline mt-2 w-full h-9"
              >
                Cancel upgrade
              </button>
            ) : null}

            {errorMessage ? (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {!isSuccess && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-[#616161]">
                <Lock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                <span>Cancel anytime. No hidden fees.</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}