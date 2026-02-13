import type { SalesData, ProductGroupOrders } from "@/types";

const BASE_URL = "https://www.digistore24.com/api/call";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiCall(endpoint: string, method: "GET" | "POST" = "GET"): Promise<any> {
  const apiKey = process.env.DIGISTORE_API_KEY;

  if (!apiKey || apiKey === "dein-api-key-hier") {
    throw new Error("DIGISTORE_API_KEY nicht konfiguriert");
  }

  const url = `${BASE_URL}/${endpoint}?language=de`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-DS-API-KEY": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Digistore24 API Fehler: ${res.status}`);
  }

  const data = await res.json();

  if (data.result === "error") {
    throw new Error(`Digistore24: ${data.message || "Unbekannter Fehler"}`);
  }

  return data.data;
}

/**
 * API-Call mit zusätzlichen Query-Parametern (z.B. page=2).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiCallWithParams(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const apiKey = process.env.DIGISTORE_API_KEY;

  if (!apiKey || apiKey === "dein-api-key-hier") {
    throw new Error("DIGISTORE_API_KEY nicht konfiguriert");
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("language", "de");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      "X-DS-API-KEY": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`Digistore24 API Fehler: ${res.status}`);
  }

  const data = await res.json();

  if (data.result === "error") {
    throw new Error(`Digistore24: ${data.message || "Unbekannter Fehler"}`);
  }

  return data.data;
}

/**
 * Mapping von Digistore24 product_group_name auf unsere Dashboard-Gruppen.
 */
const GROUP_NAME_MAP: Record<string, keyof ProductGroupOrders> = {
  "Abnehm-Coaching (PAC)": "PAC",
  "Abnehm-Coaching-Light (PACL)": "PACL",
  "Abnehm-Analyse (Tiny-PAC)": "Tiny-PAC",
  "Club": "Club",
  "Leicht 2.0": "Leicht 2.0",
  "Event 2026": "Event 2026",
};

/**
 * Lädt alle Produkte und erstellt eine Map von product_id → Dashboard-Gruppe.
 */
async function buildProductGroupMap(): Promise<Map<string, keyof ProductGroupOrders>> {
  const data = await apiCall("listProducts");
  const products = data?.products || data?.product_list || [];
  const map = new Map<string, keyof ProductGroupOrders>();

  for (const p of products) {
    const groupName = p.product_group_name || "";
    const dashboardGroup = GROUP_NAME_MAP[groupName];
    if (dashboardGroup) {
      map.set(String(p.id), dashboardGroup);
    }
  }

  return map;
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

  // Alle API-Calls parallel ausführen
  const [salesSummary, dailyAmounts, buyers, purchases, productGroupMap] = await Promise.allSettled([
    apiCall("statsSalesSummary", "POST"),
    apiCall("statsDailyAmounts", "POST"),
    apiCall("listBuyers"),
    fetchAllPurchases(),
    buildProductGroupMap(),
  ]);

  let revenueToday = 0;
  let revenueYesterday = 0;
  let revenueThisMonth = 0;
  let revenueLastMonth = 0;
  let ordersToday = 0;
  let ordersYesterday = 0;
  let totalCustomers = 0;
  const ordersByGroup = emptyOrdersByGroup();

  // Monatspräfixe berechnen (z.B. "2026-02" und "2026-01")
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // Produkt-Gruppen-Map auslesen
  const groupMap = productGroupMap.status === "fulfilled" ? productGroupMap.value : new Map();

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

  // === statsDailyAmounts ===
  if (dailyAmounts.status === "fulfilled") {
    try {
      const amountList = dailyAmounts.value?.amount_list;
      if (Array.isArray(amountList)) {
        for (const entry of amountList) {
          const day = String(entry.day || "");
          const amount = parseFloat(entry.vendor_netto_amount) || 0;

          // Tagesumsätze
          if (day === today) {
            revenueToday = revenueToday || amount;
          }
          if (day === yesterday) {
            revenueYesterday = amount;
          }

          // Monatssummen
          const monthPrefix = day.substring(0, 7);
          if (monthPrefix === thisMonthPrefix) {
            revenueThisMonth += amount;
          }
          if (monthPrefix === lastMonthPrefix) {
            revenueLastMonth += amount;
          }
        }
      }
    } catch { /* ignore */ }
  }

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
            // Produktgruppe über product_id aus der Map zuordnen
            const group = groupMap.get(String(p.main_product_id)) as keyof ProductGroupOrders | undefined;
            if (group && group in ordersByGroup) ordersByGroup[group]++;
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
    fetchedAt: new Date().toISOString(),
  };
}
