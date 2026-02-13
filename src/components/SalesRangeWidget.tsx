"use client";

import { memo, useState, useEffect, useRef } from "react";
import { Column, Flex, Grid, Text } from "@once-ui-system/core";
import { PRODUCT_GROUP_CONFIG } from "@/lib/constants";
import { useSalesRange } from "@/hooks/useSalesRange";
import type { SalesRangePreset } from "@/types";

const PRESETS: { key: SalesRangePreset; label: string }[] = [
  { key: "7d", label: "7 Tage" },
  { key: "30d", label: "30 Tage" },
  { key: "90d", label: "90 Tage" },
  { key: "year", label: "Dieses Jahr" },
  { key: "custom", label: "Zeitraum..." },
];

const CRYSTAL_PHRASES = [
  "Blicke in die Vergangenheit...",
  "Lese die Umsatz-Sterne...",
  "Befrage die Kristallkugel...",
  "Die Kugel wird warm...",
  "Zaehle unsichtbare Euros...",
  "Frage das Umsatz-Orakel...",
  "Reise durch die Zeit...",
  "Schuettle die Schneekugel...",
];

function formatCurrency(amount: number): string {
  return amount.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default memo(function SalesRangeWidget() {
  const {
    rangeData,
    loading,
    error,
    selection,
    showDetails,
    setPreset,
    setCustomRange,
    toggleDetails,
  } = useSalesRange();

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const wasLoadingRef = useRef(false);

  // Bei jedem neuen Ladevorgang den Spruch rotieren
  useEffect(() => {
    if (loading && !wasLoadingRef.current) {
      setPhraseIndex((prev) => (prev + 1) % CRYSTAL_PHRASES.length);
    }
    wasLoadingRef.current = loading;
  }, [loading]);

  const handleCustomSubmit = () => {
    if (customFrom && customTo) {
      setCustomRange(customFrom, customTo);
    }
  };

  return (
    <Column
      radius="l"
      padding="m"
      gap="s"
      className="sales-range-widget"
      style={{
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(4px)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      {/* Header: Titel + Details-Toggle */}
      <Flex horizontal="between" vertical="center">
        <Text
          variant="label-strong-s"
          style={{
            color: "#B2BDD1",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "0.7rem",
          }}
        >
          Zeitraum-Uebersicht
        </Text>
        <button
          onClick={toggleDetails}
          style={{
            background: showDetails ? "rgba(0, 147, 153, 0.15)" : "transparent",
            border: "1px solid rgba(0, 147, 153, 0.3)",
            borderRadius: "9999px",
            padding: "0.2rem 0.6rem",
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "#009399",
            cursor: "pointer",
            fontFamily: "var(--font-body), sans-serif",
            transition: "background 0.2s",
          }}
        >
          {showDetails ? "Weniger" : "Details"}
        </button>
      </Flex>

      {/* Preset-Buttons */}
      <Flex gap="4" style={{ flexWrap: "wrap" }}>
        {PRESETS.map(({ key, label }) => {
          const isActive = selection.preset === key;
          return (
            <button
              key={key}
              onClick={() => setPreset(key)}
              className="range-preset-btn"
              style={{
                padding: "0.4rem 0.8rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                border: "none",
                borderRadius: "9999px",
                cursor: "pointer",
                fontFamily: "var(--font-body), sans-serif",
                transition: "background 0.2s, color 0.2s",
                whiteSpace: "nowrap",
                background: isActive ? "#009399" : "rgba(0, 147, 153, 0.1)",
                color: isActive ? "#ffffff" : "#009399",
              }}
            >
              {label}
            </button>
          );
        })}
      </Flex>

      {/* Custom Date Range (nur bei "custom" Preset) */}
      {selection.preset === "custom" && (
        <Flex gap="8" vertical="center" style={{ flexWrap: "wrap" }}>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="range-date-input"
            style={{
              padding: "0.3rem 0.5rem",
              border: "1px solid #D8DDE6",
              borderRadius: "8px",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: "0.75rem",
              color: "#505359",
              background: "#ffffff",
              outline: "none",
              maxWidth: "140px",
            }}
          />
          <Text variant="body-default-s" style={{ color: "#8C919C" }}>
            bis
          </Text>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="range-date-input"
            style={{
              padding: "0.3rem 0.5rem",
              border: "1px solid #D8DDE6",
              borderRadius: "8px",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: "0.75rem",
              color: "#505359",
              background: "#ffffff",
              outline: "none",
              maxWidth: "140px",
            }}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customFrom || !customTo || customFrom > customTo}
            style={{
              padding: "0.3rem 0.7rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              cursor: customFrom && customTo && customFrom <= customTo ? "pointer" : "not-allowed",
              fontFamily: "var(--font-body), sans-serif",
              background: customFrom && customTo && customFrom <= customTo ? "#009399" : "#D8DDE6",
              color: "#ffffff",
              transition: "background 0.2s",
            }}
          >
            Laden
          </button>
        </Flex>
      )}

      {/* Kristallkugel-Ladeanimation (bei jedem Laden) */}
      {loading && (
        <Flex
          direction="column"
          horizontal="center"
          vertical="center"
          gap="8"
          style={{ padding: "1.2rem 0" }}
        >
          {/* Glühende Kristallkugel mit Sternen */}
          <div style={{ position: "relative", width: "60px", height: "60px" }}>
            <span
              style={{
                fontSize: "2.5rem",
                display: "block",
                textAlign: "center",
                animation: "crystalFloat 2s ease-in-out infinite",
                filter: "drop-shadow(0 0 12px rgba(0, 147, 153, 0.5))",
              }}
            >
              🔮
            </span>
            {/* Funkelnde Sterne drumherum */}
            {["✨", "⭐", "✨"].map((star, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  fontSize: "0.8rem",
                  top: `${[0, 50, 10][i]}%`,
                  left: `${[-10, 85, 90][i]}%`,
                  animation: `crystalSparkle 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  opacity: 0,
                }}
              >
                {star}
              </span>
            ))}
          </div>
          <Text
            variant="body-strong-m"
            style={{
              color: "#009399",
              textAlign: "center",
              animation: "crystalTextFade 3s ease-in-out infinite",
            }}
          >
            {CRYSTAL_PHRASES[phraseIndex]}
          </Text>
          <Text
            variant="body-default-s"
            style={{ color: "#B2BDD1", textAlign: "center", fontSize: "0.7rem" }}
          >
            Digistore24 wird befragt...
          </Text>
          <style>{`
            @keyframes crystalFloat {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-6px) scale(1.08); }
            }
            @keyframes crystalSparkle {
              0%, 100% { opacity: 0; transform: scale(0.5); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            @keyframes crystalTextFade {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </Flex>
      )}

      {/* Umsatz + Bestellungen (versteckt während Laden) */}
      {!loading && rangeData && (
        <div>
          <Grid columns="2" gap="s">
            <Column horizontal="center" vertical="center" style={{ textAlign: "center" }}>
              <Text
                variant="display-strong-m"
                style={{
                  color: "#27313F",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCurrency(rangeData.totalRevenue)}
              </Text>
              <Text
                variant="label-strong-s"
                style={{
                  color: "#B2BDD1",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: "0.2rem",
                }}
              >
                Umsatz
              </Text>
            </Column>
            <Column horizontal="center" vertical="center" style={{ textAlign: "center" }}>
              <Text
                variant="display-strong-m"
                style={{
                  color: "#27313F",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {rangeData.totalOrders.toLocaleString("de-DE")}
              </Text>
              <Text
                variant="label-strong-s"
                style={{
                  color: "#B2BDD1",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: "0.2rem",
                }}
              >
                Bestellungen
              </Text>
            </Column>
          </Grid>

          {/* Produktgruppen-Breakdown (optional) */}
          {showDetails && rangeData.ordersByGroup && (
            <Grid columns="3" gap="s" className="product-grid" style={{ marginTop: "0.5rem" }}>
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
                    {rangeData.ordersByGroup![key]}
                  </Text>
                </Flex>
              ))}
            </Grid>
          )}
        </div>
      )}

      {/* Fehler-Anzeige */}
      {error && (
        <Text
          variant="body-default-s"
          style={{
            color: "#BA2F2F",
            textAlign: "center",
            padding: "0.25rem",
            fontSize: "0.7rem",
          }}
        >
          {error}
        </Text>
      )}
    </Column>
  );
});
