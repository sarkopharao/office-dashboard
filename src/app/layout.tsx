import type { Metadata } from "next";
import { Outfit, Lora } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-outfit",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal"],
  display: "swap",
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "intumind Office Dashboard",
  description: "Live Sales Dashboard für intumind",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${outfit.variable} ${lora.variable} ${outfit.className}`}>
      <body className="bg-intumind-bg text-intumind-dark antialiased">
        {children}
      </body>
    </html>
  );
}
