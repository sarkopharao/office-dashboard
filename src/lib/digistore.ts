import type { SalesData, ProductGroupOrders, DailyRevenue } from "@/types";

const BASE_URL = "https://www.digistore24.com/api/call";
const API_TIMEOUT = 10000; // 10 Sekunden Timeout für API-Calls

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiCall(endpoint: string, method: "GET" | "POST" = "GET"): Promise<any> {
  const apiKey = process.env.DIGISTORE_API_KEY;

  if (!apiKey || apiKey === "dein-api-key-hier") {
    throw new Error("DIGISTORE_API_KEY nicht konfiguriert");
  }

  const url = `${BASE_URL}/${endpoint}?language=de`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-DS-API-KEY": apiKey,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Digistore24 API Fehler: ${res.status}`);
    }

    const data = await res.json();

    if (data.result === "error") {
      throw new Error(`Digistore24: ${data.message || "Unbekannter Fehler"}`);
    }

    return data.data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Digistore24 API Timeout: ${endpoint} nach ${API_TIMEOUT / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * API-Call mit zusätzlichen Query-Parametern (z.B. page=2, date_from=...).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiCallWithParams(endpoint: string, params: Record<string, string> = {}, method: "GET" | "POST" = "GET"): Promise<any> {
  const apiKey = process.env.DIGISTORE_API_KEY;

  if (!apiKey || apiKey === "dein-api-key-hier") {
    throw new Error("DIGISTORE_API_KEY nicht konfiguriert");
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("language", "de");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-DS-API-KEY": apiKey,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Digistore24 API Fehler: ${res.status}`);
    }

    const data = await res.json();

    if (data.result === "error") {
      throw new Error(`Digistore24: ${data.message || "Unbekannter Fehler"}`);
    }

    return data.data;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Digistore24 API Timeout: ${endpoint} nach ${API_TIMEOUT / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Ordnet einen main_product_name aus listPurchases einer Dashboard-Produktgruppe zu.
 * Verwendet Substring-Matching statt listProducts-API (die oft timed out).
 *
 * Bekannte Produktnamen (aus der Digistore24 API):
 * - "intumind Community Event Classic-Ticket" / "VIP-Ticket" → Event 2026
 * - "Abnehm-Analyse | PAID | DIRECT | P50" → Tiny-PAC
 * - "Leicht 2.0 | PAID | Halbjahresabo" → Leicht 2.0
 * - PAC / PACL / Club werden über Keywords erkannt
 */
const PRODUCT_NAME_RULES: { match: (name: string) => boolean; group: keyof ProductGroupOrders }[] = [
  { match: (n) => n.includes("Community Event") || n.includes("Event"), group: "Event 2026" },
  { match: (n) => n.includes("Abnehm-Analyse") || n.includes("Tiny-PAC"), group: "Tiny-PAC" },
  { match: (n) => n.includes("Leicht 2.0"), group: "Leicht 2.0" },
  { match: (n) => n.includes("Club"), group: "Club" },
  // PACL vor PAC prüfen (PACL enthält auch "PAC")
  { match: (n) => n.includes("PACL") || n.includes("Coaching-Light") || n.includes("Coaching Light"), group: "PACL" },
  { match: (n) => n.includes("PAC") || n.includes("Abnehm-Coaching") || n.includes("Coaching"), group: "PAC" },
];

function matchProductGroup(productName: string): keyof ProductGroupOrders | null {
  for (const rule of PRODUCT_NAME_RULES) {
    if (rule.match(productName)) {
      return rule.group;
    }
  }
  return null;
}

/**
 * Lädt ALLE Purchases mit Pagination (page_size: 500).
 * Maximal 10 Seiten als Sicherheitsnetz.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllPurchases(): Promise<any[]> {
  const MAX_PAGES = 10;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allPurchases: any[] = [];

  // Erste Seite laden
  const firstPage = await apiCallWithParams("listPurchases");
  const purchaseList = firstPage?.purchase_list || [];
  allPurchases = [...purchaseList];

  const pageCount = parseInt(firstPage?.page_count, 10) || 1;

  // Weitere Seiten laden falls vorhanden
  if (pageCount > 1) {
    const pagesToLoad = Math.min(pageCount, MAX_PAGES);
    for (let page = 2; page <= pagesToLoad; page++) {
      try {
        const pageData = await apiCallWithParams("listPurchases", { page: String(page) });
        const pagePurchases = pageData?.purchase_list || [];
        allPurchases = [...allPurchases, ...pagePurchases];
      } catch {
        // Bei Fehler auf einer Seite weitermachen mit dem was wir haben
        break;
      }
    }
  }

  return allPurchases;
}

function emptyOrdersByGroup(): ProductGroupOrders {
  return {
    PAC: 0,
    PACL: 0,
    "Tiny-PAC": 0,
    Club: 0,
    "Leicht 2.0": 0,
    "Event 2026": 0,
  };
}

export async function fetchAllSalesData(): Promise<SalesData> {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Alle API-Calls parallel ausführen (ohne listProducts – Zuordnung über main_product_name)
  const [salesSummary, dailyAmounts, buyers, purchases] = await Promise.allSettled([
    apiCall("statsSalesSummary", "POST"),
    apiCall("statsDailyAmounts", "POST"),
    apiCall("listBuyers"),
    fetchAllPurchases(),
  ]);

  let revenueToday = 0;
  let revenueYesterday = 0;
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let ordersToday = 0;
  let ordersYesterday = 0;
  let totalCustomers = 0;
  const ordersByGroup = emptyOrdersByGroup();
  let dailyRevenue: DailyRevenue[] = [];

  // Datumsgrenzen für die letzten 14 Tage (Chart-Daten)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split("T")[0];

  // Monatspräfixe berechnen (z.B. "2026-02" und "2026-01")
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // === statsSalesSummary ===
  if (salesSummary.status === "fulfilled") {
    try {
      const periods = salesSummary.value?.for;

      // Tagesumsatz
      const dayData = periods?.day?.amounts?.EUR;
      if (dayData) {
        revenueToday = parseFloat(dayData.vendor_netto_amount) || 0;
      }

      // Monatsumsatz (aktueller Monat - zuverlässiger als dailyAmounts)
      const monthData = periods?.month?.amounts?.EUR;
      if (monthData) {
        revenueThisMonth = parseFloat(monthData.vendor_netto_amount) || 0;
      }

      // Letzter Monat: Jahresumsatz minus aktueller Monat, geteilt durch vergangene Monate
      // Besser: Wir berechnen es aus year - month wenn wir im Feb+ sind
      const yearData = periods?.year?.amounts?.EUR;
      if (yearData && monthData) {
        const yearRevenue = parseFloat(yearData.vendor_netto_amount) || 0;
        const monthRevenue = parseFloat(monthData.vendor_netto_amount) || 0;
        // Differenz = alle vorherigen Monate in diesem Jahr
        // Im Februar ist das = Januar, im März = Jan+Feb, etc.
        const currentMonth = new Date().getMonth(); // 0=Jan, 1=Feb, ...
        if (currentMonth > 0) {
          revenueLastMonth = (yearRevenue - monthRevenue) / currentMonth;
        }
      }
    } catch { /* ignore */ }
  }

  // === statsDailyAmounts (aktueller Monat) ===
  const revenueMap = new Map<string, number>();
  // Merken ob statsSalesSummary den Monatsumsatz schon geliefert hat
  const hasMonthFromSummary = revenueThisMonth > 0;

  if (dailyAmounts.status === "fulfilled") {
    try {
      const amountList = dailyAmounts.value?.amount_list;
      if (Array.isArray(amountList)) {
        for (const entry of amountList) {
          const day = String(entry.day || "");
          const amount = parseFloat(entry.vendor_netto_amount) || 0;

          // Tagesumsätze (nur setzen wenn noch 0 – statsSalesSummary hat Vorrang)
          if (day === today && revenueToday === 0) {
            revenueToday = amount;
          }
          if (day === yesterday) {
            revenueYesterday = amount;
          }

          // Monatssummen – NUR wenn statsSalesSummary keinen Wert hatte (Double-Counting vermeiden!)
          if (!hasMonthFromSummary) {
            const monthPrefix = day.substring(0, 7);
            if (monthPrefix === thisMonthPrefix) {
              revenueThisMonth += amount;
            }
          }

          // Chart-Daten: Letzte 14 Tage sammeln
          if (day >= fourteenDaysAgoStr && day <= today) {
            revenueMap.set(day, (revenueMap.get(day) || 0) + amount);
          }
        }
      }
    } catch { /* ignore */ }
  }

  // dailyRevenue aus API-Daten aufbauen (wird in sync-Route mit History gemergt)
  dailyRevenue = Array.from(revenueMap.entries())
    .map(([day, amount]) => ({ day, amount }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // === listBuyers ===
  if (buyers.status === "fulfilled") {
    try {
      totalCustomers = parseInt(buyers.value?.item_count, 10) || 0;
    } catch { /* ignore */ }
  }

  // === listPurchases (mit Pagination) ===
  if (purchases.status === "fulfilled") {
    try {
      const purchaseList = purchases.value;
      if (Array.isArray(purchaseList)) {
        for (const p of purchaseList) {
          const createdDate = String(p.created_at || "").substring(0, 10);
          if (createdDate === today) {
            ordersToday++;
            // Produktgruppe direkt über main_product_name zuordnen
            const productName = String(p.main_product_name || "");
            const group = matchProductGroup(productName);
            if (group) ordersByGroup[group]++;
          }
          if (createdDate === yesterday) ordersYesterday++;
        }
      }
    } catch { /* ignore */ }
  }

  return {
    revenueToday,
    revenueYesterday,
    ordersToday,
    ordersYesterday,
    ordersByGroup,
    revenueThisMonth,
    revenueLastMonth,
    totalCustomers,
    dailyRevenue,
    fetchedAt: new Date().toISOString(),
  };
}
