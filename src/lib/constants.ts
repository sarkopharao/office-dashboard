import type { SalesData, DailyRevenue, ProductGroupOrders } from "@/types";

export const SLIDESHOW_INTERVAL = 8000; // 8 Sekunden pro Foto
export const SALES_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minuten
export const QUOTE_INTERVAL = 30000; // 30 Sekunden pro Zitat
export const MIN_LOADING_MS = 2000; // Mindestens 2 Sek. Geldregen zeigen

export const MOTIVATIONAL_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal – it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "We empower people to live a healthy and joyful life.", author: "intumind" },
  { text: "Your limitation – it's only your imagination.", author: "" },
  { text: "Dream it. Wish it. Do it.", author: "" },
  { text: "Great things never come from comfort zones.", author: "" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "" },
  { text: "Every accomplishment starts with the decision to try.", author: "John F. Kennedy" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Teamwork makes the dream work.", author: "" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" },
  { text: "Health is not valued till sickness comes.", author: "Thomas Fuller" },
];

export const PRODUCT_GROUP_CONFIG: {
  key: keyof ProductGroupOrders;
  label: string;
  color: string;
}[] = [
  { key: "PAC", label: "PAC", color: "#009399" },
  { key: "PACL", label: "PACL", color: "#00a8af" },
  { key: "Tiny-PAC", label: "Abnehm-Analyse", color: "#0E75B9" },
  { key: "Club", label: "Club", color: "#73A942" },
  { key: "Leicht 2.0", label: "Leicht 2.0", color: "#ECB31B" },
  { key: "Event 2026", label: "Event", color: "#007a7f" },
];

export const DAY_NAMES = [
  "Sonntag", "Montag", "Dienstag", "Mittwoch",
  "Donnerstag", "Freitag", "Samstag",
];

export const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

// Dummy dailyRevenue: 14 Tage rückwärts ab heute
function generateDummyDailyRevenue(): DailyRevenue[] {
  const days: DailyRevenue[] = [];
  const amounts = [
    1850, 2400, 3100, 2750, 4200, 3800, 1200,  // Vorwoche (Mo-So)
    2100, 2900, 3500, 2847, 4600, 4041, 1500,   // Aktuelle Woche (Mo-So)
  ];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      day: d.toISOString().split("T")[0],
      amount: amounts[13 - i],
    });
  }
  return days;
}

export const DUMMY_SALES: SalesData = {
  revenueToday: 2847.5,
  revenueYesterday: 3192.0,
  ordersToday: 12,
  ordersYesterday: 15,
  ordersByGroup: {
    PAC: 3,
    PACL: 1,
    "Tiny-PAC": 4,
    Club: 0,
    "Leicht 2.0": 2,
    "Event 2026": 2,
  },
  revenueThisMonth: 48500,
  revenueLastMonth: 62300,
  totalCustomers: 8432,
  dailyRevenue: generateDummyDailyRevenue(),
  fetchedAt: new Date().toISOString(),
};
