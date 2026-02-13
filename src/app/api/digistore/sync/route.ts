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

/**
 * Berechnet Revenue-Werte aus der History als Fallback,
 * wenn die Digistore24-API down ist und keine aktuellen Daten liefert.
 */
function deriveRevenueFromHistory(history: Record<string, number>) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  let revenueToday = 0;
  let revenueYesterday = 0;
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;

  for (const [day, amount] of Object.entries(history)) {
    if (day === today) revenueToday = amount;
    if (day === yesterday) revenueYesterday = amount;
    if (day.startsWith(thisMonthPrefix)) revenueThisMonth += amount;
    if (day.startsWith(lastMonthPrefix)) revenueLastMonth += amount;
  }

  return { revenueToday, revenueYesterday, revenueThisMonth, revenueLastMonth };
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

    // === FALLBACK: Revenue aus History berechnen wenn API-Daten fehlen ===
    // Wenn die Digistore24 API down ist, kommen alle Revenue-Werte als 0 zurück.
    // In dem Fall nutzen wir die gespeicherten Tagesumsätze aus der History.
    const historyFallback = deriveRevenueFromHistory(history);

    if (salesData.revenueToday === 0 && historyFallback.revenueToday > 0) {
      salesData.revenueToday = historyFallback.revenueToday;
    }
    if (salesData.revenueYesterday === 0 && historyFallback.revenueYesterday > 0) {
      salesData.revenueYesterday = historyFallback.revenueYesterday;
    }
    if (salesData.revenueThisMonth === 0 && historyFallback.revenueThisMonth > 0) {
      salesData.revenueThisMonth = historyFallback.revenueThisMonth;
    }
    if (salesData.revenueLastMonth === 0 && historyFallback.revenueLastMonth > 0) {
      salesData.revenueLastMonth = historyFallback.revenueLastMonth;
    }

    // === SCHUTZ: Alten Cache laden für Fallback-Vergleiche ===
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let oldCache: any = null;
    try {
      const oldRaw = await readFile(CACHE_FILE, "utf-8");
      oldCache = JSON.parse(oldRaw);
    } catch { /* Kein alter Cache vorhanden */ }

    // === SCHUTZ: Orders aus altem Cache bewahren wenn API keine liefert ===
    // Orders können nicht aus History abgeleitet werden (nur Revenue wird gespeichert).
    // Wenn die API 0 Orders zurückgibt, behalten wir die alten Werte.
    if (salesData.ordersToday === 0 && oldCache?.ordersToday > 0) {
      salesData.ordersToday = oldCache.ordersToday;
      salesData.ordersYesterday = oldCache.ordersYesterday;
      salesData.ordersByGroup = oldCache.ordersByGroup;
    }
    if (salesData.totalCustomers === 0 && oldCache?.totalCustomers > 0) {
      salesData.totalCustomers = oldCache.totalCustomers;
    }

    // === SCHUTZ: Alten Cache nicht mit reinen Nullwerten überschreiben ===
    // Wenn sowohl API als auch History keine Revenue-Daten haben, aber der alte Cache
    // welche hat, behalten wir den alten Cache und aktualisieren nur dailyRevenue.
    let usedOldCache = false;
    if (salesData.revenueToday === 0 && salesData.revenueThisMonth === 0) {
      if (oldCache && (oldCache.revenueToday > 0 || oldCache.revenueThisMonth > 0)) {
        // Alten Cache behalten, nur dailyRevenue und fetchedAt aktualisieren
        oldCache.dailyRevenue = salesData.dailyRevenue;
        oldCache.fetchedAt = salesData.fetchedAt;
        await writeFile(CACHE_FILE, JSON.stringify(oldCache, null, 2));
        usedOldCache = true;
      }
    }

    if (!usedOldCache) {
      // Sales-Cache speichern (mit angereicherten dailyRevenue aus History)
      await writeFile(CACHE_FILE, JSON.stringify(salesData, null, 2));
    }

    return NextResponse.json({
      success: true,
      data: salesData,
      message: usedOldCache
        ? "API teilweise nicht erreichbar – Cache mit History-Fallback aktualisiert"
        : "Daten erfolgreich synchronisiert",
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
