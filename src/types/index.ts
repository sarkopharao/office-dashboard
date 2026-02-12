export interface SalesData {
  revenueToday: number;
  revenueYesterday: number;
  ordersToday: number;
  ordersYesterday: number;
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
