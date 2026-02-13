"use client";

import { useState, useEffect } from "react";
import { Flex, Text } from "@once-ui-system/core";
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
    <div style={{ padding: "0 24px 16px 24px" }}>
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
          minHeight: "120px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Flex
          direction="column"
          horizontal="center"
          className="quote-fade"
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "28rem",
            opacity: isVisible ? 1 : 0,
          }}
        >
          <Text
            variant="heading-strong-s"
            style={{
              color: "#27313F",
              fontFamily: "var(--font-heading)",
              fontSize: "1.25rem",
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
                marginTop: "0.75rem",
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
