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
    <div className="px-6 py-4">
      <div
        className={`quote-fade ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <p className="text-intumind-gray italic text-sm leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        {quote.author && (
          <p className="text-intumind-gray-light text-xs mt-1">
            — {quote.author}
          </p>
        )}
      </div>
    </div>
  );
}
