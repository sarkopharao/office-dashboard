import { NextResponse } from "next/server";
import { fetchAllSalesData } from "@/lib/digistore";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SalesData } from "@/types";

/**
 * Liest die Revenue-History aus der Supabase-Tabelle revenue_history.
 * Rückgabe: { "2026-02-06": 6016.19, ... }
 */
async function loadHistory(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from("revenue_history")
    .select("day, amount");

  if (error || !data) return {};

  const history: Record<string, number> = {};
  for (const row of data) {
    history[row.day] = parseFloat(row.amount);
  }
  return history;
}

/**
 * Speichert/aktualisiert Tagesumsätze in revenue_history.
 * Behält maximal 365 Tage (alte Einträge werden gelöscht).
 */
async function saveHistory(history: Record<string, number>): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // Alte Einträge löschen
  await supabaseAdmin
    .from("revenue_history")
    .delete()
    .lt("day", cutoffStr);

  // Aktuelle Einträge upserten (nur die innerhalb der 365 Tage)
  const rows = Object.entries(history)
    .filter(([day]) => day >= cutoffStr)
    .map(([day, amount]) => ({
      day,
      amount,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length > 0) {
    await supabaseAdmin
      .from("revenue_history")
      .upsert(rows, { onConflict: "day" });
  }
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
    let oldCache: SalesData | null = null;
    try {
      const { data } = await supabaseAdmin
        .from("sales_cache")
        .select("data")
        .eq("id", 1)
        .single();
      if (data) oldCache = data.data as SalesData;
    } catch { /* Kein alter Cache vorhanden */ }

    // === SCHUTZ: Orders aus altem Cache bewahren wenn API keine liefert ===
    if (salesData.ordersToday === 0 && oldCache && oldCache.ordersToday > 0) {
      salesData.ordersToday = oldCache.ordersToday;
      salesData.ordersYesterday = oldCache.ordersYesterday;
      salesData.ordersByGroup = oldCache.ordersByGroup;
    }
    if (salesData.totalCustomers === 0 && oldCache && oldCache.totalCustomers > 0) {
      salesData.totalCustomers = oldCache.totalCustomers;
    }

    // === SCHUTZ: Alten Cache nicht mit reinen Nullwerten überschreiben ===
    let usedOldCache = false;
    if (salesData.revenueToday === 0 && salesData.revenueThisMonth === 0) {
      if (oldCache && (oldCache.revenueToday > 0 || oldCache.revenueThisMonth > 0)) {
        // Alten Cache behalten, nur dailyRevenue und fetchedAt aktualisieren
        oldCache.dailyRevenue = salesData.dailyRevenue;
        oldCache.fetchedAt = salesData.fetchedAt;

        await supabaseAdmin
          .from("sales_cache")
          .upsert({ id: 1, data: oldCache, updated_at: new Date().toISOString() });

        usedOldCache = true;
      }
    }

    if (!usedOldCache) {
      // Sales-Cache speichern (mit angereicherten dailyRevenue aus History)
      await supabaseAdmin
        .from("sales_cache")
        .upsert({ id: 1, data: salesData, updated_at: new Date().toISOString() });
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
