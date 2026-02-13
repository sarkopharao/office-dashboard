import { createClient } from "@/lib/supabase/server";
import { verifySignedToken } from "@/lib/token-verify";
import { NextRequest } from "next/server";

const ALLOWED_DOMAIN = "@intumind.de";

export interface AuthResult {
  authenticated: boolean;
  email?: string;
  role?: "admin" | "member";
  method?: "supabase" | "password";
}

/**
 * Prüft ob ein User Admin ist (basierend auf ADMIN_EMAILS env var).
 */
function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Prüft Authentifizierung über Supabase ODER Legacy-Passwort-Cookie.
 * Gibt AuthResult mit Rolle zurück.
 *
 * Reihenfolge:
 * 1. Supabase-Session prüfen (Magic Link)
 * 2. Legacy admin_token Cookie prüfen (Passwort-Fallback)
 */
export async function checkAuth(request: NextRequest): Promise<AuthResult> {
  // 1. Supabase-Session prüfen
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      // Domain-Check: nur @intumind.de erlaubt
      if (!user.email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
        return { authenticated: false };
      }

      return {
        authenticated: true,
        email: user.email,
        role: isAdmin(user.email) ? "admin" : "member",
        method: "supabase",
      };
    }
  } catch {
    // Supabase nicht erreichbar oder nicht konfiguriert – Fallback nutzen
  }

  // 2. Legacy admin_token Cookie prüfen (Passwort-Fallback)
  const authCookie = request.cookies.get("admin_token");
  if (authCookie?.value) {
    // Token-Signatur verifizieren (HMAC-basiert, kein DB nötig)
    if (await verifySignedToken(authCookie.value)) {
      return {
        authenticated: true,
        email: undefined,
        role: "admin", // Passwort-Login = immer Admin
        method: "password",
      };
    }
  }

  return { authenticated: false };
}
