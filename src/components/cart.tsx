"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useStore } from "./store-provider";
import { money } from "@/lib/data";
export function useTotals() {
  const { cart, products, settings } = useStore();
  const lines = cart.map((x) => ({
    ...x,
    product: products.find((p) => p.id === x.id),
  }));
  const subtotal = lines.reduce(
    (sum, x) => sum + (x.product?.price || 0) * x.quantity,
    0,
  );
  const shipping =
    subtotal >= settings.freeShipping || !lines.length ? 0 : settings.shipping;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
export function Summary({ checkout = false }: { checkout?: boolean }) {
  const { subtotal, shipping, total, lines } = useTotals();
  return (
    <aside className="panel summary">
      <h2>Votre récapitulatif</h2>
      {checkout &&
        lines.map((x) => (
          <div className="summary-line" key={x.id}>
            <span>
              {x.quantity} × {x.product?.name || "Produit indisponible"}
            </span>
            <span>{money((x.product?.price || 0) * x.quantity)}</span>
          </div>
        ))}
      <div className="summary-line">
        <span>Sous-total</span>
        <span>{money(subtotal)}</span>
      </div>
      <div className="summary-line">
        <span>Livraison</span>
        <span>{shipping ? money(shipping) : "Offerte"}</span>
      </div>
      <div className="summary-line total">
        <span>Total</span>
        <span>{money(total)}</span>
      </div>
      {!checkout && (
        <Link className="button dark" href="/commande">
          Passer la commande <ArrowRight size={17} />
        </Link>
      )}
      <small>
        Estimation avant application du code promotionnel et des frais de votre
        ville. Le montant définitif est affiché avant le paiement sur Papi.
      </small>
    </aside>
  );
}
export function Cart() {
  const { quantity } = useStore();
  const { lines } = useTotals();
  return lines.length ? (
    <div className="two-columns">
      <div>
        {lines.map((x) => (
          <div className="cart-item" key={x.id}>
            <Image
              src={x.product?.image || "/icon.png"}
              alt={x.product?.name || "Produit retiré"}
              width="100"
              height="100"
            />
            <div className="cart-item-info">
              {x.product ? (
                <Link href={"/produit/" + x.id}>
                  <h3>{x.product.name}</h3>
                </Link>
              ) : (
                <h3>Produit retiré du catalogue</h3>
              )}
              <p>
                {x.product?.brand} · {x.product?.category}
              </p>
              {(!x.product?.active ||
                !x.product?.stock ||
                x.quantity > (x.product?.stock || 0)) && (
                <p className="error-text">
                  Quantité indisponible : modifiez ou retirez cet article.
                </p>
              )}
              <div className="cart-item-actions">
                <div className="quantity">
                  <button
                    aria-label={"Diminuer " + x.product?.name}
                    disabled={x.quantity <= 1}
                    onClick={() => quantity(x.id, x.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{x.quantity}</span>
                  <button
                    aria-label={"Augmenter " + x.product?.name}
                    disabled={x.quantity >= (x.product?.stock || 0)}
                    onClick={() => quantity(x.id, x.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button onClick={() => quantity(x.id, 0)}>Retirer</button>
              </div>
            </div>
            <strong>{money((x.product?.price || 0) * x.quantity)}</strong>
          </div>
        ))}
        <Link href="/catalogue" className="text-link" style={{ marginTop: 25 }}>
          ← Continuer mes achats
        </Link>
      </div>
      <Summary />
    </div>
  ) : (
    <div className="empty">
      <ShoppingBag />
      <h2>Votre panier attend vos envies.</h2>
      <p>Découvrez notre sélection et trouvez votre prochain coup de cœur.</p>
      <Link href="/catalogue" className="button dark">
        Découvrir les produits
      </Link>
    </div>
  );
}
