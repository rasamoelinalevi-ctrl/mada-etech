"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { ShopShell, Breadcrumb } from "./shop-shell";
import { ProductGrid } from "./product-card";
import { useStore } from "./store-provider";
import { categories, money } from "@/lib/data";
export function Catalogue({ mode = "all" }: { mode?: "all" | "new" | "sale" }) {
  return (
    <ShopShell>
      <Suspense
        fallback={
          <div className="container page-content">Chargement du catalogue…</div>
        }
      >
        <CatalogueWithQuery mode={mode} />
      </Suspense>
    </ShopShell>
  );
}
function CatalogueWithQuery({ mode }: { mode: string }) {
  const params = useSearchParams();
  // A new URL search starts a fresh set of filters, including client navigation.
  return <CatalogueContent key={mode + params.toString()} mode={mode} />;
}
function CatalogueContent({ mode }: { mode: string }) {
  const params = useSearchParams();
  const { products } = useStore();
  const initialCategory = params.get("categorie") || "",
    initialBrand = params.get("marque") || "";
  const [cats, setCats] = useState<string[]>(
      initialCategory ? [initialCategory] : [],
    ),
    [brands, setBrands] = useState<string[]>(
      initialBrand ? [initialBrand] : [],
    ),
    [max, setMax] = useState(Number.MAX_SAFE_INTEGER),
    [stock, setStock] = useState(false),
    [sort, setSort] = useState("featured"),
    [page, setPage] = useState(1);
  const query = params.get("q") || "";
  const title =
    mode === "new"
      ? "Les nouveautés"
      : mode === "sale"
        ? "Les bons plans"
        : "Explorez notre catalogue";
  const normalize = (s: string) =>
    s
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  let filtered = products.filter(
    (p) =>
      p.active &&
      (!cats.length || cats.includes(p.category)) &&
      (!brands.length || brands.includes(p.brand)) &&
      p.price <= max &&
      (!stock || p.stock > 0) &&
      (mode !== "new" || p.isNew) &&
      (mode !== "sale" || p.oldPrice > p.price) &&
      normalize(
        p.name +
          " " +
          p.brand +
          " " +
          p.category +
          " " +
          p.description +
          " " +
          Object.values(p.specs).join(" "),
      ).includes(normalize(query)),
  );
  filtered = [...filtered].sort((a, b) =>
    sort === "asc"
      ? a.price - b.price
      : sort === "desc"
        ? b.price - a.price
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : Number(b.featured) - Number(a.featured),
  );
  const toggle = (v: string, list: string[], set: (v: string[]) => void) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    setPage(1);
  };
  return (
    <div className="container page-content">
      <Breadcrumb label={mode === "all" ? "Catalogue" : title} />
      <div className="page-heading">
        <div>
          <span className="eyebrow brand-text">LA TECH, À VOTRE FAÇON</span>
          <h1>{title}</h1>
          <p>
            {query
              ? `Résultats pour « ${query} »`
              : "Trouvez le produit qui vous ressemble."}
          </p>
        </div>
      </div>
      <div className="catalog-layout">
        <aside className="filters" aria-label="Filtres du catalogue">
          <div className="filter-group">
            <h3>Catégories</h3>
            {categories.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={cats.includes(c)}
                  onChange={() => toggle(c, cats, setCats)}
                />
                {c}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h3>Marques</h3>
            {[...new Set(products.map((p) => p.brand))].map((b) => (
              <label key={b}>
                <input
                  type="checkbox"
                  checked={brands.includes(b)}
                  onChange={() => toggle(b, brands, setBrands)}
                />
                {b}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h3>Votre budget</h3>
            <input
              type="range"
              aria-label="Prix maximum"
              min="0"
              max={Math.max(1, ...products.map((p) => p.price))}
              step="100000"
              value={Math.min(
                max,
                Math.max(1, ...products.map((p) => p.price)),
              )}
              onChange={(e) => {
                setMax(+e.target.value);
                setPage(1);
              }}
            />
            <small>
              Jusqu’à{" "}
              {money(
                Math.min(max, Math.max(1, ...products.map((p) => p.price))),
              )}
            </small>
            <label>
              <input
                type="checkbox"
                checked={stock}
                onChange={(e) => {
                  setStock(e.target.checked);
                  setPage(1);
                }}
              />
              En stock uniquement
            </label>
          </div>
          <button
            className="reset-filters"
            onClick={() => {
              setCats([]);
              setBrands([]);
              setMax(Number.MAX_SAFE_INTEGER);
              setStock(false);
              setPage(1);
            }}
          >
            Réinitialiser les filtres
          </button>
        </aside>
        <div>
          <div className="catalog-toolbar">
            <span>
              {filtered.length} produit{filtered.length > 1 ? "s" : ""}
            </span>
            <select
              aria-label="Trier les produits"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="featured">Notre sélection</option>
              <option value="asc">Prix croissant</option>
              <option value="desc">Prix décroissant</option>
              <option value="name">Nom : A à Z</option>
            </select>
          </div>
          {filtered.length ? (
            <>
              <ProductGrid
                products={filtered.slice((page - 1) * 9, page * 9)}
              />
              {filtered.length > 9 && (
                <div className="pagination">
                  {Array.from(
                    { length: Math.ceil(filtered.length / 9) },
                    (_, i) => (
                      <button
                        className={page === i + 1 ? "active" : ""}
                        key={i}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ),
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <SearchX />
              <h2>Aucun produit trouvé</h2>
              <p>Essayez une autre recherche ou élargissez vos filtres.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
