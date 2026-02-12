export interface ProductGroupOrders {
  PAC: number;
  PACL: number;
  "Tiny-PAC": number;
  Club: number;
  "Leicht 2.0": number;
  "Event 2026": number;
}

export interface SalesData {
  revenueToday: number;
  revenueYesterday: number;
  ordersToday: number;
  ordersYesterday: number;
  ordersByGroup: ProductGroupOrders;
  totalCustomers: number;
  activeSubscriptions: number;
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
