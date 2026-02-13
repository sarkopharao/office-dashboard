import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
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
    <html lang="de" className={outfit.className}>
      <body className="bg-intumind-bg text-intumind-dark antialiased">
        {children}
      </body>
    </html>
  );
}
