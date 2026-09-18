"use client";
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { ShopShell } from "./shop-shell";
import { api, useStore } from "./store-provider";
import { money,type Order } from "@/lib/data";
export function Confirmation({ id,initialOrder }: { id: string;initialOrder?:Order }) {
  const { orders, ready, refresh } = useStore();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const act = async (action: string) => {
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/orders/" + id + "/" + action, {});
      if (result.url) window.location.assign(result.url);
      else await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Service indisponible.");
    } finally {
      setBusy(false);
    }
  };
  const order = orders.find((x) => x.id === id) || initialOrder;
  return (
    <ShopShell>
      <div className="container page-content">
        <div className="success-page">
          {order ? (
            <>
              <div className="success-icon">
                <Check size={32} />
              </div>
              <span className="eyebrow brand-text">COMMANDE {order.id}</span>
              <h1>Merci, {order.customer.split(" ")[0]} !</h1>
              <p>Commande enregistrée · {order.status}</p>
              <p>
                Paiement :{" "}
                {order.paymentStatus === "paid"
                  ? "Confirmé"
                  : order.paymentStatus === "expired"
                    ? "Lien expiré, commande annulée"
                    : order.paymentStatus === "review"
                      ? "Vérification nécessaire par la boutique"
                      : "À finaliser"}
              </p>
              <div className="panel">
                <h2>Le récapitulatif</h2>
                {order.items.map((x, i) => (
                  <div className="summary-line" key={i}>
                    <span>
                      {x.quantity} × {x.name}
                    </span>
                    <strong>{money(x.price * x.quantity)}</strong>
                  </div>
                ))}
                <div className="summary-line">
                  <span>Livraison</span>
                  <span>{money(order.shipping)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total</span>
                  <strong>{money(order.total)}</strong>
                </div>
                {!!order.discount && (
                  <p>Réduction : −{money(order.discount)}</p>
                )}
                <p>
                  {order.taxLabel} : {money(order.tax || 0)} (inclus)
                </p>
                {order.tracking && <p>Suivi : {order.tracking}</p>}
                <p>
                  {order.address}, {order.city}
                </p>
                <small className="muted">Mode choisi : {order.method}</small>
              </div>
              <div className="notice">
                Votre paiement est vérifié auprès de Papi. Revenir sur cette
                page ne suffit pas à confirmer un paiement.
              </div>
              {["pending", "failed"].includes(order.paymentStatus || "") && (
                <button
                  className="button dark"
                  disabled={busy}
                  onClick={() => void act("pay")}
                >
                  Payer sur Papi
                </button>
              )}
              <button
                className="button outline"
                disabled={busy}
                onClick={() => void act("refresh")}
              >
                Actualiser le paiement
              </button>
              {error && <p role="alert">{error}</p>}
              <Link className="button dark" href="/compte">
                Voir mes commandes
              </Link>
            </>
          ) : (
            <>
              <h1>{ready ? "Commande introuvable" : "Chargement…"}</h1>
              <p>Connectez-vous au compte utilisé lors de votre commande.</p>
              <Link className="button dark" href="/catalogue">
                Retour à la boutique
              </Link>
            </>
          )}
        </div>
      </div>
    </ShopShell>
  );
}
