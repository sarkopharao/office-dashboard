"use client";

import { Column, Flex, Grid, Text } from "@once-ui-system/core";
import SalesCard from "./SalesCard";
import RevenueChart from "./RevenueChart";
import SalesCelebration from "./SalesCelebration";
import { PRODUCT_GROUP_CONFIG } from "@/lib/constants";
import { useSalesData } from "@/hooks/useSalesData";

export default function SalesGrid() {
  const { sales, showLoading, newOrderCount, clearNewOrders } = useSalesData();

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  // Geldregen-Animation während Daten geladen werden (mind. 2 Sek.)
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
        onAnimationComplete={clearNewOrders}
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
        <Grid columns="3" gap="s" className="product-grid">
          {PRODUCT_GROUP_CONFIG.map(({ key, label, color }) => (
            <Flex key={key} vertical="center" gap="8" className="product-row">
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
                className="product-label"
                style={{ color: "#8C919C", flex: 1, minWidth: 0 }}
              >
                {label}
              </Text>
              <Text
                variant="heading-strong-s"
                className="product-count"
                style={{
                  color: "#27313F",
                  fontSize: "1.25rem",
                  textAlign: "right",
                  minWidth: "2rem",
                  fontVariantNumeric: "tabular-nums",
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
