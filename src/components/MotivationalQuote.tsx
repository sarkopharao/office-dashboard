"use client";

import { useState, useEffect } from "react";
import { MOTIVATIONAL_QUOTES, QUOTE_INTERVAL } from "@/lib/constants";

export default function MotivationalQuote() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start mit zufälligem Zitat
    setCurrentIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex(
          (prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length
        );
        setIsVisible(true);
      }, 800);
    }, QUOTE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const quote = MOTIVATIONAL_QUOTES[currentIndex];

  return (
    <div className="px-6 py-5">
      <div
        className="rounded-2xl shadow-sm p-10 relative overflow-hidden min-h-[140px] flex items-center justify-center"
        style={{
          backgroundImage: "url('/quote-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className={`quote-fade relative z-10 max-w-md ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-heading text-intumind-heading text-xl font-bold leading-relaxed text-center">
            &ldquo;{quote.text}&rdquo;
          </p>
          {quote.author && (
            <p className="text-sm mt-3 text-center font-medium" style={{ color: "#505359" }}>
              — {quote.author}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
