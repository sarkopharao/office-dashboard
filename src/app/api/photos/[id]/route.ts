import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    // Foto-Metadaten aus DB holen (für Dateinamen)
    const { data: photo, error: fetchError } = await supabaseAdmin
      .from("photos")
      .select("filename")
      .eq("id", id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: "Foto nicht gefunden" }, { status: 404 });
    }

    // Datei aus Supabase Storage löschen
    const { error: storageError } = await supabaseAdmin.storage
      .from("photos")
      .remove([photo.filename]);

    if (storageError) {
      console.error("Storage Delete Fehler:", storageError.message);
    }

    // Metadaten aus DB löschen
    const { error: dbError } = await supabaseAdmin
      .from("photos")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Photos DB Delete Fehler:", dbError.message);
      return NextResponse.json(
        { error: "Löschen fehlgeschlagen" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
