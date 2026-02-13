"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SALES_REFRESH_INTERVAL, MIN_LOADING_MS } from "@/lib/constants";
import type { SalesData } from "@/types";

interface UseSalesDataResult {
  sales: SalesData | null;
  showLoading: boolean;
  newOrderCount: number;
  clearNewOrders: () => void;
}

export function useSalesData(): UseSalesDataResult {
  const [sales, setSales] = useState<SalesData | null>(null);
  const [showLoading, setShowLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const prevOrdersRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);
  const pendingDataRef = useRef<SalesData | null>(null);

  const fetchCached = useCallback(async (): Promise<SalesData | null> => {
    try {
      const res = await fetch("/api/digistore");
      if (res.ok && res.status !== 204) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  const syncAndFetch = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      await fetch("/api/digistore/sync", { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
    } catch { /* ignore */ }

    const data = await fetchCached();
    if (data) {
      if (isFirstLoadRef.current) {
        prevOrdersRef.current = data.ordersToday;
        isFirstLoadRef.current = false;
      } else if (prevOrdersRef.current !== null) {
        const diff = data.ordersToday - prevOrdersRef.current;
        if (diff > 0) setNewOrderCount(diff);
        prevOrdersRef.current = data.ordersToday;
      }
      setSales(data);
    }
  }, [fetchCached]);

  useEffect(() => {
    const loadStart = Date.now();

    fetchCached().then((data) => {
      if (data) {
        pendingDataRef.current = data;
        prevOrdersRef.current = data.ordersToday;
        isFirstLoadRef.current = false;

        const elapsed = Date.now() - loadStart;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        setTimeout(() => {
          setSales(pendingDataRef.current);
          setShowLoading(false);
        }, remaining);
      }
    });

    syncAndFetch();

    const fallbackTimer = setTimeout(() => setShowLoading(false), MIN_LOADING_MS);
    const interval = setInterval(syncAndFetch, SALES_REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [syncAndFetch, fetchCached]);

  const clearNewOrders = useCallback(() => setNewOrderCount(0), []);

  return { sales, showLoading, newOrderCount, clearNewOrders };
}
