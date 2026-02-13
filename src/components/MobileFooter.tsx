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
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
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
    </div>
  );
}
