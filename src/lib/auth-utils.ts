/**
 * Client-seitige Auth-Hilfsfunktionen.
 * Kann sicher in Client-Komponenten importiert werden (keine Server-Imports).
 */

export const ALLOWED_DOMAIN = "@intumind.de";

/**
 * Prüft ob eine E-Mail-Adresse zu einem Admin gehört.
 * Liest NEXT_PUBLIC_ADMIN_EMAILS aus der Umgebung.
 */
export function isAdminClient(email: string): boolean {
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
