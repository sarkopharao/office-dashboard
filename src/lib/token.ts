import crypto from "crypto";

/**
 * Erzeugt einen signierten Token (HMAC-basiert, kein DB nötig).
 * Format: {timestamp}.{signature}
 * Der Token ist 24h gültig und mit ADMIN_PASSWORD als Secret signiert.
 *
 * WICHTIG: Nur in Node.js-Kontext verwenden (API Routes), NICHT in Edge/Middleware.
 */
export function createSignedToken(): string {
  const secret = process.env.ADMIN_PASSWORD || "fallback-secret";
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}
