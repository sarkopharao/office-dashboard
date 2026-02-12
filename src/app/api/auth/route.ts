import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Falsches Passwort" },
        { status: 401 }
      );
    }

    const token = crypto.randomUUID();
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

// DELETE: Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_token");
  return response;
}
