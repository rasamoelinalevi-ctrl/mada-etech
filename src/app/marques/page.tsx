"use client";
import Link from "next/link";
import { ShopShell, Breadcrumb } from "@/components/shop-shell";
import { useStore } from "@/components/store-provider";
import { BrandLogo, hasBrandLogo } from "@/components/brand-logo";
export default function Page() {
  const { products } = useStore();
  const brands = [
    ...new Set(products.filter((p) => p.active).map((p) => p.brand)),
  ];
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label="Nos marques" />
        <div className="page-heading">
          <div>
            <h1>Vos marques préférées.</h1>
            <p>Retrouvez leurs produits dans notre sélection.</p>
          </div>
        </div>
        <div className="brands-grid">
          {brands.map((b) => (
            <Link
              className="brand-card"
              key={b}
              href={"/catalogue?marque=" + encodeURIComponent(b)}
            >
              {hasBrandLogo(b) && <div className="brand-card-logo"><BrandLogo brand={b} /></div>}
              <strong>{b}</strong>
              <p>
                {products.filter((p) => p.active && p.brand === b).length}{" "}
                produits à découvrir
              </p>
              <span>Explorer la collection ↗</span>
            </Link>
          ))}
        </div>
      </div>
    </ShopShell>
  );
}
