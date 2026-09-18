"use client";
import { useState } from "react";
import { Eye, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { Modal } from "@/components/modal";
import { money } from "@/lib/data";
export default function Page() {
  const { orders, update, notify } = useStore();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState("");
  const statuses = [
    "En attente",
    "Confirmée",
    "En préparation",
    "Expédiée",
    "Livrée",
    "Annulée",
    "Retour demandé",
    "Remboursement à traiter",
  ];
  const [tracking, setTracking] = useState("");
  const order = orders.find((o) => o.id === selected);
  const list = orders.filter(
    (o) =>
      (o.id + " " + o.customer + " " + o.email)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!status || o.status === status),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Vos commandes</h1>
          <p>{orders.length} commande(s) enregistrée(s).</p>
        </div>
      </div>
      <div className="admin-toolbar">
        <input
          aria-label="Rechercher une commande"
          placeholder="Numéro de commande, nom ou e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtrer les commandes"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Client</th>
              <th>Date</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>
                  {o.customer}
                  <br />
                  <small className="muted">{o.email}</small>
                </td>
                <td>{new Date(o.date).toLocaleDateString("fr-FR")}</td>
                <td>{money(o.total)}</td>
                <td>
                  <span className="status-pill">{o.status}</span>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={"Ouvrir la commande " + o.id}
                    onClick={() => setSelected(o.id)}
                  >
                    <Eye size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <div className="empty">
            <ShoppingBag />
            <h2>Aucune commande à afficher</h2>
            <p>Les commandes de test de la boutique seront visibles ici.</p>
          </div>
        )}
      </div>
      {order && (
        <Modal title={"Commande " + order.id} onClose={() => setSelected("")}>
          <div className="form-grid">
            <div>
              <h3 style={{ fontSize: 14 }}>Client</h3>
              <p>{order.customer}</p>
              <p className="muted" style={{ fontSize: 13 }}>
                {order.email}
                <br />
                {order.phone}
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 14 }}>Livraison</h3>
              <p style={{ fontSize: 14 }}>
                {order.address}
                <br />
                {order.city}
              </p>
            </div>
          </div>
          <div style={{ margin: "25px 0" }}>
            {order.items.map((p, i) => (
              <div className="summary-line" key={i}>
                <span>
                  {p.quantity} × {p.name}
                </span>
                <strong>{money(p.price * p.quantity)}</strong>
              </div>
            ))}
            <div className="summary-line">
              <span>Livraison</span>
              <span>{money(order.shipping)}</span>
            </div>
            <div className="summary-line total">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              Paiement : {order.method}
            </p>
          </div>
          <label className="field">
            Numéro ou lien de suivi
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              maxLength={300}
            />
          </label>
          <label className="field">
            Statut de la commande
            <select
              value={order.status}
              onChange={async (e) => {
                const ok = await update({
                  orders: orders.map((o) =>
                    o.id === order.id
                      ? { ...o, status: e.target.value, tracking }
                      : o,
                  ),
                });
                if (ok) notify("Statut de la commande mis à jour.");
              }}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="notice neutral">
            Les transitions sont contrôlées côté serveur. Le paiement ne peut
            pas être confirmé manuellement. Les remboursements doivent être
            traités avec le prestataire.
          </div>
        </Modal>
      )}
    </>
  );
}
