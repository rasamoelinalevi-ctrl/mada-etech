import type { MetadataRoute } from "next";
import { catalog } from "@/server/commerce";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL || "http://127.0.0.1:3000";
  return [
    ...[
      "",
      "/catalogue",
      "/nouveautes",
      "/promotions",
      "/contact",
      "/livraison",
      "/faq",
    ].map((p) => ({ url: base + p })),
    ...(await catalog()).map((p) => ({ url: base + "/produit/" + p.id })),
  ];
}
