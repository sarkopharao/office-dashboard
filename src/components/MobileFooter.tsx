"use client";

import { useState, useEffect } from "react";
import { Flex } from "@once-ui-system/core";
import { createClient } from "@/lib/supabase/client";

export default function MobileFooter() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) { setLoggedIn(true); return; }
      } catch { /* ignore */ }
      if (document.cookie.includes("admin_token=")) { setLoggedIn(true); return; }
      setLoggedIn(false);
    };
    check();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  };

  if (!loggedIn) return null;

  return (
    <Flex
      horizontal="center"
      vertical="center"
      gap="12"
      className="mobile-footer"
      style={{
        display: "none",
        padding: "1rem 1.5rem 2rem",
      }}
    >
      <a
        href="/fotos"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(0, 147, 153, 0.1)",
          color: "#009399",
          padding: "0.6rem 1.4rem",
          borderRadius: "9999px",
          fontSize: "0.85rem",
          fontWeight: 600,
          textDecoration: "none",
          border: "1px solid rgba(0, 147, 153, 0.2)",
        }}
      >
        <span>📸</span>
        Teamfotos
      </a>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(178, 189, 209, 0.1)",
          border: "1px solid rgba(178, 189, 209, 0.25)",
          color: "#8C919C",
          cursor: loggingOut ? "wait" : "pointer",
          fontFamily: "var(--font-body), sans-serif",
          fontSize: "0.85rem",
          fontWeight: 600,
          padding: "0.6rem 1.4rem",
          borderRadius: "9999px",
        }}
      >
        <span>👋</span>
        Abmelden
      </button>
    </Flex>
  );
}
