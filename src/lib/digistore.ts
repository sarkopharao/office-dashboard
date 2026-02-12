import type { SalesData } from "@/types";

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

  // === statsSalesSummary ===
  // data.for.day.amounts.EUR.vendor_netto_amount (Umsatz heute)
  if (salesSummary.status === "fulfilled") {
    try {
      const dayData = salesSummary.value?.for?.day?.amounts?.EUR;
      if (dayData) {
        revenueToday = parseFloat(dayData.vendor_netto_amount) || 0;
      }
    } catch { /* ignore */ }
  }

  // === statsDailyAmounts ===
  // data.amount_list[].day + vendor_netto_amount (Strings!)
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
  // data.item_count (String!) = Gesamtanzahl aller Kunden
  if (buyers.status === "fulfilled") {
    try {
      totalCustomers = parseInt(buyers.value?.item_count, 10) || 0;
    } catch { /* ignore */ }
  }

  // === listPurchases ===
  // data.purchase_list[] mit created_at, billing_type, billing_status
  if (purchases.status === "fulfilled") {
    try {
      const purchaseList = purchases.value?.purchase_list;
      if (Array.isArray(purchaseList)) {
        for (const p of purchaseList) {
          const createdDate = String(p.created_at || "").substring(0, 10);
          if (createdDate === today) ordersToday++;
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
    totalCustomers,
    activeSubscriptions,
    fetchedAt: new Date().toISOString(),
  };
}
