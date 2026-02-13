"use client";

import { useState, useEffect } from "react";
import { Column, Text } from "@once-ui-system/core";

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  const dayNames = [
    "Sonntag", "Montag", "Dienstag", "Mittwoch",
    "Donnerstag", "Freitag", "Samstag",
  ];
  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];

  const day = dayNames[time.getDay()];
  const date = time.getDate();
  const month = monthNames[time.getMonth()];
  const year = time.getFullYear();
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  return (
    <Column style={{ textAlign: "center" }}>
      <Text
        variant="body-strong-m"
        style={{
          color: "#ffffff",
          fontVariantNumeric: "tabular-nums",
          fontSize: "1.25rem",
        }}
      >
        {hours}:{minutes}
      </Text>
      <Text
        variant="label-default-s"
        style={{ color: "#B2BDD1", fontSize: "0.75rem" }}
      >
        {day}, {date}. {month} {year}
      </Text>
    </Column>
  );
}
