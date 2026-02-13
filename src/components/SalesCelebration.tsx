"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { initAudio, playRocketWhoosh, playExplosionPop, playCelebration, cleanupAudio } from "@/lib/sounds";

/**
 * Verschiedene Flugbahnen für mehrere gleichzeitige Raketen.
 * Jede Bahn definiert Start-/Endpunkt und Kontrollpunkt für die Bézier-Kurve.
 */
const FLIGHT_PATHS = [
  // Klassisch: links unten → rechts oben (Mitte des Slideshow-Bereichs)
  {
    startX: 0.05,
    startY: 0.95,
    endX: 0.72,
    endY: 0.25,
    controlX: 0.35,
    controlY: 0.15,
  },
  // Steiler Bogen: links unten → rechts oben (höher)
  {
    startX: 0.08,
    startY: 0.92,
    endX: 0.82,
    endY: 0.15,
    controlX: 0.25,
    controlY: 0.05,
  },
  // Flacher Bogen: links unten → rechts Mitte
  {
    startX: 0.03,
    startY: 0.98,
    endX: 0.9,
    endY: 0.35,
    controlX: 0.45,
    controlY: 0.25,
  },
  // Mittlerer Bogen: links Mitte → rechts oben
  {
    startX: 0.1,
    startY: 0.88,
    endX: 0.65,
    endY: 0.12,
    controlX: 0.2,
    controlY: 0.1,
  },
  // Extra-Bogen: ganz links → rechts Mitte-oben
  {
    startX: 0.02,
    startY: 0.9,
    endX: 0.78,
    endY: 0.2,
    controlX: 0.3,
    controlY: 0.0,
  },
];

/** Quadratische Bézier-Kurve: Position zum Zeitpunkt t (0..1) */
function bezier(
  t: number,
  start: number,
  control: number,
  end: number
): number {
  const u = 1 - t;
  return u * u * start + 2 * u * t * control + t * t * end;
}

/** Winkel der Tangente zum Zeitpunkt t (für Raketen-Rotation) */
function bezierAngle(
  t: number,
  startX: number,
  controlX: number,
  endX: number,
  startY: number,
  controlY: number,
  endY: number
): number {
  const dx = 2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX);
  const dy = 2 * (1 - t) * (controlY - startY) + 2 * t * (endY - controlY);
  return Math.atan2(dy, dx);
}

/**
 * Looping-Parameter: Ein Kreis wird auf die Bézier-Kurve aufaddiert.
 * loopCenter: t-Wert auf der Kurve wo der Looping stattfindet (0.3–0.6)
 * loopRadius: Radius in Viewport-Einheiten (0.04–0.08)
 * loopDirection: 1 = im Uhrzeigersinn, -1 = gegen
 */
interface LoopConfig {
  loopCenter: number;
  loopRadius: number;
  loopDirection: 1 | -1;
}

interface RocketState {
  id: number;
  pathIndex: number;
  progress: number; // 0..1
  exploded: boolean;
  hasLoop: boolean;
  loop?: LoopConfig;
  soundPlayed: boolean; // Whoosh-Sound schon gestartet?
}

interface SalesCelebrationProps {
  /** Anzahl neuer Bestellungen (löst Animation aus wenn > 0) */
  newOrderCount: number;
  /** Callback wenn Animation fertig */
  onAnimationComplete?: () => void;
}

export default function SalesCelebration({
  newOrderCount,
  onAnimationComplete,
}: SalesCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketsRef = useRef<RocketState[]>([]);
  const animFrameRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  const fireConfettiAt = useCallback((x: number, y: number) => {
    // Hauptexplosion – langsam schwebend wie Federn
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { x, y },
      colors: ["#009399", "#00a8af", "#2cc4ca", "#FFD700", "#FF6B6B", "#73A942"],
      startVelocity: 25,
      gravity: 0.3,
      ticks: 400,
      scalar: 1.3,
      drift: 0.5,
      shapes: ["circle", "square"],
      zIndex: 100000,
    });

    // Zweite Welle – noch langsamer, federn-artig
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 120,
        origin: { x, y },
        colors: ["#009399", "#FFD700", "#FF6B6B", "#ECB31B", "#ffffff"],
        startVelocity: 15,
        gravity: 0.2,
        ticks: 500,
        scalar: 1.0,
        drift: -0.5,
        shapes: ["circle", "square"],
        zIndex: 100000,
      });
    }, 200);

    // Dritte Welle – ganz feine Partikel die besonders lang schweben
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 160,
        origin: { x, y: y - 0.05 },
        colors: ["#2cc4ca", "#FFD700", "#ffffff", "#73A942"],
        startVelocity: 10,
        gravity: 0.15,
        ticks: 600,
        scalar: 0.8,
        drift: 0.8,
        shapes: ["circle"],
        zIndex: 100000,
      });
    }, 400);
  }, []);

  const launchRockets = useCallback(
    (count: number) => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      // Raketen mit unterschiedlichen Flugbahnen erstellen
      const rockets: RocketState[] = [];
      for (let i = 0; i < count; i++) {
        // ~40% Chance auf Looping
        const hasLoop = Math.random() < 0.4;
        rockets.push({
          id: i,
          pathIndex: i % FLIGHT_PATHS.length,
          progress: -i * 0.35, // Deutlich versetzter Start
          exploded: false,
          soundPlayed: false,
          hasLoop,
          loop: hasLoop
            ? {
                loopCenter: 0.35 + Math.random() * 0.2, // Looping bei t=0.35–0.55
                loopRadius: 0.10 + Math.random() * 0.06, // Radius 10–16% Viewport
                loopDirection: Math.random() < 0.5 ? 1 : -1,
              }
            : undefined,
        });
      }
      rocketsRef.current = rockets;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Canvas-Größe an Viewport anpassen (mit devicePixelRatio für Schärfe)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);

      const FLIGHT_DURATION = 240; // Frames (ca. 4 Sekunden bei 60fps)
      const ROCKET_SIZE = 72;

      function animate() {
        if (!ctx || !canvas) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        let allDone = true;

        for (const rocket of rocketsRef.current) {
          if (rocket.exploded) continue;
          allDone = false;

          // Fortschritt aktualisieren
          rocket.progress += 1 / FLIGHT_DURATION;

          // Noch nicht gestartet (Staffelung)
          if (rocket.progress < 0) continue;

          // Whoosh-Sound beim Start der Rakete (einmalig)
          if (!rocket.soundPlayed) {
            rocket.soundPlayed = true;
            playRocketWhoosh(FLIGHT_DURATION / 60); // Dauer in Sekunden
          }

          const t = Math.min(rocket.progress, 1);
          const path = FLIGHT_PATHS[rocket.pathIndex];

          // Basis-Position auf der Bézier-Kurve
          let x = bezier(t, path.startX, path.controlX, path.endX);
          let y = bezier(t, path.startY, path.controlY, path.endY);

          // Basis-Winkel (Tangente der Bézier-Kurve)
          let angle = bezierAngle(
            t,
            path.startX,
            path.controlX,
            path.endX,
            path.startY,
            path.controlY,
            path.endY
          );

          // Looping-Offset berechnen
          if (rocket.hasLoop && rocket.loop) {
            const { loopCenter, loopRadius, loopDirection } = rocket.loop;
            const loopWidth = 0.25; // t-Bereich in dem der Looping stattfindet (größer = flüssiger)
            const loopStart = loopCenter - loopWidth / 2;
            const loopEnd = loopCenter + loopWidth / 2;

            if (t >= loopStart && t <= loopEnd) {
              // Wie weit sind wir im Looping? (0..1)
              const loopT = (t - loopStart) / loopWidth;
              // Voller Kreis: 0 → 2*PI
              const loopAngle = loopT * 2 * Math.PI * loopDirection;

              // Offset senkrecht zur Flugrichtung
              // Kreis-Mittelpunkt ist "oben" relativ zur Flugrichtung
              const perpAngle = angle - Math.PI / 2 * loopDirection;
              const cx = Math.cos(perpAngle) * loopRadius;
              const cy = Math.sin(perpAngle) * loopRadius;

              // Position auf dem Kreis (relativ zum Mittelpunkt)
              // Start: unten am Kreis (= auf der Bézier-Kurve)
              const offsetX = cx - Math.cos(perpAngle + loopAngle) * loopRadius;
              const offsetY = cy - Math.sin(perpAngle + loopAngle) * loopRadius;

              x += offsetX;
              y += offsetY;

              // Winkel anpassen: Basis-Winkel + Looping-Drehung
              angle += loopAngle;
            }
          }

          // Pixel-Koordinaten
          const px = x * w;
          const py = y * h;

          if (t >= 1) {
            // Explosion!
            rocket.exploded = true;
            fireConfettiAt(x, y);
            playExplosionPop();
            continue;
          }

          // Rakete zeichnen (Emoji)
          // Das 🚀 Emoji zeigt nativ nach rechts-oben (~45° über X-Achse = -PI/4 in Canvas)
          const EMOJI_BASE_ANGLE = -Math.PI / 4;
          const emojiRotation = angle - EMOJI_BASE_ANGLE;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(emojiRotation);
          ctx.font = `${ROCKET_SIZE}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("\u{1F680}", 0, 0);

          // Feuerschweif (in absoluten Koordinaten)
          ctx.rotate(-emojiRotation);
          const trailAngle = angle + Math.PI; // Entgegengesetzt zur Flugrichtung
          const trailLen = 50 + Math.random() * 25;

          for (let j = 0; j < 9; j++) {
            const tOff = (j + 1) * 0.12;
            const tx = px + Math.cos(trailAngle + (Math.random() - 0.5) * 0.4) * trailLen * tOff;
            const ty = py + Math.sin(trailAngle + (Math.random() - 0.5) * 0.4) * trailLen * tOff;
            const size = (9 - j) * 1.8;
            const alpha = (1 - tOff) * 0.8;

            ctx.beginPath();
            ctx.arc(tx, ty, size, 0, Math.PI * 2);
            ctx.fillStyle = j < 3
              ? `rgba(255, 200, 50, ${alpha})`
              : `rgba(255, 100, 50, ${alpha * 0.6})`;
            ctx.fill();
          }

          ctx.restore();
        }

        if (allDone) {
          // Animation fertig – Canvas leeren
          ctx.clearRect(0, 0, w, h);
          isAnimatingRef.current = false;
          rocketsRef.current = [];

          // Sieges-Fanfare + Jubel abspielen
          playCelebration();

          onAnimationComplete?.();
          return;
        }

        animFrameRef.current = requestAnimationFrame(animate);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [fireConfettiAt, onAnimationComplete]
  );

  // Portal-Mount erkennen (brauchen document.body) + Audio vorab initialisieren
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // AudioContext sofort initialisieren damit er beim ersten Sound bereit ist
    initAudio();
  }, []);

  // Neue Bestellungen erkennen und Raketen starten
  // Muss nach mounted sein, damit canvasRef existiert
  useEffect(() => {
    if (newOrderCount > 0 && mounted) {
      // Kleiner Delay damit das Canvas-Element nach dem Portal-Render bereit ist
      const timer = setTimeout(() => {
        launchRockets(newOrderCount);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [newOrderCount, mounted, launchRockets]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      cleanupAudio();
    };
  }, []);

  // Canvas via Portal direkt an document.body rendern,
  // damit es außerhalb aller Stacking Contexts liegt
  // und über den Polaroid-Fotos angezeigt wird.
  if (!mounted) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 99999,
      }}
    />,
    document.body
  );
}
