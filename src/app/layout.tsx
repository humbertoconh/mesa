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
  // Para que en el iPhone se abra sin la barra del navegador
  // al añadirla a la pantalla de inicio.
  appleWebApp: {
    capable: true,
    title: "Mesa",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
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
