"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Column, Flex, Grid, Text } from "@once-ui-system/core";
import SalesCard from "./SalesCard";
import RevenueChart from "./RevenueChart";
import SalesCelebration from "./SalesCelebration";
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
  const [newOrderCount, setNewOrderCount] = useState(0);
  const prevOrdersRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);

  const syncAndFetch = useCallback(async () => {
    try {
      await fetch("/api/digistore/sync", { method: "POST" });
    } catch {
      // Sync-Fehler ignorieren
    }

    try {
      const res = await fetch("/api/digistore");
      if (res.ok) {
        const data: SalesData = await res.json();

        // Neue Bestellungen erkennen (nicht beim ersten Laden)
        if (isFirstLoadRef.current) {
          // Beim ersten Laden merken wir uns den Stand, feiern aber nicht
          prevOrdersRef.current = data.ordersToday;
          isFirstLoadRef.current = false;
        } else if (prevOrdersRef.current !== null) {
          const diff = data.ordersToday - prevOrdersRef.current;
          if (diff > 0) {
            // Neue Bestellungen! Raketen los!
            setNewOrderCount(diff);
          }
          prevOrdersRef.current = data.ordersToday;
        }

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
    <Column gap="m" padding="l">
      {/* Raketen + Konfetti bei neuen Bestellungen */}
      <SalesCelebration
        newOrderCount={newOrderCount}
        onAnimationComplete={() => setNewOrderCount(0)}
      />

      {/* Obere Reihe: Kunden + Tagesumsatz */}
      <Grid columns="2" gap="m">
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
      </Grid>

      {/* Untere Reihe: Monatsumsatz + Bestellungen */}
      <Grid columns="2" gap="m">
        <SalesCard
          label="Umsatz Monat"
          value={formatCurrency(sales.revenueThisMonth)}
          sublabel="Letzter Monat"
          subvalue={formatCurrency(sales.revenueLastMonth)}
        />
        <SalesCard
          label="Bestellungen Heute"
          value={sales.ordersToday}
          sublabel="Bestellungen Gestern"
          subvalue={sales.ordersYesterday}
        />
      </Grid>

      {/* Bestellungen nach Produktgruppen */}
      <Column
        radius="l"
        padding="l"
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Text
          variant="label-strong-s"
          style={{
            color: "#B2BDD1",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1.25rem",
            fontSize: "0.75rem",
          }}
        >
          Bestellungen Heute nach Produkt
        </Text>
        <Grid columns="3" gap="m">
          {PRODUCT_GROUP_CONFIG.map(({ key, label, color }) => (
            <Flex key={key} vertical="center" gap="12">
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <Text
                variant="body-default-s"
                style={{ color: "#8C919C" }}
              >
                {label}
              </Text>
              <Text
                variant="heading-strong-s"
                style={{
                  color: "#27313F",
                  marginLeft: "auto",
                  fontSize: "1.25rem",
                }}
              >
                {ordersByGroup[key]}
              </Text>
            </Flex>
          ))}
        </Grid>
      </Column>

      {/* Umsatzverlauf-Chart */}
      <RevenueChart dailyRevenue={sales.dailyRevenue || []} />
    </Column>
  );
}
