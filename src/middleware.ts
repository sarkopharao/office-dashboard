import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifySignedToken } from "@/lib/token-verify";

/**
 * Middleware für Route-Schutz.
 *
 * - / → geschützt, redirect zu /login wenn nicht eingeloggt
 * - /login → öffentlich, redirect zu / wenn eingeloggt
 * - /fotos → geschützt, redirect zu /login wenn nicht eingeloggt
 * - /auth/callback → öffentlich (Supabase Magic Link)
 * - /api/* → durchlassen (Auth passiert in Route-Handlern)
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Supabase-Client mit Cookie-Handling für Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Session refreshen (wichtig für Token-Erneuerung)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Legacy-Cookie prüfen: existiert UND Signatur ist gültig
  const legacyToken = request.cookies.get("admin_token")?.value;
  const hasValidLegacyCookie = legacyToken ? await verifySignedToken(legacyToken) : false;

  const isLoggedIn = !!user || hasValidLegacyCookie;

  // Geschützte Routen: / und /fotos → redirect zu /login wenn nicht eingeloggt
  if (pathname === "/" || pathname.startsWith("/fotos")) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // /login: wenn bereits eingeloggt → redirect zu Dashboard
  if (pathname === "/login") {
    if (isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match alle Routen AUSSER:
     * - _next/static (statische Dateien)
     * - _next/image (Bild-Optimierung)
     * - favicon.ico
     * - Statische Assets (Bilder, Fonts, etc.)
     * - API-Routes (Auth passiert dort separat)
     * - Auth-Callback (muss öffentlich sein)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|intumind-design|team-photos|quote-bg\\.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api|auth/callback).*)",
  ],
};
