import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchPurchasesForRange } from "@/lib/digistore";
import type { SalesRangeData } from "@/types";

/**
 * GET /api/digistore/range?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&breakdown=true
 *
 * Liefert Gesamtumsatz + Bestellungen für einen beliebigen Zeitraum.
 * Revenue kommt aus der Supabase revenue_history Tabelle (schnell, kein API-Call).
 * Produktgruppen-Breakdown nur bei breakdown=true (braucht Digistore24 listPurchases).
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

    // Revenue aus Supabase revenue_history summieren
    const { data: historyRows, error: historyError } = await supabaseAdmin
      .from("revenue_history")
      .select("day, amount")
      .gte("day", dateFrom)
      .lte("day", dateTo)
      .order("day", { ascending: true });

    if (historyError) {
      console.error("Revenue History Fehler:", historyError.message);
    }

    let totalRevenue = 0;
    if (historyRows) {
      for (const row of historyRows) {
        totalRevenue += parseFloat(row.amount) || 0;
      }
    }

    // Basis-Ergebnis (ohne Breakdown – schnell)
    const result: SalesRangeData = {
      totalRevenue,
      totalOrders: 0,
      dateFrom,
      dateTo,
      fetchedAt: new Date().toISOString(),
    };

    // Bestellungen zählen: Immer aus den Purchases ableiten
    // (revenue_history hat keine Order-Counts)
    // Für Performance: Ohne Breakdown nur die Gesamtzahl,
    // mit Breakdown auch die Produktgruppen
    if (includeBreakdown) {
      try {
        const { totalOrders, ordersByGroup } = await fetchPurchasesForRange(dateFrom, dateTo);
        result.totalOrders = totalOrders;
        result.ordersByGroup = ordersByGroup;
      } catch (err) {
        console.error("Purchases Range Fehler:", err);
        // Revenue trotzdem zurückgeben, nur ohne Breakdown
      }
    } else {
      // Auch ohne Breakdown die Bestellungen zählen (leichtgewichtig aus Purchases)
      try {
        const { totalOrders } = await fetchPurchasesForRange(dateFrom, dateTo);
        result.totalOrders = totalOrders;
      } catch {
        // Bestellungen auf 0 lassen wenn API nicht erreichbar
      }
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
