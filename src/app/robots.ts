import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/compte",
        "/commande",
        "/confirmation",
        "/connexion",
        "/panier",
        "/favoris",
      ],
    },
    sitemap: (process.env.APP_URL || "http://127.0.0.1:3000") + "/sitemap.xml",
  };
}
