import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="de">
      <body className="bg-intumind-bg text-intumind-dark antialiased">
        {children}
      </body>
    </html>
  );
}
