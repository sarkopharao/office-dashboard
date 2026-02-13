"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useLogout() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* Supabase nicht verfügbar */ }
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  }, []);

  return { loggingOut, handleLogout };
}
