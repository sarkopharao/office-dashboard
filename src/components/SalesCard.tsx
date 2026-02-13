"use client";

import { Column, Text } from "@once-ui-system/core";

interface SalesCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  subvalue?: string | number;
  variant?: "default" | "highlight";
}

export default function SalesCard({
  label,
  value,
  sublabel,
  subvalue,
  variant = "default",
}: SalesCardProps) {
  const isHighlight = variant === "highlight";

  return (
    <Column
      horizontal="center"
      vertical="center"
      padding="m"
      radius="l"
      style={{
        minHeight: "100px",
        textAlign: "center",
        ...(isHighlight
          ? {
              background: "linear-gradient(to bottom right, #009399, #007a7f)",
              color: "#ffffff",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
            }
          : {
              background: "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(4px)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }),
      }}
    >
      <Text
        variant="display-strong-m"
        className="number-transition"
        style={{
          color: isHighlight ? "#ffffff" : "#27313F",
          fontSize: "1.75rem",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1,
        }}
      >
        {typeof value === "number" ? value.toLocaleString("de-DE") : value}
      </Text>
      <Text
        variant="label-strong-s"
        style={{
          color: isHighlight ? "rgba(255,255,255,0.8)" : "#B2BDD1",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop: "0.25rem",
          fontSize: "0.7rem",
        }}
      >
        {label}
      </Text>

      {sublabel && subvalue !== undefined && (
        <>
          <div
            style={{
              width: "2rem",
              height: "1px",
              background: isHighlight ? "rgba(255,255,255,0.3)" : "#e5e7eb",
              margin: "0.4rem 0",
            }}
          />
          <Text
            variant="heading-strong-s"
            style={{
              color: isHighlight ? "#ffffff" : "#27313F",
              fontSize: "1.15rem",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {typeof subvalue === "number" ? subvalue.toLocaleString("de-DE") : subvalue}
          </Text>
          <Text
            variant="label-strong-s"
            style={{
              color: isHighlight ? "rgba(255,255,255,0.6)" : "#B2BDD1",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: "0.25rem",
              fontSize: "0.75rem",
            }}
          >
            {sublabel}
          </Text>
        </>
      )}
    </Column>
  );
}
