import { ProductDetail } from "@/components/product-detail";
import { catalog } from "@/server/commerce";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = (await catalog()).find((p) => p.id === id);
  if (!p) notFound();
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    alternates: { canonical: "/produit/" + id },
    openGraph: { title: p.name, description: p.description.slice(0, 160) },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = (await catalog()).find((p) => p.id === id);
  if (!p) notFound();
  const base = process.env.APP_URL || "http://127.0.0.1:3000";
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.sku,
    image: p.image.startsWith("/") ? base + p.image : undefined,
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "MGA",
      availability: p.stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: base + "/produit/" + id,
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(json).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetail id={id} initialProduct={p} />
    </>
  );
}
