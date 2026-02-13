/**
 * Edge-kompatible Token-Verifizierung.
 * Verwendet Web Crypto API (verfügbar in Edge Runtime + Node.js).
 *
 * Kann sicher in Middleware, API Routes und Server Components verwendet werden.
 */

/**
 * Konvertiert einen Hex-String in ein Uint8Array.
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Konvertiert ein Uint8Array in einen Hex-String.
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Berechnet HMAC-SHA256 mit der Web Crypto API (Edge-kompatibel).
 */
async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bytesToHex(new Uint8Array(signature));
}

/**
 * Vergleicht zwei Strings in konstanter Zeit (Timing-Attack-sicher).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = hexToBytes(a);
  const bBytes = hexToBytes(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

/**
 * Prüft ob ein signierter Token gültig ist (richtige Signatur + nicht abgelaufen).
 * Edge-kompatibel (verwendet Web Crypto API).
 */
export async function verifySignedToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) return false;
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return false;

    const timestamp = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);
    if (!timestamp || !signature) return false;

    // Signatur prüfen (Web Crypto API, Edge-kompatibel)
    const expectedSignature = await hmacSha256(secret, timestamp);

    if (!timingSafeEqual(signature, expectedSignature)) return false;

    // Ablauf prüfen (24 Stunden)
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000; // 24h in ms
    return tokenAge >= 0 && tokenAge < maxAge;
  } catch {
    return false;
  }
}
