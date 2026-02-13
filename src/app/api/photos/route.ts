import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const SIGNED_URL_EXPIRES = 3600; // 1 Stunde (Slideshow refresht alle 60s)
const DEFAULT_PAGE_SIZE = 50;

// GET: Liste aller Fotos mit Signed URLs
// Optionale Pagination: ?page=1&limit=50 (ohne Parameter werden alle zurückgegeben)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let query = supabaseAdmin
      .from("photos")
      .select("*", { count: "exact" })
      .order("uploaded_at", { ascending: true });

    let totalCount: number | null = null;

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(limitParam || "", 10) || DEFAULT_PAGE_SIZE));
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data: photos, error, count } = await query;
    totalCount = count;

    if (error) {
      console.error("Photos DB Fehler:", error.message);
      return NextResponse.json([]);
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json(pageParam ? { photos: [], total: totalCount ?? 0 } : []);
    }

    // Signed URLs für alle Fotos auf einmal generieren
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const { data: signedUrlData } = await supabaseAdmin.storage
          .from("photos")
          .createSignedUrl(photo.filename, SIGNED_URL_EXPIRES);

        return {
          id: photo.id,
          filename: photo.filename,
          originalName: photo.original_name,
          uploadedAt: photo.uploaded_at,
          sortOrder: photo.sort_order,
          url: signedUrlData?.signedUrl || "",
        };
      })
    );

    // Mit Pagination: Objekt mit total zurückgeben; ohne: Array (abwärtskompatibel)
    if (pageParam) {
      return NextResponse.json({ photos: photosWithUrls, total: totalCount ?? photosWithUrls.length });
    }
    return NextResponse.json(photosWithUrls);
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

    // In Supabase Storage hochladen
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from("photos")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage Upload Fehler:", uploadError.message);
      return NextResponse.json(
        { error: "Upload fehlgeschlagen" },
        { status: 500 }
      );
    }

    // Metadaten in DB speichern
    const { error: dbError } = await supabaseAdmin
      .from("photos")
      .insert({
        id,
        filename,
        original_name: file.name,
        uploaded_by: auth.email || null,
      });

    if (dbError) {
      // Storage-Datei wieder löschen bei DB-Fehler
      await supabaseAdmin.storage.from("photos").remove([filename]);
      console.error("Photos DB Insert Fehler:", dbError.message);
      return NextResponse.json(
        { error: "Upload fehlgeschlagen" },
        { status: 500 }
      );
    }

    // Signed URL für Response generieren
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("photos")
      .createSignedUrl(filename, SIGNED_URL_EXPIRES);

    return NextResponse.json({
      id,
      filename,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      url: signedUrlData?.signedUrl || "",
    });
  } catch {
    return NextResponse.json(
      { error: "Upload fehlgeschlagen" },
      { status: 500 }
    );
  }
}
