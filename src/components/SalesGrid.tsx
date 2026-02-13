"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Column, Flex, Grid, Text } from "@once-ui-system/core";
import SalesCard from "./SalesCard";
import RevenueChart from "./RevenueChart";
import SalesCelebration from "./SalesCelebration";
import { SALES_REFRESH_INTERVAL } from "@/lib/constants";
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

const MIN_LOADING_MS = 2000; // Mindestens 2 Sek. Geldregen zeigen

export default function SalesGrid() {
  const [sales, setSales] = useState<SalesData | null>(null);
  const [showLoading, setShowLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const prevOrdersRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);
  const pendingDataRef = useRef<SalesData | null>(null);

  // Gecachte Daten aus der API holen (ohne Sync, sofort)
  const fetchCached = useCallback(async () => {
    try {
      const res = await fetch("/api/digistore");
      if (res.ok && res.status !== 204) {
        const data: SalesData = await res.json();
        return data;
      }
    } catch {
      // Ignorieren
    }
    return null;
  }, []);

  // Sync mit Digistore24 + danach frische Daten holen
  const syncAndFetch = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      await fetch("/api/digistore/sync", { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
    } catch {
      // Sync-Fehler/Timeout ignorieren
    }

    const data = await fetchCached();
    if (data) {
      // Neue Bestellungen erkennen (nicht beim ersten Laden)
      if (isFirstLoadRef.current) {
        prevOrdersRef.current = data.ordersToday;
        isFirstLoadRef.current = false;
      } else if (prevOrdersRef.current !== null) {
        const diff = data.ordersToday - prevOrdersRef.current;
        if (diff > 0) {
          setNewOrderCount(diff);
        }
        prevOrdersRef.current = data.ordersToday;
      }

      setSales(data);
    }
  }, [fetchCached]);

  useEffect(() => {
    const loadStart = Date.now();

    // 1. Sofort gecachte Daten laden (kein Sync, kein Warten)
    fetchCached().then((data) => {
      if (data) {
        pendingDataRef.current = data;
        prevOrdersRef.current = data.ordersToday;
        isFirstLoadRef.current = false;

        // Mindestens 3 Sek. Animation zeigen
        const elapsed = Date.now() - loadStart;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        setTimeout(() => {
          setSales(pendingDataRef.current);
          setShowLoading(false);
        }, remaining);
      }
    });

    // 2. Im Hintergrund Sync starten (dauert ~10 Sek)
    syncAndFetch();

    // 3. Fallback: Falls nach 3 Sek noch keine Daten, Loading trotzdem beenden
    const fallbackTimer = setTimeout(() => setShowLoading(false), MIN_LOADING_MS);

    // 4. Danach regelmäßig syncen
    const interval = setInterval(syncAndFetch, SALES_REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [syncAndFetch, fetchCached]);

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  // Geldregen-Animation während Daten geladen werden (mind. 3 Sek.)
  if (!sales || showLoading) {
    const moneyEmojis = ["💰", "💶", "🪙", "💵", "💎", "🤑"];
    return (
      <Column gap="s" padding="m" style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
        {/* Fallende Geld-Emojis */}
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "-2rem",
              left: `${5 + (i * 8) % 90}%`,
              fontSize: `${1.2 + (i % 3) * 0.5}rem`,
              animation: `moneyFall ${2 + (i % 4) * 0.8}s ease-in infinite`,
              animationDelay: `${(i * 0.3) % 2.4}s`,
              opacity: 0.6,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            {moneyEmojis[i % moneyEmojis.length]}
          </span>
        ))}

        {/* Zentrierter Text */}
        <Flex
          direction="column"
          horizontal="center"
          vertical="center"
          gap="8"
          style={{ flex: 1, zIndex: 1 }}
        >
          <span style={{ fontSize: "3rem", animation: "moneyPulse 1.5s ease-in-out infinite" }}>
            🤑
          </span>
          <Text
            variant="body-strong-m"
            style={{ color: "#27313F", textAlign: "center" }}
          >
            Zähle die Euros...
          </Text>
          <Text
            variant="body-default-s"
            style={{ color: "#8C919C", textAlign: "center" }}
          >
            Sales-Daten werden frisch geholt
          </Text>
        </Flex>

        <style>{`
          @keyframes moneyFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.7; }
            90% { opacity: 0.5; }
            100% { transform: translateY(calc(100vh)) rotate(360deg); opacity: 0; }
          }
          @keyframes moneyPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}</style>
      </Column>
    );
  }

  const ordersByGroup = sales.ordersByGroup || {
    PAC: 0, PACL: 0, "Tiny-PAC": 0, Club: 0, "Leicht 2.0": 0, "Event 2026": 0,
  };

  return (
    <Column gap="s" padding="m" style={{ flex: 1, minHeight: 0 }}>
      {/* Raketen + Konfetti bei neuen Bestellungen */}
      <SalesCelebration
        newOrderCount={newOrderCount}
        onAnimationComplete={() => setNewOrderCount(0)}
      />

      {/* Obere Reihe: Kunden + Tagesumsatz */}
      <Grid columns="2" gap="s">
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
      <Grid columns="2" gap="s">
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
        padding="m"
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
            marginBottom: "0.75rem",
            fontSize: "0.7rem",
          }}
        >
          Bestellungen Heute nach Produkt
        </Text>
        <Grid columns="3" gap="s">
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

      {/* Umsatzverlauf-Chart – füllt restlichen Platz */}
      <RevenueChart dailyRevenue={sales.dailyRevenue || []} />
    </Column>
  );
}
