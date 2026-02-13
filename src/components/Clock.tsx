"use client";

import { useState, useEffect } from "react";
import { Column, Text } from "@once-ui-system/core";
import { DAY_NAMES, MONTH_NAMES } from "@/lib/constants";

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  const day = DAY_NAMES[time.getDay()];
  const date = time.getDate();
  const month = MONTH_NAMES[time.getMonth()];
  const year = time.getFullYear();
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  return (
    <Column className="clock-wrapper" style={{ textAlign: "center" }}>
      <Text
        variant="body-strong-m"
        className="clock-time"
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
        className="clock-date"
        style={{ color: "#B2BDD1", fontSize: "0.75rem" }}
      >
        {day}, {date}. {month} {year}
      </Text>
    </Column>
  );
}
