"use client";

import { useState, useEffect } from "react";

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
    <div className="text-right">
      <div className="text-intumind-white text-xl font-semibold tabular-nums">
        {hours}:{minutes}
      </div>
      <div className="text-intumind-gray-light text-xs">
        {day}, {date}. {month} {year}
      </div>
    </div>
  );
}
