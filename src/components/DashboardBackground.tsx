"use client";

import { useState, useEffect } from "react";

// Hintergrund-Varianten im intumind-Stil
const BACKGROUND_STYLES = [
  "linear-gradient(135deg, #e8f4f4 0%, #d5eded 50%, #c2e6e6 100%)",         // Sanftes Türkis
  "linear-gradient(150deg, #eef2f7 0%, #e2e8f0 50%, #d8dde6 100%)",         // Kühles Grau-Blau
  "linear-gradient(135deg, #e8f4f4 0%, #f0f2f5 50%, #e2e8f0 100%)",         // Türkis zu Grau
  "linear-gradient(160deg, #f0f2f5 0%, #e8f4f4 40%, #d5eded 100%)",         // Grau zu Türkis
  "linear-gradient(140deg, #eef6f6 0%, #e0f0f0 30%, #f0f2f5 100%)",         // Mint-frisch
];

const CHANGE_INTERVAL = 30000; // Alle 30 Sekunden wechseln

export default function DashboardBackground() {
  const [bgIndex, setBgIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextIndex, setNextIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setNextIndex((prev) => (prev + 1) % BACKGROUND_STYLES.length);
      setIsTransitioning(true);

      setTimeout(() => {
        setBgIndex((prev) => (prev + 1) % BACKGROUND_STYLES.length);
        setIsTransitioning(false);
      }, 2000);
    }, CHANGE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Aktueller Hintergrund */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: BACKGROUND_STYLES[bgIndex],
          transition: "opacity 2s ease-in-out",
          opacity: isTransitioning ? 0 : 1,
        }}
      />
      {/* Nächster Hintergrund (fade-in) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: BACKGROUND_STYLES[nextIndex],
          transition: "opacity 2s ease-in-out",
          opacity: isTransitioning ? 1 : 0,
        }}
      />
    </>
  );
}
