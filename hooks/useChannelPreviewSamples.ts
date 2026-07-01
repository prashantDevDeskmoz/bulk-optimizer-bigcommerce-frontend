"use client";

import {
  getCachedChannelPreviewSamples,
  type ChannelPreviewSamples,
} from "@/utils/channelPreviewCache";
import { useEffect, useState } from "react";

export type UseChannelPreviewSamplesResult = {
  product: Record<string, any> | null;
  category: Record<string, any> | null;
  productImage: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean | null;
};

const empty: ChannelPreviewSamples = { product: null, category: null, productImage: null };

/**
 * Loads one product + one category for the BigCommerce channel (tree-scoped category),
 * with a 2-minute in-memory cache per bcChannelId.
 */
export function useChannelPreviewSamples(
  bcChannelId: number,
): UseChannelPreviewSamplesResult {
  const [state, setState] = useState<UseChannelPreviewSamplesResult>({
    ...empty,
    loading: false,
    error: null,
    fromCache: null,
  });

  useEffect(() => {
    if (!bcChannelId) {
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

    getCachedChannelPreviewSamples(bcChannelId)
      .then(({ data, fromCache }) => {
        if (cancelled) return;
        setState({
          product: data.product,
          category: data.category,
          productImage: data.productImage,
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
          productImage: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [bcChannelId]);

  return state;
}
