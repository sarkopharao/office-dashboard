"use client";

import { useState, useEffect } from "react";
import { MOTIVATIONAL_QUOTES, QUOTE_INTERVAL } from "@/lib/constants";

export function useRotatingQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);

  useEffect(() => {
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

  return {
    quote: MOTIVATIONAL_QUOTES[quoteIndex],
    quoteVisible,
  };
}
