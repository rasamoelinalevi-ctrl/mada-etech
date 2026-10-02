import Link from "next/link";
import { ShopShell } from "@/components/shop-shell";
export default function NotFound() {
  return (
    <ShopShell>
      <div className="container page-content" style={{ paddingTop: 60 }}>
        <div className="empty">
          <span className="eyebrow brand-text">ERREUR 404</span>
          <h1>Cette page a pris une autre direction.</h1>
          <p>Retrouvez toute notre sélection dans la boutique.</p>
          <Link href="/" className="button dark">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </ShopShell>
  );
}
