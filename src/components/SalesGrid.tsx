"use client";

import { useState, useEffect, useCallback } from "react";
import SalesCard from "./SalesCard";
import { DUMMY_SALES, SALES_REFRESH_INTERVAL } from "@/lib/constants";
import type { SalesData } from "@/types";

const PRODUCT_GROUP_CONFIG: {
  key: keyof SalesData["ordersByGroup"];
  label: string;
  color: string;
}[] = [
  { key: "PAC", label: "PAC", color: "#009399" },
  { key: "PACL", label: "PACL", color: "#00a8af" },
  { key: "Tiny-PAC", label: "Abnehm-Analyse", color: "#0E75B9" },
  { key: "Club", label: "Club", color: "#73A942" },
  { key: "Leicht 2.0", label: "Leicht 2.0", color: "#ECB31B" },
  { key: "Event 2026", label: "Event", color: "#007a7f" },
];

export default function SalesGrid() {
  const [sales, setSales] = useState<SalesData>(DUMMY_SALES);

  const syncAndFetch = useCallback(async () => {
    try {
      await fetch("/api/digistore/sync", { method: "POST" });
    } catch {
      // Sync-Fehler ignorieren
    }

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
    syncAndFetch();
    const interval = setInterval(syncAndFetch, SALES_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [syncAndFetch]);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const ordersByGroup = sales.ordersByGroup || {
    PAC: 0, PACL: 0, "Tiny-PAC": 0, Club: 0, "Leicht 2.0": 0, "Event 2026": 0,
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Hauptkennzahlen - horizontal wie im Referenz-Dashboard */}
      <div className="grid grid-cols-3 gap-4">
        <SalesCard
          label="Gesamtkunden"
          value={sales.totalCustomers}
          variant="highlight"
          sublabel="Bestellungen Heute"
          subvalue={sales.ordersToday}
        />
        <SalesCard
          label="Umsatz Heute"
          value={formatCurrency(sales.revenueToday)}
          sublabel="Umsatz Gestern"
          subvalue={formatCurrency(sales.revenueYesterday)}
        />
        <SalesCard
          label="Bestellungen Heute"
          value={sales.ordersToday}
          sublabel="Bestellungen Gestern"
          subvalue={sales.ordersYesterday}
        />
      </div>

      {/* Bestellungen nach Produktgruppen */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-intumind-gray-light mb-5">
          Bestellungen Heute nach Produkt
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {PRODUCT_GROUP_CONFIG.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-sm text-intumind-gray">{label}</span>
              <span className="text-xl font-bold text-intumind-dark ml-auto">
                {ordersByGroup[key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
