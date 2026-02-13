export interface ProductGroupOrders {
  PAC: number;
  PACL: number;
  "Tiny-PAC": number;
  Club: number;
  "Leicht 2.0": number;
  "Event 2026": number;
}

export interface DailyRevenue {
  day: string;    // "YYYY-MM-DD"
  amount: number; // Netto-Umsatz in EUR
}

export interface SalesData {
  revenueToday: number;
  revenueYesterday: number;
  ordersToday: number;
  ordersYesterday: number;
  ordersByGroup: ProductGroupOrders;
  revenueThisMonth: number;
  revenueLastMonth: number;
  totalCustomers: number;
  dailyRevenue: DailyRevenue[]; // Letzte 14 Tage, chronologisch sortiert
  fetchedAt: string;
}

export interface Photo {
  id: number;
  filename: string;
  originalName: string;
  uploadedAt: string;
  sortOrder: number;
}

export interface SalesCardData {
  label: string;
  value: string | number;
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}
