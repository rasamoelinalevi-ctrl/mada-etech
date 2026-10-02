import type { Metadata } from "next";
import { StoreProvider } from "@/components/store-provider";
import "./globals.css";
import { catalog, settings } from "@/server/commerce";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://127.0.0.1:3000"),
  title: {
    default: "MADA E-TECH — Votre univers connecté",
    template: "%s | MADA E-TECH",
  },
  description:
    "Découvrez notre sélection de smartphones, ordinateurs, audio et accessoires. MADA E-TECH, votre boutique électronique.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initial = { products: await catalog(), settings: await settings() };
  return (
    <html lang="fr">
      <body>
        <StoreProvider initial={initial}>{children}</StoreProvider>
      </body>
    </html>
  );
}
