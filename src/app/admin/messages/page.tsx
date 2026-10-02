"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useStore } from "@/components/store-provider";
export default function Page() {
  const { messages } = useStore();
  const [query, setQuery] = useState("");
  const list = messages.filter((m) =>
    (m.name + " " + m.email + " " + m.message)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Vos messages</h1>
          <p>Les demandes enregistrées depuis le formulaire de contact.</p>
        </div>
      </div>
      <div className="admin-toolbar">
        <input
          aria-label="Rechercher un message"
          placeholder="Rechercher dans les messages…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {list.length ? (
        list.map((m) => (
          <article className="panel" style={{ marginBottom: 18 }} key={m.id}>
            <div className="admin-section-title">
              <div>
                <strong>{m.name}</strong>
                <p className="muted" style={{ fontSize: 13 }}>
                  {m.email}
                </p>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {new Date(m.date).toLocaleString("fr-FR")}
              </span>
            </div>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{m.message}</p>
          </article>
        ))
      ) : (
        <div className="empty">
          <MessageSquare />
          <h2>Aucun message pour le moment.</h2>
          <p>Testez le formulaire de contact de la boutique.</p>
        </div>
      )}
    </>
  );
}
