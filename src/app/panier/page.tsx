import { ShopShell, Breadcrumb } from "@/components/shop-shell";
import { Cart } from "@/components/cart";
export default function Page() {
  return (
    <ShopShell>
      <div className="container page-content">
        <Breadcrumb label="Panier" />
        <div className="page-heading">
          <div>
            <h1>Votre panier</h1>
            <p>Vos prochaines découvertes sont juste ici.</p>
          </div>
        </div>
        <Cart />
      </div>
    </ShopShell>
  );
}
