import { NextResponse } from "next/server";
import { DUMMY_SALES } from "@/lib/constants";
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
    // Bei Fehler Dummy-Daten zurückgeben
  }

  // Fallback: Dummy-Daten
  return NextResponse.json(DUMMY_SALES);
}
