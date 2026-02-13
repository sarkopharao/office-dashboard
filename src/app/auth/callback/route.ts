import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth Callback: Empfängt den Magic Link Code von Supabase
 * und tauscht ihn gegen eine Session ein.
 *
 * Flow: User klickt Magic Link in E-Mail → Supabase redirected hierher
 * mit ?code=... → wir tauschen den Code gegen eine Session → redirect zu /
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Auth callback Fehler:", error.message);
  }

  // Bei Fehler zurück zur Login-Seite
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
