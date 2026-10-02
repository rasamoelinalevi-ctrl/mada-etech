"use client";

import { useStore } from "@/components/store-provider";

export default function Page() {
  const { settings, update, ready, busy } = useStore();
  if (!ready) return <p>Chargement…</p>;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>À votre image.</h1>
          <p>Personnalisez les informations et l’accueil de votre boutique.</p>
        </div>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          let zones;
          try {
            zones = JSON.parse(String(f.get("zones")));
          } catch {
            alert("Zones : JSON invalide");
            return;
          }
          await update({
            settings: {
              ...settings,
              zones,
              taxBps: Math.round(Number(f.get("tax")) * 100),
              taxLabel: String(f.get("taxLabel")),
              legalText: String(f.get("legalText")),
              returnsText: String(f.get("returnsText")),
              commerceReady: f.get("commerceReady") === "on",
              name: String(f.get("name")).trim(),
              email: String(f.get("email")).trim(),
              phone: String(f.get("phone")).trim(),
              address: String(f.get("address")).trim(),
              heroTitle: String(f.get("heroTitle")).trim(),
              heroText: String(f.get("heroText")).trim(),
              shipping: Number(f.get("shipping")),
              freeShipping: Number(f.get("freeShipping")),
            },
          });
        }}
      >
        <div className="settings-grid">
          <div>
            <section className="panel">
              <h2>Informations générales</h2>
              <div className="form-grid">
                <label className="field full">
                  Nom de la boutique
                  <input
                    name="name"
                    defaultValue={settings.name}
                    required
                    maxLength={35}
                  />
                </label>
                <label className="field">
                  E-mail de contact
                  <input
                    type="email"
                    name="email"
                    defaultValue={settings.email}
                    required
                  />
                </label>
                <label className="field">
                  Téléphone
                  <input name="phone" defaultValue={settings.phone} required />
                </label>
                <label className="field full">
                  Adresse
                  <input
                    name="address"
                    defaultValue={settings.address}
                    required
                  />
                </label>
              </div>
            </section>
            <section className="panel">
              <h2>Bannière d’accueil</h2>
              <div className="form-grid">
                <label className="field full">
                  Titre principal
                  <textarea
                    name="heroTitle"
                    defaultValue={settings.heroTitle}
                    required
                    maxLength={65}
                  />
                </label>
                <label className="field full">
                  Texte de présentation
                  <textarea
                    name="heroText"
                    defaultValue={settings.heroText}
                    required
                    maxLength={150}
                  />
                </label>
              </div>
            </section>
          </div>
          <div>
            <section className="panel">
              <h2>Livraison</h2>
              <div className="form-grid">
                <label className="field full">
                  Frais de livraison (Ar)
                  <input
                    type="number"
                    name="shipping"
                    min="0"
                    step="1"
                    defaultValue={settings.shipping}
                    required
                  />
                </label>
                <label className="field full">
                  Livraison offerte à partir de (Ar)
                  <input
                    type="number"
                    name="freeShipping"
                    min="0"
                    step="1"
                    defaultValue={settings.freeShipping}
                    required
                  />
                </label>
              </div>
              <p className="notice neutral">
                Ces montants sont utilisés pour calculer le panier et les
                commandes.
              </p>
            </section>
            <section className="panel">
              <h2>Livraison, fiscalité et ouverture</h2>
              <label className="field">
                Zones de livraison (JSON : ville et frais en Ar)
                <textarea
                  name="zones"
                  required
                  rows={5}
                  defaultValue={JSON.stringify(settings.zones, null, 2)}
                />
              </label>
              <label className="field">
                Taux de taxe inclus dans les prix (%)
                <input
                  name="tax"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  defaultValue={(settings.taxBps || 0) / 100}
                />
              </label>
              <label className="field">
                Libellé fiscal
                <input
                  name="taxLabel"
                  required
                  defaultValue={settings.taxLabel}
                />
              </label>
              <label className="field">
                Conditions de vente et confidentialité
                <textarea
                  name="legalText"
                  rows={10}
                  defaultValue={settings.legalText}
                />
              </label>
              <label className="field">
                Livraison et retours
                <textarea
                  name="returnsText"
                  rows={6}
                  defaultValue={settings.returnsText}
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  name="commerceReady"
                  defaultChecked={settings.commerceReady}
                />
                Ouvrir les commandes après validation des tarifs, taxes,
                conditions et du compte Papi
              </label>
              <p className="notice">
                Les prix sont considérés toutes taxes comprises. Faites valider
                votre régime fiscal avant l’ouverture.
              </p>
            </section>{" "}
          </div>
        </div>
        <button className="button dark" disabled={busy}>
          Enregistrer les paramètres
        </button>
      </form>
    </>
  );
}
