import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// GET: Foto-Datei ausliefern
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const files = await readdir(UPLOADS_DIR);
    const file = files.find((f) => f.startsWith(id));

    if (!file) {
      return NextResponse.json({ error: "Foto nicht gefunden" }, { status: 404 });
    }

    const ext = file.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = MIME_TYPES[ext] || "image/jpeg";
    const buffer = await readFile(path.join(UPLOADS_DIR, file));

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Datei nicht gefunden" },
      { status: 404 }
    );
  }
}
