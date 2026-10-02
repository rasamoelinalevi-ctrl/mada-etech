"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import {
  Zap,
  Search,
  Heart,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowUpRight,
  Truck,
  ShieldCheck,
  Headphones,
  Smartphone,
  Laptop,
  Watch,
  Cable,
  House,
  LayoutGrid,
} from "lucide-react";
import { useStore } from "./store-provider";
import { categories, money } from "@/lib/data";
export const categoryIcons = [Smartphone, Laptop, Headphones, Watch, Cable];
export function Brand({ light = false }: { light?: boolean }) {
  const { settings } = useStore();
  return (
    <Link href="/" className="brand" aria-label="Accueil">
      <Image
        src={
          light ? "/brand/mada-etech-light.png" : "/brand/mada-etech-dark.png"
        }
        alt={settings.name}
        width={600}
        height={216}
      />
    </Link>
  );
}
function CategoryRail({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const path = usePathname();
  const params = useSearchParams();
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 760px)").matches) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key === "Tab") {
        const elements = Array.from(
          panel.current?.querySelectorAll<HTMLElement>("a,button") || [],
        ).filter((el) => el.offsetParent !== null);
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [open]);
  const links = [
    { label: "Accueil", href: "/", Icon: House, active: path === "/" },
    {
      label: "Catalogue",
      href: "/catalogue",
      Icon: LayoutGrid,
      active: path === "/catalogue" && !params.get("categorie"),
    },
    ...categories.map((label, i) => ({
      label,
      href: "/catalogue?categorie=" + encodeURIComponent(label),
      Icon: categoryIcons[i],
      active: path === "/catalogue" && params.get("categorie") === label,
    })),
    {
      label: "Bons plans",
      href: "/promotions",
      Icon: Zap,
      active: path === "/promotions",
    },
  ];
  return (
    <>
      {open && (
        <button
          className="rail-backdrop"
          tabIndex={-1}
          aria-label="Fermer les catégories"
          onClick={onClose}
        />
      )}
      <aside
        ref={panel}
        id="category-menu"
        className={"category-rail" + (open ? " is-open" : "")}
        aria-label="Menu des catégories"
      >
        <button
          className="rail-close"
          aria-label="Fermer le menu"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        <Link
          className="rail-logo"
          href="/"
          onClick={onClose}
          aria-label="MADA E-TECH — Accueil"
        >
          <Image
            src="/brand/mada-etech-symbol.png"
            alt=""
            width={48}
            height={48}
          />
        </Link>
        <span className="rail-heading">EXPLORER</span>
        <nav aria-label="Catégories de produits">
          {links.map(({ label, href, Icon, active }) => (
            <Link
              href={href}
              key={label}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
              onClick={onClose}
            >
              <Icon size={24} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="rail-mobile-links">
          <Link href="/nouveautes" onClick={onClose}>
            Nouveautés
          </Link>
          <Link href="/marques" onClick={onClose}>
            Nos marques
          </Link>
          <Link href="/compte" onClick={onClose}>
            Mon compte
          </Link>
        </div>
        <Link className="rail-contact" href="/contact" onClick={onClose}>
          <Headphones size={22} />
          <span>Un conseil ?</span>
        </Link>
      </aside>
    </>
  );
}
export function ShopShell({ children }: { children: React.ReactNode }) {
  const { cart, favorites, settings } = useStore(),
    router = useRouter();
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  return (
    <div className="shop-layout">
      <Suspense fallback={null}>
        <CategoryRail open={menu} onClose={() => setMenu(false)} />
      </Suspense>
      <div className="topbar">
        <div className="container">
          <span>MADA E-TECH · La technologie, proche de vous.</span>
          <span>
            <Truck size={14} /> Livraison offerte dès{" "}
            {money(settings.freeShipping)}{" "}
            <span className="top-location">· Madagascar</span>
          </span>
        </div>
      </div>
      <header>
        <div className="container main-header">
          <Brand />
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/catalogue?q=" + encodeURIComponent(query));
              setMenu(false);
            }}
          >
            <Search size={20} />
            <input
              aria-label="Rechercher un produit"
              placeholder="Un produit, une marque, une envie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button aria-label="Lancer la recherche">
              <ArrowUpRight size={19} />
            </button>
          </form>
          <div className="header-actions">
            <Link
              href="/favoris"
              aria-label={`Mes favoris (${favorites.length})`}
            >
              <Heart />
              <span>Favoris</span>
              {favorites.length > 0 && <b>{favorites.length}</b>}
            </Link>
            <Link href="/compte">
              <UserRound />
              <span>Mon compte</span>
            </Link>
            <Link
              href="/panier"
              className="cart-link"
              aria-label={`Mon panier (${cart.reduce((a, x) => a + x.quantity, 0)})`}
            >
              <ShoppingBag />
              <span>Mon panier</span>
              <b>{cart.reduce((a, x) => a + x.quantity, 0)}</b>
            </Link>
            <button
              className="mobile-menu"
              aria-label="Ouvrir le menu"
              aria-expanded={menu}
              aria-controls="category-menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav
          className="container navigation"
          aria-label="Navigation principale"
        >
          <Link href="/nouveautes" onClick={() => setMenu(false)}>
            Nouveautés <span className="tiny-badge">NEW</span>
          </Link>
          <Link href="/promotions" onClick={() => setMenu(false)}>
            <Zap size={15} /> Bons plans
          </Link>
          <Link href="/marques" onClick={() => setMenu(false)}>
            Nos marques
          </Link>
          <Link href="/contact" onClick={() => setMenu(false)}>
            Nous contacter
          </Link>
          <span className="nav-help">
            <Headphones size={16} /> Besoin d’un conseil ?
          </span>
        </nav>
      </header>
      <main id="main">{children}</main>
      <section className="reassurance container">
        <div>
          <Truck />
          <span>
            <strong>Livraison à Madagascar</strong>
            <small>À domicile ou en point de retrait</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>Achetez en confiance</strong>
            <small>Des produits sélectionnés avec soin</small>
          </span>
        </div>
        <div>
          <Headphones />
          <span>
            <strong>Une équipe à votre écoute</strong>
            <small>Avant et après votre achat</small>
          </span>
        </div>
      </section>
      <footer>
        <div className="container footer-grid">
          <div>
            <Brand light />
            <p>
              Votre univers connecté,
              <br />
              signé MADA E-TECH.
            </p>
            <span className="footer-country">Antananarivo · Madagascar</span>
          </div>
          <div>
            <h3>La boutique</h3>
            <Link href="/catalogue">Tous les produits</Link>
            <Link href="/nouveautes">Nouveautés</Link>
            <Link href="/promotions">Bons plans</Link>
            <Link href="/marques">Nos marques</Link>
          </div>
          <div>
            <h3>À votre service</h3>
            <Link href="/contact">Nous contacter</Link>
            <Link href="/livraison">Livraison & retours</Link>
            <Link href="/faq">Questions fréquentes</Link>
            <Link href="/compte">Mes commandes</Link>
          </div>
          <div>
            <h3>Restons en contact</h3>
            <p>{settings.address}</p>
            <a href={"mailto:" + settings.email}>{settings.email}</a>
            <a href={"tel:" + settings.phone.replace(/\s/g, "")}>
              {settings.phone}
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} {settings.name}. Tous droits réservés.
          </span>
          <Link href="/mentions-legales">Informations & confidentialité</Link>
          <Link href="/admin">
            Administration <ArrowUpRight size={13} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
export function Breadcrumb({ label }: { label: string }) {
  return (
    <div className="breadcrumb">
      <Link href="/">Accueil</Link>
      <span>/</span>
      <span>{label}</span>
    </div>
  );
}
