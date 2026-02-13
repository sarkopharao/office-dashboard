import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSignedToken } from "@/lib/token";

// POST: Admin-Login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin-Passwort nicht konfiguriert" },
        { status: 500 }
      );
    }

    // Timing-safe Vergleich (verhindert Timing-Attacken)
    const passwordBuffer = Buffer.from(String(password));
    const expectedBuffer = Buffer.from(adminPassword);
    const isValid =
      passwordBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, expectedBuffer);

    if (!isValid) {
      return NextResponse.json(
        { error: "Falsches Passwort" },
        { status: 401 }
      );
    }

    const token = createSignedToken();
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: false, // Raspberry Pi läuft auf HTTP
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 Stunden
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Login fehlgeschlagen" },
      { status: 500 }
    );
  }
}

// DELETE: Logout (Supabase + Legacy-Cookie)
export async function DELETE() {
  // Supabase-Session beenden (falls vorhanden)
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase nicht konfiguriert – nur Cookie löschen
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_token");
  return response;
}
