"use client";

import { getStoreId } from "@/utils/api";
import {
  getCachedChannelPreviewSamples,
  type ChannelPreviewSamples,
} from "@/utils/channelPreviewCache";
import { useEffect, useState } from "react";

export type UseChannelPreviewSamplesResult = {
  product: Record<string, any> | null;
  category: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean | null;
};

const empty: ChannelPreviewSamples = { product: null, category: null };

/**
 * Loads one product + one category for the BigCommerce channel (tree-scoped category),
 * with a 1-minute in-memory cache per (storeHash, bcChannelId).
 */
export function useChannelPreviewSamples(
  bcChannelId: string | undefined,
): UseChannelPreviewSamplesResult {
  const [state, setState] = useState<UseChannelPreviewSamplesResult>({
    ...empty,
    loading: false,
    error: null,
    fromCache: null,
  });

  useEffect(() => {
    const storeHash = getStoreId();
    if (!storeHash || !bcChannelId) {
      setState({
        ...empty,
        loading: false,
        error: null,
        fromCache: null,
      });
      return;
    }

    let cancelled = false;
    setState((s) => ({
      ...s,
      loading: true,
      error: null,
      fromCache: null,
    }));

    getCachedChannelPreviewSamples(storeHash, bcChannelId)
      .then(({ data, fromCache }) => {
        if (cancelled) return;
        setState({
          product: data.product,
          category: data.category,
          loading: false,
          error: null,
          fromCache,
        });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({
          ...empty,
          loading: false,
          error: e instanceof Error ? e.message : "Preview load failed",
          fromCache: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [bcChannelId]);

  return state;
}
