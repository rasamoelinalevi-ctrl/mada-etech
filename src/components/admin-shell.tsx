"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "./shop-shell";
const nav = [
  { href: "/admin", label: "Vue d’ensemble", Icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits", Icon: Package },
  { href: "/admin/commandes", label: "Commandes", Icon: ShoppingBag },
  { href: "/admin/messages", label: "Messages", Icon: MessageSquare },
  { href: "/admin/exploitation", label: "Promotions et suivi", Icon: Settings },
  { href: "/admin/parametres", label: "Paramètres", Icon: Settings },
];
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <Brand />
        <span className="admin-label">ESPACE ADMINISTRATION</span>
        <nav className="admin-nav" aria-label="Administration">
          {nav.map(({ href, label, Icon }) => (
            <Link
              className={path === href ? "active" : ""}
              href={href}
              key={href}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
        <Link className="back-to-shop" href="/">
          Voir la boutique <ArrowUpRight size={15} />
        </Link>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <span>
            Administration /{" "}
            {nav.find((n) => n.href === path)?.label || "Tableau de bord"}
          </span>
          <span className="admin-user">
            <span className="avatar">MT</span>Administrateur
          </span>
        </div>
        <div className="admin-content">
          <div className="admin-demo">
            Espace sécurisé · Modifications enregistrées en base de données
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
