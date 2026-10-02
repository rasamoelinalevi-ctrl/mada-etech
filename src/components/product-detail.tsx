"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Headphones,
  PackageX,
} from "lucide-react";
import { ShopShell, Breadcrumb } from "./shop-shell";
import { ProductGrid, SectionTitle } from "./product-card";
import { useStore } from "./store-provider";
import { money, type Product } from "@/lib/data";
export function ProductDetail({
  id,
  initialProduct,
}: {
  id: string;
  initialProduct?: Product;
}) {
  const { products, add, favorite, favorites, ready } = useStore(),
    [qty, setQty] = useState(1);
  const p = ready
    ? products.find((x) => x.id === id && x.active)
    : initialProduct;
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label={p?.name || "Produit"} />
        {p ? (
          <>
            <div className="detail-grid">
              <div className="detail-image">
                <Image src={p.image} alt={p.name} width="600" height="500" />
              </div>
              <div className="detail-info">
                <Link
                  className="eyebrow brand-text"
                  href={"/catalogue?marque=" + encodeURIComponent(p.brand)}
                >
                  {p.brand} · {p.category}
                </Link>
                <h1>{p.name}</h1>
                {p.group && (
                  <nav aria-label="Variantes">
                    {products
                      .filter((x) => x.group === p.group && x.active)
                      .map((x) => (
                        <Link
                          className="button outline"
                          key={x.id}
                          href={"/produit/" + x.id}
                          aria-current={x.id === p.id ? "page" : undefined}
                        >
                          {x.name}
                        </Link>
                      ))}
                  </nav>
                )}
                <span className={"stock " + (!p.stock ? "out" : "")}>
                  {p.stock
                    ? `${p.stock} disponibles en stock`
                    : "Actuellement épuisé"}
                </span>
                <div className="detail-price">
                  <strong>{money(p.price)}</strong>
                  {p.oldPrice > p.price && <del>{money(p.oldPrice)}</del>}
                </div>
                <p className="detail-description">{p.description}</p>
                <div className="buy-row">
                  <div className="quantity">
                    <button
                      aria-label="Diminuer la quantité"
                      disabled={qty <= 1}
                      onClick={() => setQty(qty - 1)}
                    >
                      −
                    </button>
                    <span aria-live="polite">{qty}</span>
                    <button
                      aria-label="Augmenter la quantité"
                      disabled={qty >= p.stock}
                      onClick={() => setQty(qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="button dark"
                    disabled={!p.stock}
                    onClick={() => add(p.id, qty)}
                  >
                    <ShoppingBag size={18} />
                    Ajouter au panier
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Ajouter ou retirer des favoris"
                    aria-pressed={favorites.includes(p.id)}
                    onClick={() => favorite(p.id)}
                  >
                    <Heart
                      size={20}
                      fill={favorites.includes(p.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="detail-facts">
                  <span>
                    <Truck size={17} /> Livraison à Madagascar
                  </span>
                  <span>
                    <ShieldCheck size={17} /> Disponibilité et garantie à
                    confirmer en boutique
                  </span>
                  <span>
                    <Headphones size={17} />
                    <Link href="/contact">
                      Un conseil ? Contactez notre équipe
                    </Link>
                  </span>
                </div>
                <div className="notice neutral">
                  Prix en ariary. Le stock est revérifié lors de la commande.
                </div>
              </div>
            </div>
            <section className="specs">
              <h2>Dans les détails</h2>
              <dl>
                {Object.entries(p.specs).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="related">
              <SectionTitle title="Vous aimerez aussi" href="/catalogue" />
              <ProductGrid
                products={products
                  .filter((x) => x.active && x.id !== p.id)
                  .sort(
                    (a, b) =>
                      Number(b.category === p.category) -
                      Number(a.category === p.category),
                  )
                  .slice(0, 4)}
              />
            </section>
          </>
        ) : ready ? (
          <div className="empty">
            <PackageX />
            <h2>Produit indisponible</h2>
            <p>Ce produit n’existe pas ou a été retiré du catalogue.</p>
            <Link href="/catalogue" className="button dark">
              Retour au catalogue
            </Link>
          </div>
        ) : (
          <p>Chargement…</p>
        )}
      </div>
    </ShopShell>
  );
}
