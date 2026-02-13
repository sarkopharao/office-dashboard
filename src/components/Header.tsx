"use client";

import Image from "next/image";
import { Flex, Text } from "@once-ui-system/core";
import Clock from "./Clock";

export default function Header() {
  return (
    <Flex
      as="header"
      horizontal="between"
      vertical="center"
      paddingX="l"
      paddingY="m"
      style={{ background: "#27313F" }}
    >
      <Flex vertical="center" gap="m">
        <Image
          src="/intumind-design/intumind-logo-laenglich-white.png"
          alt="intumind"
          width={160}
          height={40}
          priority
        />
      </Flex>
      <Text
        variant="label-strong-s"
        style={{
          color: "#B2BDD1",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "var(--font-heading)",
        }}
      >
        Office Dashboard
      </Text>
      <Clock />
    </Flex>
  );
}
