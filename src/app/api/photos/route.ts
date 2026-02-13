import { NextRequest, NextResponse } from "next/server";
import { readdir, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// GET: Liste aller Fotos
export async function GET() {
  try {
    if (!existsSync(UPLOADS_DIR)) {
      return NextResponse.json([]);
    }

    const files = await readdir(UPLOADS_DIR);
    const photos = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map((filename, index) => ({
        id: filename.replace(/\.[^.]+$/, ""),
        filename,
        originalName: filename,
        uploadedAt: new Date().toISOString(),
        sortOrder: index,
      }));

    return NextResponse.json(photos);
  } catch {
    return NextResponse.json([]);
  }
}

// POST: Foto hochladen (jeder eingeloggte @intumind.de Mitarbeiter)
export async function POST(request: NextRequest) {
  try {
    // Dual-Auth: Supabase ODER Legacy-Cookie
    const { checkAuth } = await import("@/lib/auth");
    const auth = await checkAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Nur JPG, PNG und WEBP erlaubt" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Datei zu groß (max. 10 MB)" },
        { status: 400 }
      );
    }

    // Sicheren Dateinamen generieren
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const id = crypto.randomUUID();
    const filename = `${id}.${ext}`;

    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOADS_DIR, filename), buffer);

    return NextResponse.json({
      id,
      filename,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Upload fehlgeschlagen" },
      { status: 500 }
    );
  }
}
