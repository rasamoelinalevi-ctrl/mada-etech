"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShopShell, Breadcrumb } from "@/components/shop-shell";
import { Summary } from "@/components/cart";
import { useStore } from "@/components/store-provider";
export default function Page() {
  const {
      cart,
      checkout,
      profile,
      authenticated,
      settings,
      paymentConfigured,
      mastercardEnabled,
    } = useStore(),
    router = useRouter();
  const [method, setMethod] = useState("MVola"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label="Commande" />
        <div className="page-heading">
          <div>
            <h1>Encore un petit instant.</h1>
            <p>Vos informations de livraison, et c’est presque terminé.</p>
          </div>
        </div>
        {!authenticated ? (
          <div className="notice">
            <Link href="/connexion">
              Connectez-vous ou créez un compte pour commander.
            </Link>
          </div>
        ) : cart.length ? (
          <div className="two-columns">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setBusy(true);
                const f = new FormData(e.currentTarget);
                const id = await checkout({
                  customer: String(f.get("name")).trim(),
                  email: String(f.get("email")).trim(),
                  phone: String(f.get("phone")).trim(),
                  address: String(f.get("address")).trim(),
                  city: String(f.get("city")).trim(),
                  method,
                  coupon: String(f.get("coupon") || ""),
                  acceptedTerms: f.get("terms") === "on",
                });
                if (id) router.push("/confirmation/" + id);
                else {
                  setError(
                    "La commande n’a pas pu être finalisée. Consultez le message affiché et vérifiez votre compte avant de réessayer.",
                  );
                  setBusy(false);
                }
              }}
            >
              <section className="form-section">
                <h2>1. Vos coordonnées</h2>
                <div className="form-grid">
                  <label className="field">
                    Nom complet
                    <input
                      name="name"
                      required
                      minLength={2}
                      defaultValue={profile.name}
                      autoComplete="name"
                    />
                  </label>
                  <label className="field">
                    Adresse e-mail
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={profile.email}
                      autoComplete="email"
                    />
                  </label>
                  <label className="field full">
                    Téléphone
                    <input
                      name="phone"
                      type="tel"
                      required
                      minLength={8}
                      autoComplete="tel"
                      placeholder="+261…"
                    />
                  </label>
                </div>
              </section>
              <section className="form-section">
                <h2>2. Où livrer votre commande ?</h2>
                <div className="form-grid">
                  <label className="field full">
                    Adresse complète
                    <input
                      name="address"
                      required
                      minLength={5}
                      autoComplete="street-address"
                      placeholder="Rue, quartier, repère…"
                    />
                  </label>
                  <label className="field full">
                    Ville
                    <input
                      name="city"
                      required
                      minLength={2}
                      autoComplete="address-level2"
                      placeholder="Antananarivo"
                    />
                  </label>
                </div>
              </section>
              <section className="form-section">
                <h2>3. Mode de paiement souhaité</h2>
                {[
                  "MVola",
                  "Orange Money",
                  "Airtel Money",
                  "Carte bancaire",
                ].map((m) => (
                  <label className="radio-card" key={m}>
                    <input
                      type="radio"
                      name="payment"
                      value={
                        m === "Carte bancaire"
                          ? mastercardEnabled
                            ? "Visa / Mastercard"
                            : "Visa"
                          : m
                      }
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    <span>
                      {m}
                      <small>Paiement sécurisé sur Papi</small>
                    </span>
                  </label>
                ))}
              </section>
              <label className="field">
                Code promotionnel
                <input name="coupon" maxLength={40} />
              </label>
              {(!settings.commerceReady || !paymentConfigured) && (
                <p className="notice">
                  La boutique est en cours de configuration. Les commandes ne
                  sont pas encore ouvertes.
                </p>
              )}
              <label className="check-label">
                <input type="checkbox" name="terms" required />
                J’accepte les conditions de vente et la politique de retour.
              </label>
              <div className="notice">
                Vos informations sont utilisées pour traiter et livrer votre
                commande. Le paiement est confirmé uniquement après vérification
                auprès de Papi.
              </div>
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button dark"
                disabled={busy || !settings.commerceReady || !paymentConfigured}
              >
                {busy
                  ? "Enregistrement…"
                  : "Enregistrer et choisir le paiement"}
              </button>
            </form>
            <Summary checkout />
          </div>
        ) : (
          <div className="empty">
            <h2>Aucun produit à commander</h2>
            <Link href="/catalogue" className="button dark">
              Retour à la boutique
            </Link>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
