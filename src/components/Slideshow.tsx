"use client";

import { useState, useEffect, useCallback } from "react";
import { Flex, Column, Text } from "@once-ui-system/core";
import { SLIDESHOW_INTERVAL } from "@/lib/constants";
import type { Photo } from "@/types";

// Layout-Varianten für Abwechslung
type LayoutVariant =
  | "single-center"      // 1 Foto mittig
  | "single-tilt-left"   // 1 Foto leicht nach links gedreht
  | "single-tilt-right"  // 1 Foto leicht nach rechts gedreht
  | "duo-overlap"        // 2 Fotos überlappend
  | "duo-spread";        // 2 Fotos nebeneinander versetzt

const LAYOUT_VARIANTS: LayoutVariant[] = [
  "single-center",
  "single-tilt-left",
  "duo-overlap",
  "single-tilt-right",
  "duo-spread",
  "single-center",
  "duo-overlap",
  "single-tilt-left",
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
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setLayoutStep((prev) => {
          const nextStep = prev + 1;
          const nextLayout = LAYOUT_VARIANTS[nextStep % LAYOUT_VARIANTS.length];
          const nextIsDuo = nextLayout === "duo-overlap" || nextLayout === "duo-spread";
          const step = nextIsDuo && photos.length >= 2 ? 2 : 1;
          setCurrentIndex((prevIdx) => (prevIdx + step) % photos.length);
          return nextStep;
        });
        setIsVisible(true);
      }, 1200);
    }, SLIDESHOW_INTERVAL);

    return () => clearInterval(interval);
  }, [photos.length]);

  // Preload nächste Bilder
  useEffect(() => {
    if (photos.length <= 1) return;
    for (let i = 1; i <= 2; i++) {
      const nextIdx = (currentIndex + i) % photos.length;
      const img = new window.Image();
      img.src = `/api/photos/${photos[nextIdx].id}/file`;
    }
  }, [currentIndex, photos]);

  // Zweites Foto-Index für Duo-Layouts
  const secondIndex = (currentIndex + 1) % photos.length;

  if (photos.length === 0) {
    return (
      <Flex
        fillHeight
        direction="column"
        horizontal="center"
        vertical="center"
        radius="l"
        margin="m"
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
    );
  }

  const renderLayout = () => {
    switch (currentLayout) {
      case "single-center":
        return (
          <Polaroid
            photoId={photos[currentIndex].id}
            alt={photos[currentIndex].originalName}
            rotation={-1}
            style={{ width: "75%", height: "82%" }}
          />
        );

      case "single-tilt-left":
        return (
          <Polaroid
            photoId={photos[currentIndex].id}
            alt={photos[currentIndex].originalName}
            rotation={-3}
            style={{ width: "75%", height: "82%" }}
          />
        );

      case "single-tilt-right":
        return (
          <Polaroid
            photoId={photos[currentIndex].id}
            alt={photos[currentIndex].originalName}
            rotation={2.5}
            style={{ width: "75%", height: "82%" }}
          />
        );

      case "duo-overlap":
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
        return (
          <div style={{ width: "85%", height: "85%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Hinteres Foto – rechts unten */}
            <Polaroid
              photoId={photos[secondIndex].id}
              alt={photos[secondIndex].originalName}
              rotation={5}
              style={{
                position: "absolute",
                width: "48%",
                height: "55%",
                right: "5%",
                bottom: "8%",
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
                width: "48%",
                height: "55%",
                left: "10%",
                top: "8%",
                zIndex: 2,
              }}
            />
          </div>
        );

      case "duo-spread":
        if (photos.length < 2) {
          return (
            <Polaroid
              photoId={photos[currentIndex].id}
              alt={photos[currentIndex].originalName}
              rotation={2}
              style={{ width: "75%", height: "82%" }}
            />
          );
        }
        return (
          <div style={{ width: "90%", height: "85%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Linkes Foto – unten */}
            <Polaroid
              photoId={photos[currentIndex].id}
              alt={photos[currentIndex].originalName}
              rotation={-2}
              style={{
                position: "absolute",
                width: "45%",
                height: "55%",
                left: "5%",
                bottom: "8%",
                zIndex: 2,
              }}
            />
            {/* Rechtes Foto – oben */}
            <Polaroid
              photoId={photos[secondIndex].id}
              alt={photos[secondIndex].originalName}
              rotation={3}
              style={{
                position: "absolute",
                width: "45%",
                height: "55%",
                right: "5%",
                top: "8%",
                zIndex: 1,
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", boxSizing: "border-box" }}>
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
          bottom: "12px",
          right: "12px",
          color: "#8C919C",
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(4px)",
          padding: "2px 8px",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        {currentIndex + 1} / {photos.length}
      </Text>
    </div>
  );
}
