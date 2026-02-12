"use client";

import { useState, useEffect, useCallback } from "react";
import { SLIDESHOW_INTERVAL } from "@/lib/constants";
import type { Photo } from "@/types";

export default function Slideshow() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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
    // Foto-Liste alle 60 Sekunden aktualisieren (falls neue Fotos hochgeladen)
    const refreshInterval = setInterval(fetchPhotos, 60000);
    return () => clearInterval(refreshInterval);
  }, [fetchPhotos]);

  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      // Ausblenden
      setIsVisible(false);

      // Nach Fade-Out: nächstes Bild, dann einblenden
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        setIsVisible(true);
      }, 1200);
    }, SLIDESHOW_INTERVAL);

    return () => clearInterval(interval);
  }, [photos.length]);

  // Preload next image
  useEffect(() => {
    if (photos.length <= 1) return;
    const nextIndex = (currentIndex + 1) % photos.length;
    const img = new Image();
    img.src = `/api/photos/${photos[nextIndex].id}/file`;
  }, [currentIndex, photos]);

  if (photos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-intumind-blue to-intumind-blue-dark rounded-2xl m-4">
        <div className="text-intumind-white text-4xl font-bold mb-2">
          <span className="opacity-80">intu</span>mind
        </div>
        <div className="text-intumind-white/60 text-sm">
          Lade Teamfotos im Admin-Bereich hoch
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-2xl m-4">
      <img
        src={`/api/photos/${photos[currentIndex].id}/file`}
        alt={photos[currentIndex].originalName}
        className={`absolute inset-0 w-full h-full object-cover slideshow-image ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Subtle gradient overlay at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
      {/* Photo counter */}
      <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
