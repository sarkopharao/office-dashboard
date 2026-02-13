import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sales_cache")
      .select("data")
      .eq("id", 1)
      .single();

    if (error || !data) {
      // Kein Cache vorhanden → 204 No Content
      // SalesGrid zeigt Geldregen-Animation bis der erste Sync Daten liefert
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(data.data);
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
