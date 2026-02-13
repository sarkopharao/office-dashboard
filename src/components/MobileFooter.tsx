"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MobileFooter() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  };

  return (
    <div
      className="mobile-footer"
      style={{
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "1.5rem 1.5rem 2rem",
      }}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        <a
          href="/fotos"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#009399",
            color: "#ffffff",
            padding: "0.7rem 1.6rem",
            borderRadius: "9999px",
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(0, 147, 153, 0.3)",
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
            background: "rgba(39, 49, 63, 0.08)",
            border: "1px solid rgba(39, 49, 63, 0.15)",
            color: "#505359",
            cursor: loggingOut ? "wait" : "pointer",
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "0.85rem",
            fontWeight: 600,
            padding: "0.7rem 1.6rem",
            borderRadius: "9999px",
          }}
        >
          <span>👋</span>
          Abmelden
        </button>
      </div>
      <span
        style={{
          color: "#B2BDD1",
          fontSize: "0.7rem",
          fontFamily: "var(--font-body), sans-serif",
          fontWeight: 500,
        }}
      >
        Made with ❤️ by Marc
      </span>
    </div>
  );
}
