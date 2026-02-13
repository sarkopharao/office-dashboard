import { NextResponse } from "next/server";
import { fetchAllSalesData } from "@/lib/digistore";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(DATA_DIR, "sales-cache.json");
const HISTORY_FILE = path.join(DATA_DIR, "revenue-history.json");

/**
 * Liest das Revenue-History-File: { "2026-02-06": 6016.19, ... }
 * Hier werden Tagesumsätze persistent gespeichert, da die Digistore24 API
 * nur die Daten des aktuellen Abrechnungszeitraums zurückgibt.
 */
async function loadHistory(): Promise<Record<string, number>> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Speichert History zurück. Behält maximal 60 Tage.
 */
async function saveHistory(history: Record<string, number>): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const trimmed: Record<string, number> = {};
  for (const [day, amount] of Object.entries(history)) {
    if (day >= cutoffStr) {
      trimmed[day] = amount;
    }
  }

  await writeFile(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
}

export async function POST() {
  try {
    const salesData = await fetchAllSalesData();

    // Daten-Verzeichnis sicherstellen
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    // Revenue-History laden und mit aktuellen API-Daten mergen
    const history = await loadHistory();

    for (const entry of salesData.dailyRevenue) {
      history[entry.day] = entry.amount;
    }

    await saveHistory(history);

    // dailyRevenue aus History aufbauen: die letzten 14 Tage
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const cutoff = fourteenDaysAgo.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    salesData.dailyRevenue = Object.entries(history)
      .filter(([day]) => day >= cutoff && day <= today)
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Sales-Cache speichern (mit angereicherten dailyRevenue aus History)
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
