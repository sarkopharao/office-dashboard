import { NextRequest, NextResponse } from "next/server";
import { unlink, readdir } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// DELETE: Foto löschen (nur Admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Dual-Auth + Admin-Rolle erforderlich
    const { checkAuth } = await import("@/lib/auth");
    const auth = await checkAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Keine Berechtigung – nur Admins können Fotos löschen" }, { status: 403 });
    }

    const { id } = await params;
    const files = await readdir(UPLOADS_DIR);
    const file = files.find((f) => f.startsWith(id));

    if (!file) {
      return NextResponse.json({ error: "Foto nicht gefunden" }, { status: 404 });
    }

    await unlink(path.join(UPLOADS_DIR, file));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
