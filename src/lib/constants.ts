export const SLIDESHOW_INTERVAL = 8000; // 8 Sekunden pro Foto
export const SALES_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minuten
export const QUOTE_INTERVAL = 30000; // 30 Sekunden pro Zitat

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

export const DUMMY_SALES: import("@/types").SalesData = {
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
  totalCustomers: 8432,
  fetchedAt: new Date().toISOString(),
};
