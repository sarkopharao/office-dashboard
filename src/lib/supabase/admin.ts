import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin-Client mit Service Role Key.
 * Bypassed RLS – nur server-seitig verwenden (API Routes)!
 * Wird gebraucht für: Storage-Uploads, DB-Schreiboperationen, Signed URLs.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
