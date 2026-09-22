import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--fuente-display",
  weight: ["500", "600", "700"],
});

const ui = Inter({
  subsets: ["latin"],
  variable: "--fuente-ui",
});

export const metadata: Metadata = {
  title: "Mesa",
  description: "Lo que come la casa, contado entre todos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbfaf7",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
