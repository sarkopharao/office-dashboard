import { createBrowserClient } from "@supabase/ssr";

/**
 * Erstellt einen Supabase-Client für den Browser (Client Components).
 * Verwendet automatisch Cookie-basiertes Session-Management.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
