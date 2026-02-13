"use client";

import { useState, useEffect, useCallback } from "react";
import { Flex, Text } from "@once-ui-system/core";
import { SLIDESHOW_INTERVAL, MOTIVATIONAL_QUOTES, QUOTE_INTERVAL } from "@/lib/constants";
import type { Photo } from "@/types";

// Layout-Varianten: immer 2 oder 3 Fotos
type LayoutVariant =
  | "duo-overlap"        // 2 Fotos überlappend
  | "duo-spread"         // 2 Fotos nebeneinander versetzt
  | "trio-fan"           // 3 Fotos fächerförmig
  | "trio-stack";        // 3 Fotos gestapelt versetzt

const LAYOUT_VARIANTS: LayoutVariant[] = [
  "duo-overlap",
  "trio-fan",
  "duo-spread",
  "trio-stack",
  "duo-overlap",
  "trio-fan",
  "duo-spread",
  "trio-stack",
];


interface PolaroidProps {
  photoId: number;
  alt: string;
  rotation: number;
  style?: React.CSSProperties;
  className?: string;
}

function Polaroid({ photoId, alt, rotation, style: extraStyle, className = "" }: PolaroidProps) {
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
        src={`/api/photos/${photoId}/file`}
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

  // Quote State
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);

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
      const img = new window.Image();
      img.src = `/api/photos/${photos[nextIdx].id}/file`;
    }
  }, [currentIndex, photos]);

  // === Quote-Logik ===
  useEffect(() => {
    // Start mit zufälligem Zitat
    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setQuoteVisible(true);
      }, 800);
    }, QUOTE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const quote = MOTIVATIONAL_QUOTES[quoteIndex];

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

  const renderLayout = () => {
    // Fallback: Wenn weniger als 2 Fotos, einfach eins anzeigen
    if (photos.length < 2) {
      return (
        <Polaroid
          photoId={photos[currentIndex].id}
          alt={photos[currentIndex].originalName}
          rotation={-1}
          style={{ width: "75%", height: "82%" }}
        />
      );
    }

    switch (currentLayout) {
      case "duo-overlap":
        return (
          <div style={{ width: "90%", height: "90%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Hinteres Foto – rechts unten */}
            <Polaroid
              photoId={photos[secondIndex].id}
              alt={photos[secondIndex].originalName}
              rotation={5}
              style={{
                position: "absolute",
                width: "52%",
                height: "60%",
                right: "3%",
                bottom: "5%",
                zIndex: 1,
              }}
            />
            {/* Vorderes Foto – links oben */}
            <Polaroid
              photoId={photos[currentIndex].id}
              alt={photos[currentIndex].originalName}
              rotation={-3}
              style={{
                position: "absolute",
                width: "52%",
                height: "60%",
                left: "8%",
                top: "5%",
                zIndex: 2,
              }}
            />
          </div>
        );

      case "duo-spread":
        return (
          <div style={{ width: "92%", height: "90%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Linkes Foto */}
            <Polaroid
              photoId={photos[currentIndex].id}
              alt={photos[currentIndex].originalName}
              rotation={-2}
              style={{
                position: "absolute",
                width: "48%",
                height: "60%",
                left: "2%",
                bottom: "5%",
                zIndex: 2,
              }}
            />
            {/* Rechtes Foto */}
            <Polaroid
              photoId={photos[secondIndex].id}
              alt={photos[secondIndex].originalName}
              rotation={3}
              style={{
                position: "absolute",
                width: "48%",
                height: "60%",
                right: "2%",
                top: "5%",
                zIndex: 1,
              }}
            />
          </div>
        );

      case "trio-fan":
        if (photos.length < 3) {
          // Fallback auf duo-overlap wenn weniger als 3 Fotos
          return (
            <div style={{ width: "90%", height: "90%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Polaroid
                photoId={photos[secondIndex].id}
                alt={photos[secondIndex].originalName}
                rotation={4}
                style={{ position: "absolute", width: "52%", height: "60%", right: "3%", bottom: "5%", zIndex: 1 }}
              />
              <Polaroid
                photoId={photos[currentIndex].id}
                alt={photos[currentIndex].originalName}
                rotation={-3}
                style={{ position: "absolute", width: "52%", height: "60%", left: "8%", top: "5%", zIndex: 2 }}
              />
            </div>
          );
        }
        return (
          <div style={{ width: "95%", height: "92%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Linkes Foto – hinten links */}
            <Polaroid
              photoId={photos[currentIndex].id}
              alt={photos[currentIndex].originalName}
              rotation={-6}
              style={{
                position: "absolute",
                width: "40%",
                height: "55%",
                left: "2%",
                bottom: "10%",
                zIndex: 1,
              }}
            />
            {/* Mittleres Foto – vorne mittig */}
            <Polaroid
              photoId={photos[secondIndex].id}
              alt={photos[secondIndex].originalName}
              rotation={1}
              style={{
                position: "absolute",
                width: "42%",
                height: "58%",
                left: "29%",
                top: "5%",
                zIndex: 3,
              }}
            />
            {/* Rechtes Foto – hinten rechts */}
            <Polaroid
              photoId={photos[thirdIndex].id}
              alt={photos[thirdIndex].originalName}
              rotation={5}
              style={{
                position: "absolute",
                width: "40%",
                height: "55%",
                right: "2%",
                bottom: "8%",
                zIndex: 2,
              }}
            />
          </div>
        );

      case "trio-stack":
        if (photos.length < 3) {
          return (
            <div style={{ width: "92%", height: "90%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Polaroid
                photoId={photos[currentIndex].id}
                alt={photos[currentIndex].originalName}
                rotation={-2}
                style={{ position: "absolute", width: "48%", height: "60%", left: "2%", bottom: "5%", zIndex: 2 }}
              />
              <Polaroid
                photoId={photos[secondIndex].id}
                alt={photos[secondIndex].originalName}
                rotation={3}
                style={{ position: "absolute", width: "48%", height: "60%", right: "2%", top: "5%", zIndex: 1 }}
              />
            </div>
          );
        }
        return (
          <div style={{ width: "95%", height: "92%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Hinteres Foto – ganz hinten, leicht gedreht */}
            <Polaroid
              photoId={photos[thirdIndex].id}
              alt={photos[thirdIndex].originalName}
              rotation={7}
              style={{
                position: "absolute",
                width: "42%",
                height: "55%",
                right: "5%",
                bottom: "3%",
                zIndex: 1,
              }}
            />
            {/* Mittleres Foto */}
            <Polaroid
              photoId={photos[secondIndex].id}
              alt={photos[secondIndex].originalName}
              rotation={-4}
              style={{
                position: "absolute",
                width: "42%",
                height: "55%",
                left: "5%",
                top: "3%",
                zIndex: 2,
              }}
            />
            {/* Vorderes Foto – mittig, dominant */}
            <Polaroid
              photoId={photos[currentIndex].id}
              alt={photos[currentIndex].originalName}
              rotation={1.5}
              style={{
                position: "absolute",
                width: "44%",
                height: "58%",
                left: "28%",
                top: "12%",
                zIndex: 3,
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "16px", boxSizing: "border-box", gap: "16px" }}>
      {/* Foto-Bereich */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
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
