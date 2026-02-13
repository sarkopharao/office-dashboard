import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "data", "sales-cache.json");

export async function GET() {
  try {
    // Versuche gecachte Daten zu lesen
    if (existsSync(CACHE_FILE)) {
      const data = await readFile(CACHE_FILE, "utf-8");
      const salesData = JSON.parse(data);
      return NextResponse.json(salesData);
    }
  } catch {
    // Kein Cache vorhanden
  }

  // Kein Cache: 204 No Content → SalesGrid zeigt Geldregen-Animation
  // bis der erste Sync frische Daten liefert
  return new NextResponse(null, { status: 204 });
}
