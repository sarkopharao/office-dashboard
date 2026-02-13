import { NextRequest, NextResponse } from "next/server";
import { fetchTransactionsForRange } from "@/lib/digistore";
import type { SalesRangeData } from "@/types";

// listTransactions kann bei großen Zeiträumen bis zu 30s dauern
export const maxDuration = 60;

/**
 * GET /api/digistore/range?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&breakdown=true
 *
 * Liefert Gesamtumsatz + Bestellungen für einen beliebigen Zeitraum.
 * Nutzt die Digistore24 listTransactions API mit `from`/`to` Parametern.
 * Die Summary liefert den Gesamtumsatz direkt (1 API-Call).
 * Produktgruppen-Breakdown nur bei breakdown=true (braucht Paging durch alle Seiten).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const includeBreakdown = searchParams.get("breakdown") === "true";

    // Validierung
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: "dateFrom und dateTo sind erforderlich" },
        { status: 400 },
      );
    }

    if (dateFrom > dateTo) {
      return NextResponse.json(
        { success: false, error: "dateFrom muss vor dateTo liegen" },
        { status: 400 },
      );
    }

    // Daten direkt von Digistore24 listTransactions API holen
    const { totalRevenue, totalOrders, ordersByGroup } =
      await fetchTransactionsForRange(dateFrom, dateTo, includeBreakdown);

    const result: SalesRangeData = {
      totalRevenue,
      totalOrders,
      dateFrom,
      dateTo,
      fetchedAt: new Date().toISOString(),
    };

    if (includeBreakdown && ordersByGroup) {
      result.ordersByGroup = ordersByGroup;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("Range API Fehler:", err);
    return NextResponse.json(
      { success: false, error: "Interner Fehler" },
      { status: 500 },
    );
  }
}
