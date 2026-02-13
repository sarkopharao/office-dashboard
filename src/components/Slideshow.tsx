"use client";

import { useState, useEffect, useCallback } from "react";
import { Flex, Text } from "@once-ui-system/core";
import { SLIDESHOW_INTERVAL } from "@/lib/constants";
import { useRotatingQuote } from "@/hooks/useRotatingQuote";
import type { Photo } from "@/types";

// Layout-Varianten: immer 2 oder 3 Fotos
type LayoutVariant = "duo-overlap" | "duo-spread" | "trio-fan" | "trio-stack";

const LAYOUT_VARIANTS: LayoutVariant[] = [
  "duo-overlap",
  "trio-fan",
  "duo-spread",
  "trio-stack",
];


interface PolaroidProps {
  url: string;
  alt: string;
  rotation: number;
  style?: React.CSSProperties;
  className?: string;
}

function Polaroid({ url, alt, rotation, style: extraStyle, className = "" }: PolaroidProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        padding: "8px 8px 40px 8px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
        transform: `rotate(${rotation}deg)`,
        ...extraStyle,
      }}
    >
      <img
        src={url}
        alt={alt}
        style={{
          width: "100%",
          objectFit: "cover",
          flex: 1,
          minHeight: 0,
        }}
      />
    </div>
  );
}

export default function Slideshow() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [layoutStep, setLayoutStep] = useState(0);

  // Quote State (via Hook)
  const { quote, quoteVisible } = useRotatingQuote();

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/photos");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch {
      // Fehler ignorieren, vorhandene Fotos weiter anzeigen
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
    const refreshInterval = setInterval(fetchPhotos, 60000);
    return () => clearInterval(refreshInterval);
  }, [fetchPhotos]);

  // Aktuelles Layout bestimmen
  const currentLayout = LAYOUT_VARIANTS[layoutStep % LAYOUT_VARIANTS.length];

  useEffect(() => {
    if (photos.length < 2) return;

    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setLayoutStep((prev) => {
          const nextStep = prev + 1;
          const nextLayout = LAYOUT_VARIANTS[nextStep % LAYOUT_VARIANTS.length];
          const isTrio = nextLayout === "trio-fan" || nextLayout === "trio-stack";
          const step = isTrio && photos.length >= 3 ? 3 : 2;
          setCurrentIndex((prevIdx) => (prevIdx + step) % photos.length);
          return nextStep;
        });
        setIsVisible(true);
      }, 1200);
    }, SLIDESHOW_INTERVAL);

    return () => clearInterval(interval);
  }, [photos.length]);

  // Preload nächste Bilder (bis zu 3 voraus)
  useEffect(() => {
    if (photos.length < 2) return;
    for (let i = 1; i <= 3; i++) {
      const nextIdx = (currentIndex + i) % photos.length;
      if (photos[nextIdx].url) {
        const img = new window.Image();
        img.src = photos[nextIdx].url;
      }
    }
  }, [currentIndex, photos]);

  // Foto-Indizes für Duo/Trio-Layouts
  const secondIndex = (currentIndex + 1) % photos.length;
  const thirdIndex = (currentIndex + 2) % photos.length;

  if (photos.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "16px", boxSizing: "border-box", gap: "16px" }}>
        <Flex
          style={{ flex: 1 }}
          direction="column"
          horizontal="center"
          vertical="center"
        >
          <Text
            variant="display-strong-m"
            style={{ color: "#ffffff", fontWeight: 700 }}
          >
            <span style={{ opacity: 0.8 }}>intu</span>mind
          </Text>
          <Text
            variant="body-default-s"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Lade Teamfotos im Admin-Bereich hoch
          </Text>
        </Flex>

        {/* Quote-Karte auch ohne Fotos anzeigen */}
        <Flex
          radius="l"
          padding="l"
          horizontal="center"
          vertical="center"
          fillWidth
          className="quote-card"
          style={{
            backgroundImage: "url('/quote-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "100px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            flexShrink: 0,
          }}
        >
          <Flex
            direction="column"
            horizontal="center"
            className="quote-fade"
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "32rem",
              opacity: quoteVisible ? 1 : 0,
            }}
          >
            <Text
              variant="heading-strong-s"
              style={{
                color: "#27313F",
                fontFamily: "var(--font-heading)",
                fontSize: "1.15rem",
                fontWeight: 700,
                lineHeight: 1.625,
                textAlign: "center",
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </Text>
            {quote.author && (
              <Text
                variant="body-default-s"
                style={{
                  color: "#505359",
                  marginTop: "0.5rem",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                — {quote.author}
              </Text>
            )}
          </Flex>
        </Flex>
      </div>
    );
  }

  // Hilfsfunktion: Duo-Layout rendern (auch als Trio-Fallback verwendet)
  const renderDuo = (
    containerStyle: React.CSSProperties,
    first: { index: number; rotation: number; style: React.CSSProperties },
    second: { index: number; rotation: number; style: React.CSSProperties },
  ) => (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", ...containerStyle }}>
      <Polaroid url={photos[second.index].url} alt={photos[second.index].originalName} rotation={second.rotation} style={{ position: "absolute", ...second.style }} />
      <Polaroid url={photos[first.index].url} alt={photos[first.index].originalName} rotation={first.rotation} style={{ position: "absolute", ...first.style }} />
    </div>
  );

  // Hilfsfunktion: Trio-Layout rendern
  const renderTrio = (
    containerStyle: React.CSSProperties,
    slots: Array<{ index: number; rotation: number; style: React.CSSProperties }>,
  ) => (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", ...containerStyle }}>
      {slots.map((slot, i) => (
        <Polaroid key={i} url={photos[slot.index].url} alt={photos[slot.index].originalName} rotation={slot.rotation} style={{ position: "absolute", ...slot.style }} />
      ))}
    </div>
  );

  const renderLayout = () => {
    if (photos.length < 2) {
      return (
        <Polaroid url={photos[currentIndex].url} alt={photos[currentIndex].originalName} rotation={-1} style={{ width: "75%", height: "82%" }} />
      );
    }

    // Effektives Layout: Bei Trio-Layouts mit < 3 Fotos auf Duo-Overlap zurückfallen
    const isTrio = currentLayout === "trio-fan" || currentLayout === "trio-stack";
    const effectiveLayout = (isTrio && photos.length < 3) ? "duo-overlap" : currentLayout;

    switch (effectiveLayout) {
      case "duo-overlap":
        return renderDuo(
          { width: "90%", height: "90%" },
          { index: currentIndex, rotation: -3, style: { width: "52%", height: "60%", left: "8%", top: "5%", zIndex: 2 } },
          { index: secondIndex, rotation: 5, style: { width: "52%", height: "60%", right: "3%", bottom: "5%", zIndex: 1 } },
        );

      case "duo-spread":
        return renderDuo(
          { width: "92%", height: "90%" },
          { index: currentIndex, rotation: -2, style: { width: "48%", height: "60%", left: "2%", bottom: "5%", zIndex: 2 } },
          { index: secondIndex, rotation: 3, style: { width: "48%", height: "60%", right: "2%", top: "5%", zIndex: 1 } },
        );

      case "trio-fan":
        return renderTrio(
          { width: "95%", height: "92%" },
          [
            { index: currentIndex, rotation: -6, style: { width: "40%", height: "55%", left: "2%", bottom: "10%", zIndex: 1 } },
            { index: secondIndex, rotation: 1, style: { width: "42%", height: "58%", left: "29%", top: "5%", zIndex: 3 } },
            { index: thirdIndex, rotation: 5, style: { width: "40%", height: "55%", right: "2%", bottom: "8%", zIndex: 2 } },
          ],
        );

      case "trio-stack":
        return renderTrio(
          { width: "95%", height: "92%" },
          [
            { index: thirdIndex, rotation: 7, style: { width: "42%", height: "55%", right: "5%", bottom: "3%", zIndex: 1 } },
            { index: secondIndex, rotation: -4, style: { width: "42%", height: "55%", left: "5%", top: "3%", zIndex: 2 } },
            { index: currentIndex, rotation: 1.5, style: { width: "44%", height: "58%", left: "28%", top: "12%", zIndex: 3 } },
          ],
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "16px", boxSizing: "border-box", gap: "16px" }}>
      {/* Foto-Bereich */}
      <div className="slideshow-photos" style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <div
          className="slideshow-image"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isVisible ? 1 : 0,
          }}
        >
          {renderLayout()}
        </div>

        {/* Dezenter Foto-Counter */}
        <Text
          variant="label-default-s"
          style={{
            position: "absolute",
            bottom: "6px",
            right: "6px",
            color: "rgba(178, 189, 209, 0.5)",
            fontSize: "0.65rem",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          {currentIndex + 1} / {photos.length}
        </Text>
      </div>

      {/* Quote-Karte am unteren Rand – Original-Styling mit Hintergrundbild */}
      <Flex
        radius="l"
        padding="l"
        horizontal="center"
        vertical="center"
        fillWidth
        className="quote-card"
        style={{
          backgroundImage: "url('/quote-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        <Flex
          direction="column"
          horizontal="center"
          className="quote-fade"
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "32rem",
            opacity: quoteVisible ? 1 : 0,
          }}
        >
          <Text
            variant="heading-strong-s"
            className="quote-text"
            style={{
              color: "#27313F",
              fontFamily: "var(--font-heading)",
              fontSize: "1.15rem",
              fontWeight: 700,
              lineHeight: 1.625,
              textAlign: "center",
            }}
          >
            &ldquo;{quote.text}&rdquo;
          </Text>
          {quote.author && (
            <Text
              variant="body-default-s"
              style={{
                color: "#505359",
                marginTop: "0.5rem",
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              — {quote.author}
            </Text>
          )}
        </Flex>
      </Flex>
    </div>
  );
}
