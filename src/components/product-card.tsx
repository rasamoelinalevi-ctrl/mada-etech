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
  const pendingFlight = useRef(false);
  const quantity = cart.find((item) => item.id === p.id)?.quantity || 0;
  const previousQuantity = useRef(quantity);
  useEffect(() => {
    let ghost: HTMLImageElement | undefined;
    let flight: Animation | undefined;
    if (quantity > previousQuantity.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      addRef.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(12deg)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
      if (pendingFlight.current) {
        const source = addRef.current?.closest('article')?.querySelector('img');
        const target = document.querySelector<HTMLElement>('.cart-link');
        if (source && target) {
          const start = source.getBoundingClientRect();
          const end = target.getBoundingClientRect();
          if (end.top >= 0 && end.bottom <= window.innerHeight && end.width > 0) {
            ghost = document.createElement('img');
            ghost.src = source.currentSrc || source.src;
            ghost.alt = '';
            ghost.setAttribute('aria-hidden', 'true');
            Object.assign(ghost.style, { position: 'fixed', left: `${start.left + start.width / 2 - 28}px`, top: `${start.top + start.height / 2 - 28}px`, width: '56px', height: '56px', objectFit: 'contain', borderRadius: '12px', background: 'white', boxShadow: '0 8px 24px #0a113533', pointerEvents: 'none', zIndex: '9999' });
            document.body.appendChild(ghost);
            const x = end.left + end.width / 2 - start.left - start.width / 2;
            const y = end.top + end.height / 2 - start.top - start.height / 2;
            flight = ghost.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${x * .4}px,${y * .6 - 35}px) scale(.85)`, opacity: .95 }, { transform: `translate(${x}px,${y}px) scale(.15)`, opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.3,0,.2,1)' });
            flight.onfinish = () => {
              ghost?.remove();
              target.animate([{ scale: '1' }, { scale: '1.18' }, { scale: '1' }], { duration: 300 });
            };
          }
        }
      }
    }
    pendingFlight.current = false;
    previousQuantity.current = quantity;
    return () => { if (flight) { flight.onfinish = null; flight.cancel(); } ghost?.remove(); };
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
            onClick={() => { pendingFlight.current = true; add(p.id); }}
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
