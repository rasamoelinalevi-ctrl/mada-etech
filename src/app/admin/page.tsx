"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Package,
  ShoppingBag,
  Wallet,
  Users,
  Plus,
} from "lucide-react";
import { useStore } from "@/components/store-provider";
import { money } from "@/lib/data";
export default function Page() {
  const { products, orders } = useStore();
  const valid = orders.filter((o) => o.status !== "Annulée");
  const revenue = valid.reduce((a, o) => a + o.total, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      label: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      value: valid
        .filter((o) => new Date(o.date).toDateString() === d.toDateString())
        .reduce((a, o) => a + o.total, 0),
    };
  });
  const max = Math.max(...days.map((d) => d.value), 1);
  const stats = [
    {
      label: "Montant des commandes",
      value: money(revenue),
      note: "Hors commandes annulées",
      Icon: Wallet,
    },
    {
      label: "Commandes",
      value: orders.length,
      note: "Commandes enregistrées",
      Icon: ShoppingBag,
    },
    {
      label: "Produits en ligne",
      value: products.filter((p) => p.active).length,
      note: `${products.filter((p) => p.active && p.stock <= 5).length} avec un stock faible`,
      Icon: Package,
    },
    {
      label: "Clients",
      value: new Set(orders.map((o) => o.email.toLowerCase())).size,
      note: "D’après les e-mails de commande",
      Icon: Users,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow brand-text">
            VOTRE BOUTIQUE, EN UN COUP D’ŒIL
          </span>
          <h1>Bonjour, bienvenue chez vous.</h1>
          <p>Voici ce qui se passe dans votre boutique.</p>
        </div>
        <Link href="/admin/produits?ajouter=1" className="button dark">
          <Plus size={17} />
          Ajouter un produit
        </Link>
      </div>
      <div className="stat-grid">
        {stats.map(({ label, value, note, Icon }) => (
          <div className="stat-card" key={label}>
            <span className="stat-label">
              {label}
              <Icon />
            </span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <section className="panel">
          <div className="admin-section-title">
            <h2>Activité des 7 derniers jours</h2>
            <span className="eyebrow muted">COMMANDES EN AR</span>
          </div>
          <div className="bar-chart">
            {days.map((d, i) => (
              <div className="bar-column" key={i}>
                <small>{d.value ? money(d.value) : "0"}</small>
                <div
                  className="bar"
                  style={{ height: `${(d.value / max) * 155 + 3}px` }}
                />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          {!orders.length && (
            <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
              Passez une commande de test pour voir votre activité apparaître.
            </p>
          )}
        </section>
        <section className="panel">
          <div className="admin-section-title">
            <h2>Stocks à surveiller</h2>
            <Link
              href="/admin/produits"
              aria-label="Gérer les produits et stocks"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="stock-list">
            {products
              .filter((p) => p.active && p.stock <= 5)
              .slice(0, 4)
              .map((p) => (
                <div key={p.id}>
                  <Image width={700} height={600} src={p.image} alt="" />
                  <p>{p.name}</p>
                  <small>{p.stock ? `${p.stock} restants` : "Épuisé"}</small>
                </div>
              ))}
            {!products.some((p) => p.active && p.stock <= 5) && (
              <p className="muted">Tous vos stocks sont suffisants.</p>
            )}
          </div>
        </section>
      </div>
      <section style={{ marginTop: 30 }}>
        <div className="admin-section-title">
          <h2>Dernières commandes</h2>
          <Link href="/admin/commandes">Toutes les commandes ↗</Link>
        </div>
        {orders.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{new Date(o.date).toLocaleDateString("fr-FR")}</td>
                    <td>{money(o.total)}</td>
                    <td>
                      <span className="status-pill">{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty" style={{ padding: 35 }}>
            <ShoppingBag />
            <h2>Pas encore de commande</h2>
            <p>Les commandes passées dans la boutique apparaîtront ici.</p>
            <Link href="/catalogue" className="text-link">
              Tester la boutique ↗
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
