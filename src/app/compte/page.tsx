"use client";
import { useState } from "react";
import { ShopShell, Breadcrumb } from "@/components/shop-shell";
import { api, useStore } from "@/components/store-provider";
import { money } from "@/lib/data";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  const { profile, orders, update, authenticated, ready } = useStore(),
    [tab, setTab] = useState("orders");
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label="Mon compte" />
        <div className="page-heading">
          <div>
            <h1>
              {profile.name
                ? `Bonjour, ${profile.name.split(" ")[0]}.`
                : "Votre espace personnel"}
            </h1>
            <p>Retrouvez vos informations et vos commandes.</p>
          </div>
        </div>
        {!authenticated && ready ? (
          <div className="notice">
            <Link href="/connexion">Se connecter ou créer un compte</Link>
          </div>
        ) : (
          <button
            className="button outline"
            onClick={async () => {
              await api("/api/auth/logout", {});
              router.push("/connexion");
            }}
          >
            Se déconnecter
          </button>
        )}
        {authenticated && (
          <button
            className="button outline"
            onClick={async () => {
              try {
                await api("/api/auth/resend", {});
                alert(
                  "Un lien de confirmation a été demandé. Consultez votre e-mail.",
                );
              } catch (e) {
                alert(e instanceof Error ? e.message : "Erreur");
              }
            }}
          >
            Recevoir le lien de confirmation e-mail
          </button>
        )}
        <div className="account-tabs">
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            Mes commandes ({orders.length})
          </button>
          <button
            className={tab === "profile" ? "active" : ""}
            onClick={() => setTab("profile")}
          >
            Mes informations
          </button>
        </div>
        {tab === "orders" ? (
          orders.length ? (
            orders.map((o) => (
              <article className="order-card" key={o.id}>
                <header>
                  <div>
                    <strong>{o.id}</strong>
                    <br />
                    <small>
                      {new Date(o.date).toLocaleDateString("fr-FR")}
                    </small>
                  </div>
                  <span className="status-pill">{o.status}</span>
                  <strong>{money(o.total)}</strong>
                </header>
                {o.items.map((item, i) => (
                  <p key={i}>
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span>{money(item.price * item.quantity)}</span>
                  </p>
                ))}
                <Link
                  href={"/confirmation/" + o.id}
                  className="text-link"
                  style={{ marginTop: 15 }}
                >
                  Voir le récapitulatif →
                </Link>
              </article>
            ))
          ) : (
            <div className="empty">
              <h2>Votre première commande vous attend.</h2>
              <p>Une fois confirmée, elle apparaîtra ici.</p>
              <Link href="/catalogue" className="button dark">
                Explorer les produits
              </Link>
            </div>
          )
        ) : (
          <form
            className="panel"
            style={{ maxWidth: 650 }}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await update({
                profile: {
                  name: String(f.get("name")).trim(),
                  email: String(f.get("email")).trim(),
                },
              });
            }}
          >
            <h2>Vos informations</h2>
            <div className="form-grid">
              <label className="field">
                Nom complet
                <input name="name" required defaultValue={profile.name} />
              </label>
              <label className="field">
                Adresse e-mail
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={profile.email}
                  readOnly
                />
              </label>
            </div>
            <button className="button dark" style={{ marginTop: 20 }}>
              Enregistrer les modifications
            </button>
          </form>
        )}
      </div>
    </ShopShell>
  );
}
