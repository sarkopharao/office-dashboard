"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Flex } from "@once-ui-system/core";
import Clock from "./Clock";
import { createClient } from "@/lib/supabase/client";
import { isAdminClient } from "@/lib/auth-utils";
import { useLogout } from "@/hooks/useLogout";

interface UserState {
  loggedIn: boolean;
  isAdmin: boolean;
}

export default function Header() {
  const [user, setUser] = useState<UserState | null>(null);
  const { loggingOut, handleLogout } = useLogout();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();

        if (supabaseUser?.email) {
          setUser({
            loggedIn: true,
            isAdmin: isAdminClient(supabaseUser.email),
          });
          return;
        }
      } catch {
        // Supabase nicht verfügbar
      }

      // Legacy-Cookie prüfen
      if (document.cookie.includes("admin_token=")) {
        setUser({ loggedIn: true, isAdmin: true });
        return;
      }

      setUser({ loggedIn: false, isAdmin: false });
    };

    checkUser();
  }, []);

  return (
    <Flex
      as="header"
      horizontal="between"
      vertical="center"
      paddingX="l"
      paddingY="m"
      style={{ background: "#27313F" }}
    >
      {/* Links: Logo */}
      <Flex vertical="center" style={{ flex: 1 }}>
        <Image
          className="header-logo"
          src="/intumind-design/intumind-logo-laenglich-white.png"
          alt="intumind"
          width={160}
          height={40}
          priority
        />
      </Flex>

      {/* Mitte: Uhr + Datum */}
      <div className="header-clock">
        <Clock />
      </div>

      {/* Rechts: Buttons */}
      <Flex vertical="center" gap="8" className="header-buttons" style={{ flex: 1, justifyContent: "flex-end" }}>
        {user?.loggedIn && (
          <>
            <a
              href="/fotos"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(0, 147, 153, 0.15)",
                color: "#009399",
                padding: "0.4rem 1rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                textDecoration: "none",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "0.8rem" }}>📸</span>
              Teamfotos
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(178, 189, 209, 0.12)",
                border: "1px solid rgba(178, 189, 209, 0.2)",
                color: "#B2BDD1",
                cursor: loggingOut ? "wait" : "pointer",
                fontFamily: "var(--font-body), sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.4rem 1rem",
                borderRadius: "9999px",
                transition: "background 0.2s, color 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "0.8rem" }}>👋</span>
              Abmelden
            </button>
          </>
        )}
      </Flex>
    </Flex>
  );
}
