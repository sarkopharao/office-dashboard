"use client";

import { useState, useEffect, useCallback } from "react";
import SalesCard from "./SalesCard";
import { DUMMY_SALES, SALES_REFRESH_INTERVAL } from "@/lib/constants";
import type { SalesData } from "@/types";

export default function SalesGrid() {
  const [sales, setSales] = useState<SalesData>(DUMMY_SALES);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch("/api/digistore");
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch {
      // Bei Fehler bleiben die letzten Daten stehen
    }
  }, []);

  useEffect(() => {
    fetchSales();
    const interval = setInterval(fetchSales, SALES_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSales]);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const revenueTrend: "up" | "down" | "neutral" =
    sales.revenueToday > sales.revenueYesterday
      ? "up"
      : sales.revenueToday < sales.revenueYesterday
        ? "down"
        : "neutral";

  const ordersTrend: "up" | "down" | "neutral" =
    sales.ordersToday > sales.ordersYesterday
      ? "up"
      : sales.ordersToday < sales.ordersYesterday
        ? "down"
        : "neutral";

  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <SalesCard
        label="Umsatz Heute"
        value={formatCurrency(sales.revenueToday)}
        icon="💰"
        trend={revenueTrend}
        trendValue={`vs. ${formatCurrency(sales.revenueYesterday)} gestern`}
      />
      <SalesCard
        label="Umsatz Gestern"
        value={formatCurrency(sales.revenueYesterday)}
        icon="📊"
      />
      <SalesCard
        label="Bestellungen Heute"
        value={sales.ordersToday}
        icon="🛒"
        trend={ordersTrend}
        trendValue={`vs. ${sales.ordersYesterday} gestern`}
      />
      <SalesCard
        label="Bestellungen Gestern"
        value={sales.ordersYesterday}
        icon="📦"
      />
      <SalesCard
        label="Gesamtkunden"
        value={sales.totalCustomers}
        icon="👥"
      />
      <SalesCard
        label="Aktive Abos"
        value={sales.activeSubscriptions}
        icon="🔄"
      />
    </div>
  );
}
