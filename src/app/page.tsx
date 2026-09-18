"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Zap } from "lucide-react";
import { ShopShell, categoryIcons } from "@/components/shop-shell";
import { ProductGrid, SectionTitle } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
import { categories, money } from "@/lib/data";
export default function Home() {
  const { products, settings } = useStore();
  const live = products.filter((p) => p.active);
  const featured = live.find((p) => p.featured) || live[0];
  return (
    <ShopShell>
      <div className="container home">
        <div className="hero-grid">
          <section className="hero-main">
            <div className="hero-copy">
              <span className="hero-label">
                <span /> L’UNIVERS MADA E-TECH
              </span>
              <h1>{settings.heroTitle}</h1>
              <p>{settings.heroText}</p>
              <Link
                href={featured ? "/produit/" + featured.id : "/catalogue"}
                className="button primary-cta"
              >
                Découvrir {featured?.name || "le catalogue"}{" "}
                <ArrowUpRight size={19} />
              </Link>
              <div className="hero-price">
                À partir de <strong>{money(featured?.price || 0)}</strong>
              </div>
            </div>
            <div className="hero-art">
              <span className="hero-orbit" />
              <span className="hero-bigtype">MAX</span>
              <Image
                src={featured?.image || "/images/airpods-max.webp"}
                alt={featured?.name || "Sélection électronique"}
                fetchPriority="high"
                width="550"
                height="550"
              />
              <span className="hero-caption">
                {featured?.name} <span>NOTRE SÉLECTION</span>
              </span>
            </div>
          </section>
          <div className="hero-side">
            <Link
              href="/catalogue?categorie=Smartphones"
              className="promo-tile phone-tile"
            >
              <div>
                <span className="eyebrow">VOTRE QUOTIDIEN, EN MIEUX</span>
                <h2>
                  Un nouveau
                  <br />
                  monde en main.
                </h2>
                <span className="tile-link">
                  Nos smartphones <ArrowUpRight size={17} />
                </span>
              </div>
              <Image
                src="/images/iphone.webp"
                alt="iPhone 13 Pro"
                width="230"
                height="230"
              />
            </Link>
            <Link href="/promotions" className="promo-tile sale-tile">
              <span className="eyebrow">
                <Zap size={13} /> PETITS PRIX, GRANDES ENVIES
              </span>
              <div>
                <h2>
                  La tech.
                  <br />
                  Le prix en moins.
                </h2>
                <span className="round-link">
                  <ArrowUpRight />
                </span>
              </div>
              <span className="sale-note">Découvrez les offres du moment</span>
            </Link>
          </div>
        </div>
        <div className="brand-strip">
          <span>LES MARQUES QUE VOUS AIMEZ</span>
          <strong className="apple-brand">Apple</strong>
          <strong className="samsung-brand">SAMSUNG</strong>
          <strong>
            amazon<span className="orange-dot">.</span>
          </strong>
          <Link href="/marques">
            Toutes nos marques <ArrowRight size={15} />
          </Link>
        </div>
        <section className="categories-section">
          <SectionTitle
            title="Explorez votre univers connecté."
            href="/catalogue"
            label="Explorer le catalogue"
          />
          <div className="category-grid">
            {categories.map((cat, i) => {
              const Icon = categoryIcons[i];
              return (
                <Link
                  href={"/catalogue?categorie=" + encodeURIComponent(cat)}
                  key={cat}
                >
                  <span className={"category-icon tone-" + i}>
                    <Icon size={30} strokeWidth={1.5} />
                  </span>
                  <strong>{cat}</strong>
                  <small>
                    {live.filter((p) => p.category === cat).length} produits
                  </small>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="bestsellers">
          <SectionTitle
            eyebrow="BIEN CHOISIS. DÉJÀ ADOPTÉS."
            title="Les incontournables"
            href="/catalogue"
          />
          <ProductGrid products={live.filter((p) => p.featured).slice(0, 4)} />
        </section>
        <section className="wide-promo">
          <div>
            <span className="eyebrow">POUR LES GRANDES IDÉES</span>
            <h2>
              Le bon outil.
              <br />
              Le début de tout.
            </h2>
            <p>Du premier projet à votre prochaine réussite.</p>
            <Link
              href="/catalogue?categorie=Ordinateurs"
              className="button dark"
            >
              Trouver mon ordinateur <ArrowUpRight size={18} />
            </Link>
          </div>
          <Image
            src="/images/macbook.webp"
            alt="MacBook Pro 14 pouces"
            width="540"
            height="340"
          />
        </section>
        <section>
          <SectionTitle
            eyebrow="LA SÉLECTION À DÉCOUVRIR"
            title="Du nouveau dans votre quotidien"
            href="/nouveautes"
          />
          <ProductGrid products={live.filter((p) => p.isNew).slice(0, 4)} />
        </section>
        <section className="contact-banner">
          <span className="contact-spark">
            <Zap size={29} />
          </span>
          <div>
            <h2>Un doute ? Parlons tech.</h2>
            <p>Nous vous aidons à trouver le produit qui vous correspond.</p>
          </div>
          <Link href="/contact" className="button outline">
            Contacter notre équipe <ArrowUpRight size={18} />
          </Link>
        </section>
      </div>
    </ShopShell>
  );
}
