import { NextResponse } from "next/server";
import { fetchAllSalesData } from "@/lib/digistore";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "data", "sales-cache.json");

export async function POST() {
  try {
    const salesData = await fetchAllSalesData();

    // Cache in Datei speichern (einfacher als SQLite für diesen Zweck)
    const dataDir = path.join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    await writeFile(CACHE_FILE, JSON.stringify(salesData, null, 2));

    return NextResponse.json({
      success: true,
      data: salesData,
      message: "Daten erfolgreich synchronisiert",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Digistore24 Sync Fehler:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
