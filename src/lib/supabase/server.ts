import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Erstellt einen Supabase-Client für Server-Kontext (API Routes, Server Components).
 * Muss bei jedem Request neu erstellt werden (nicht cachen!).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In Server Components (read-only context) ignorieren
          }
        },
      },
    }
  );
}
