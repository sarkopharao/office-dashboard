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
 * Ordnet einen Produktnamen einer Produktgruppe zu.
 * Basiert auf Analyse der tatsächlichen Digistore24-Produktnamen.
 */
function getProductGroup(productName: string): keyof ProductGroupOrders | null {
  const name = productName.toLowerCase();

  // PAC (Abnehm-Coaching) - "PAC | FEST | ..." oder "intumind Abnehmcoaching" (nicht Basic/Light)
  if (name.includes("pac |") || name.includes("pac|")) return "PAC";
  if (name.includes("abnehmcoaching") && !name.includes("basic") && !name.includes("light")) return "PAC";

  // PACL (Abnehm-Coaching-Light) - "PACL" oder "Basic" oder "Light"
  if (name.includes("pacl")) return "PACL";
  if (name.includes("abnehmcoaching") && (name.includes("basic") || name.includes("light"))) return "PACL";

  // Tiny-PAC (Abnehm-Analyse) - "Abnehm-Analyse" oder "AHA |"
  if (name.includes("abnehm-analyse") || name.includes("aha |") || name.includes("aha|")) return "Tiny-PAC";

  // Club - "Club" oder "Mitgliedschaft"
  if (name.includes("club") || name.includes("mitgliedschaft")) return "Club";

  // Leicht 2.0
  if (name.includes("leicht")) return "Leicht 2.0";

  // Event 2026
  if (name.includes("event") || name.includes("ticket")) return "Event 2026";

  return null;
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
  const [salesSummary, dailyAmounts, buyers, purchases] = await Promise.allSettled([
    apiCall("statsSalesSummary", "POST"),
    apiCall("statsDailyAmounts", "POST"),
    apiCall("listBuyers"),
    apiCall("listPurchases"),
  ]);

  let revenueToday = 0;
  let revenueYesterday = 0;
  let ordersToday = 0;
  let ordersYesterday = 0;
  let totalCustomers = 0;
  let activeSubscriptions = 0;
  const ordersByGroup = emptyOrdersByGroup();

  // === statsSalesSummary ===
  if (salesSummary.status === "fulfilled") {
    try {
      const dayData = salesSummary.value?.for?.day?.amounts?.EUR;
      if (dayData) {
        revenueToday = parseFloat(dayData.vendor_netto_amount) || 0;
      }
    } catch { /* ignore */ }
  }

  // === statsDailyAmounts ===
  if (dailyAmounts.status === "fulfilled") {
    try {
      const amountList = dailyAmounts.value?.amount_list;
      if (Array.isArray(amountList)) {
        for (const entry of amountList) {
          if (entry.day === today) {
            revenueToday = revenueToday || parseFloat(entry.vendor_netto_amount) || 0;
          }
          if (entry.day === yesterday) {
            revenueYesterday = parseFloat(entry.vendor_netto_amount) || 0;
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

  // === listPurchases ===
  if (purchases.status === "fulfilled") {
    try {
      const purchaseList = purchases.value?.purchase_list;
      if (Array.isArray(purchaseList)) {
        for (const p of purchaseList) {
          const createdDate = String(p.created_at || "").substring(0, 10);
          if (createdDate === today) {
            ordersToday++;
            // Produktgruppe zuordnen
            const group = getProductGroup(p.main_product_name || "");
            if (group) ordersByGroup[group]++;
          }
          if (createdDate === yesterday) ordersYesterday++;

          if (p.billing_type === "subscription" && p.billing_status === "paying") {
            activeSubscriptions++;
          }
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
    totalCustomers,
    activeSubscriptions,
    fetchedAt: new Date().toISOString(),
  };
}
