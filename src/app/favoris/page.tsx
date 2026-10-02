"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ShopShell, Breadcrumb } from "@/components/shop-shell";
import { ProductGrid } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
export default function Page() {
  const { products, favorites } = useStore();
  const list = products.filter((p) => p.active && favorites.includes(p.id));
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label="Mes favoris" />
        <div className="page-heading">
          <div>
            <h1>Vos coups de cœur</h1>
            <p>Gardez vos envies à portée de main.</p>
          </div>
          <span className="muted">{list.length} produit(s)</span>
        </div>
        {list.length ? (
          <ProductGrid products={list} />
        ) : (
          <div className="empty">
            <Heart />
            <h2>Votre liste attend ses premiers coups de cœur.</h2>
            <p>Appuyez sur le cœur d’un produit pour le retrouver ici.</p>
            <Link className="button dark" href="/catalogue">
              Explorer le catalogue
            </Link>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
