"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, Plus, ArrowUpRight } from "lucide-react";
import { type Product, money } from "@/lib/data";
import { useStore } from "./store-provider";
import { BrandLogo, hasBrandLogo } from "./brand-logo";
export function ProductCard({ product: p }: { product: Product }) {
  const { add, favorite, favorites, cart } = useStore();
  const addRef = useRef<HTMLButtonElement>(null);
  const quantity = cart.find((item) => item.id === p.id)?.quantity || 0;
  const previousQuantity = useRef(quantity);
  useEffect(() => {
    if (quantity > previousQuantity.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      addRef.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(12deg)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    }
    previousQuantity.current = quantity;
  }, [quantity]);
  const discount =
    p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <article className="product-card">
      <div className="product-visual">
        <Link href={"/produit/" + p.id} aria-label={p.name}>
          <Image
            src={p.image}
            alt={p.name}
            loading="lazy"
            width="300"
            height="260"
          />
        </Link>
        <div className="product-badges">
          {discount > 0 ? (
            <span className="discount">−{discount}%</span>
          ) : p.isNew ? (
            <span className="new-badge">Nouveau</span>
          ) : null}
        </div>
        <button
          className={
            "favorite-button " + (favorites.includes(p.id) ? "selected" : "")
          }
          onClick={() => favorite(p.id)}
          aria-label={
            (favorites.includes(p.id)
              ? "Retirer des favoris : "
              : "Ajouter aux favoris : ") + p.name
          }
          aria-pressed={favorites.includes(p.id)}
        >
          <Heart
            size={18}
            fill={favorites.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="product-info">
        <div className="product-brand-logo"><BrandLogo brand={p.brand} /></div>
        <span className="eyebrow muted">
          {hasBrandLogo(p.brand) ? p.category : <>{p.brand} <span>· {p.category}</span></>}
        </span>
        <Link href={"/produit/" + p.id}>
          <h3>{p.name}</h3>
        </Link>
        <span className={"stock " + (!p.stock ? "out" : "")}>
          {p.stock ? "En stock" : "Épuisé"}
        </span>
        <div className="product-bottom">
          <div>
            <strong>{money(p.price)}</strong>
            {discount > 0 && <del>{money(p.oldPrice)}</del>}
          </div>
          <button
            className="add-button"
            ref={addRef}
            disabled={quantity >= p.stock}
            onClick={() => add(p.id)}
            aria-label={"Ajouter au panier : " + p.name}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  href,
  label = "Tout voir",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow brand-text">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-link">
          {label}
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
