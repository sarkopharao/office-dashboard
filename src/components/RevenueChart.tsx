"use client";

import { Column, Flex, Text } from "@once-ui-system/core";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyRevenue } from "@/types";

// Wochentage deutsch abkürzen
const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

interface ChartDataPoint {
  label: string;                // Wochentag (Mo, Di, ...)
  date: string;                 // Datum für Tooltip
  current: number | undefined;  // Umsatz aktuelle Woche
  previous: number | undefined; // Umsatz Vorwoche (undefined wenn nicht vorhanden)
}

/**
 * Transformiert dailyRevenue in 7 Datenpunkte
 * mit current (letzte 7 Tage) und previous (Vorwoche).
 * Fehlende Tage werden als undefined gesetzt (Recharts überspringt sie).
 */
function transformData(dailyRevenue: DailyRevenue[]): { points: ChartDataPoint[]; hasPrevious: boolean } {
  if (dailyRevenue.length === 0) return { points: [], hasPrevious: false };

  // Map für schnellen Zugriff
  const revenueMap = new Map<string, number>();
  for (const entry of dailyRevenue) {
    revenueMap.set(entry.day, entry.amount);
  }

  const points: ChartDataPoint[] = [];
  const today = new Date();
  let hasPrevious = false;

  for (let i = 6; i >= 0; i--) {
    // Aktueller Tag (letzte 7 Tage)
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    const currentKey = currentDate.toISOString().split("T")[0];

    // Vorwoche (gleicher Wochentag, 7 Tage früher)
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 7);
    const previousKey = previousDate.toISOString().split("T")[0];

    const weekday = WEEKDAY_SHORT[currentDate.getDay()];
    const dateFormatted = `${currentDate.getDate()}.${currentDate.getMonth() + 1}.`;

    const currentVal = revenueMap.has(currentKey) ? Math.round(revenueMap.get(currentKey)!) : undefined;
    const previousVal = revenueMap.has(previousKey) ? Math.round(revenueMap.get(previousKey)!) : undefined;

    if (previousVal !== undefined) hasPrevious = true;

    points.push({
      label: weekday,
      date: dateFormatted,
      current: currentVal,
      previous: previousVal,
    });
  }

  return { points, hasPrevious };
}

function formatEur(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Custom Tooltip
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const current = payload.find((p: { dataKey: string }) => p.dataKey === "current");
  const previous = payload.find((p: { dataKey: string }) => p.dataKey === "previous");
  const date = payload[0]?.payload?.date || "";

  return (
    <div
      style={{
        background: "rgba(39, 49, 63, 0.95)",
        backdropFilter: "blur(8px)",
        borderRadius: "8px",
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div style={{ color: "#B2BDD1", fontSize: "0.7rem", marginBottom: "6px", fontWeight: 600 }}>
        {label} {date}
      </div>
      {current && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#009399" }} />
          <span style={{ color: "#ffffff", fontSize: "0.8rem", fontWeight: 600 }}>
            {formatEur(current.value)}
          </span>
        </div>
      )}
      {previous && previous.value != null && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B2BDD1" }} />
          <span style={{ color: "#B2BDD1", fontSize: "0.8rem" }}>
            {formatEur(previous.value)}
          </span>
        </div>
      )}
    </div>
  );
}

interface RevenueChartProps {
  dailyRevenue: DailyRevenue[];
}

export default function RevenueChart({ dailyRevenue }: RevenueChartProps) {
  const { points: data, hasPrevious } = transformData(dailyRevenue);

  if (data.length === 0) {
    return null;
  }

  return (
    <Column
      radius="l"
      padding="l"
      style={{
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(4px)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header */}
      <Flex horizontal="between" vertical="center" style={{ marginBottom: "1rem" }}>
        <Text
          variant="label-strong-s"
          style={{
            color: "#B2BDD1",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "0.75rem",
          }}
        >
          Umsatzverlauf
        </Text>

        {/* Legende */}
        <Flex gap="m" vertical="center">
          <Flex gap="4" vertical="center">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#009399" }} />
            <Text variant="label-default-s" style={{ color: "#8C919C", fontSize: "0.7rem" }}>
              Letzte 7 Tage
            </Text>
          </Flex>
          {hasPrevious && (
            <Flex gap="4" vertical="center">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#B2BDD1" }} />
              <Text variant="label-default-s" style={{ color: "#8C919C", fontSize: "0.7rem" }}>
                Vorwoche
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>

      {/* Chart */}
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#009399" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#009399" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientPrevious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B2BDD1" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#B2BDD1" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(178, 189, 209, 0.2)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8C919C", fontSize: 11 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8C919C", fontSize: 10 }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
              width={40}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(0, 147, 153, 0.2)", strokeWidth: 1 }}
            />

            {/* Vorwoche (hinten) */}
            <Area
              type="monotone"
              dataKey="previous"
              stroke="#B2BDD1"
              strokeWidth={1.5}
              fill="url(#gradientPrevious)"
              dot={false}
              activeDot={{ r: 3, fill: "#B2BDD1", strokeWidth: 0 }}
            />

            {/* Aktuelle Woche (vorne) */}
            <Area
              type="monotone"
              dataKey="current"
              stroke="#009399"
              strokeWidth={2}
              fill="url(#gradientCurrent)"
              dot={false}
              activeDot={{ r: 4, fill: "#009399", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Column>
  );
}
