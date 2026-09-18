"use client";
import { ShopShell, Breadcrumb } from "@/components/shop-shell";
import { useStore } from "@/components/store-provider";
import { useState } from "react";
export default function Page() {
  const { settings, messages, update } = useStore();
  const [sent, setSent] = useState(false);
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label="Nous contacter" />
        <div className="page-heading">
          <div>
            <span className="eyebrow brand-text">ON EST LÀ POUR VOUS</span>
            <h1>Parlons de vos envies.</h1>
            <p>Un produit, une question ou un conseil ? Écrivez-nous.</p>
          </div>
        </div>
        <div className="contact-grid">
          <aside className="contact-info">
            <h2>
              La bonne tech commence
              <br />
              par le bon conseil.
            </h2>
            <p>{settings.address}</p>
            <a href={"mailto:" + settings.email}>{settings.email}</a>
            <a href={"tel:" + settings.phone.replace(/\s/g, "")}>
              {settings.phone}
            </a>
            <p>Contactez notre équipe pour préparer votre achat.</p>
          </aside>
          {sent ? (
            <div className="empty">
              <h2>Votre message a bien été reçu.</h2>
              <p>Notre équipe le retrouvera dans sa messagerie de boutique.</p>
              <button className="button dark" onClick={() => setSent(false)}>
                Écrire un autre message
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const ok = await update({
                  messages: [
                    {
                      id: crypto.randomUUID(),
                      name: String(f.get("name")),
                      email: String(f.get("email")),
                      message: String(f.get("message")),
                      date: new Date().toISOString(),
                    },
                    ...messages,
                  ],
                });
                if (ok) setSent(true);
              }}
            >
              <div className="form-grid">
                <label className="field">
                  Votre nom
                  <input name="name" required minLength={2} />
                </label>
                <label className="field">
                  Votre e-mail
                  <input name="email" required type="email" />
                </label>
                <label className="field full">
                  Votre message
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    placeholder="Dites-nous ce que vous recherchez…"
                    rows={6}
                  />
                </label>
              </div>
              <p className="notice neutral">
                Les informations saisies servent uniquement au traitement de
                votre demande.
              </p>
              <button className="button dark">
                Enregistrer le message de test ↗
              </button>
            </form>
          )}
        </div>
      </div>
    </ShopShell>
  );
}
