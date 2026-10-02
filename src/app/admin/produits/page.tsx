"use client";
import Image from "next/image";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Archive, ArchiveRestore, Search } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { Modal } from "@/components/modal";
import { categories, money, type Product } from "@/lib/data";
const blank: Product = {
  id: "",
  name: "",
  brand: "",
  category: categories[0],
  price: 0,
  oldPrice: 0,
  stock: 1,
  image: "/images/iphone.webp",
  description: "",
  specs: {},
  isNew: true,
  featured: false,
  active: true,
};
export default function Page() {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <ProductsAdmin />
    </Suspense>
  );
}
function ProductsAdmin() {
  const { products, update, notify, busy } = useStore(),
    params = useSearchParams();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState("all"),
    [editing, setEditing] = useState<Product | null>(() =>
      params.get("ajouter") ? { ...blank } : null,
    ),
    [archive, setArchive] = useState<Product | null>(null);
  const list = products.filter(
    (p) =>
      (p.name + " " + p.brand).toLowerCase().includes(query.toLowerCase()) &&
      (!category || p.category === category) &&
      (status === "all" || (status === "active" ? p.active : !p.active)),
  );
  const toggleActive = async (p: Product) => {
    const ok = await update({
      products: products.map((x) =>
        x.id === p.id ? { ...x, active: !x.active } : x,
      ),
    });
    if (!ok) return;
    notify(
      p.active
        ? "Produit archivé. Vous pouvez le restaurer à tout moment."
        : "Produit restauré dans la boutique.",
    );
    setArchive(null);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Vos produits</h1>
          <p>{products.length} produits · Un catalogue qui vous ressemble.</p>
        </div>
        <button
          className="button dark"
          onClick={() => setEditing({ ...blank })}
        >
          <Plus size={17} />
          Ajouter un produit
        </button>
      </div>
      {busy && <p role="status">Enregistrement…</p>}
      <div className="admin-toolbar">
        <input
          aria-label="Rechercher dans les produits"
          placeholder="Rechercher un produit, une marque…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtrer par catégorie"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Filtrer par statut"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">En ligne</option>
          <option value="archived">Archivés</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="table-product">
                    <Image width={700} height={600} src={p.image} alt="" />
                    <div>
                      <strong>{p.name}</strong>
                      <small>{p.brand}</small>
                    </div>
                  </div>
                </td>
                <td>{p.category}</td>
                <td>{money(p.price)}</td>
                <td>
                  <span
                    className={"admin-stock " + (p.stock <= 5 ? "low" : "")}
                  >
                    {p.stock} unités
                  </span>
                </td>
                <td>
                  <span className="status-pill">
                    {p.active ? "En ligne" : "Archivé"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      aria-label={"Modifier " + p.name}
                      onClick={() => setEditing({ ...p })}
                    >
                      <Pencil />
                    </button>
                    <button
                      aria-label={
                        (p.active ? "Archiver " : "Restaurer ") + p.name
                      }
                      onClick={() =>
                        p.active ? setArchive(p) : toggleActive(p)
                      }
                    >
                      {p.active ? <Archive /> : <ArchiveRestore />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && (
          <div className="empty">
            <Search />
            <h2>Aucun produit ne correspond.</h2>
            <p>Modifiez votre recherche ou ajoutez un produit.</p>
          </div>
        )}
      </div>
      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(null)}
          onSave={async (p) => {
            const ok = await update({
              products: p.id
                ? products.map((x) => (x.id === p.id ? p : x))
                : [
                    { ...p, id: "produit-" + crypto.randomUUID().slice(0, 8) },
                    ...products,
                  ],
            });
            if (!ok) return;
            notify(
              p.id
                ? "Produit mis à jour dans la boutique."
                : "Nouveau produit ajouté à la boutique.",
            );
            setEditing(null);
          }}
        />
      )}
      {archive && (
        <Modal title="Archiver ce produit ?" onClose={() => setArchive(null)}>
          <p>
            {archive.name} sera masqué dans la boutique. Les commandes
            existantes seront conservées. Vous pourrez le restaurer ici.
          </p>
          <div className="modal-footer">
            <button className="button outline" onClick={() => setArchive(null)}>
              Annuler
            </button>
            <button
              className="button dark"
              onClick={() => toggleActive(archive)}
            >
              Archiver le produit
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ProductEditor({
  product,
  onSave,
  onClose,
}: {
  product: Product;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const [image, setImage] = useState(product.image),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  return (
    <Modal
      title={product.id ? "Modifier le produit" : "Ajouter un produit"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget);
          const price = Number(f.get("price")),
            oldPrice = Number(f.get("oldPrice")),
            stock = Number(f.get("stock"));
          if (price <= 0 || stock < 0 || !Number.isInteger(stock))
            return setError(
              "Le prix doit être positif et le stock un entier supérieur ou égal à zéro.",
            );
          if (oldPrice > 0 && oldPrice <= price)
            return setError(
              "Le prix barré doit être supérieur au prix de vente, ou égal à zéro.",
            );
          const name = String(f.get("name")).trim(),
            brand = String(f.get("brand")).trim(),
            description = String(f.get("description")).trim();
          if (!name || !brand || !description)
            return setError("Complétez le nom, la marque et la description.");
          const specs = Object.fromEntries(
            String(f.get("specs"))
              .split("\n")
              .filter((x) => x.includes(":"))
              .map((x) => {
                const i = x.indexOf(":");
                return [x.slice(0, i).trim(), x.slice(i + 1).trim()];
              })
              .filter(([k, v]) => k && v),
          );
          onSave({
            ...product,
            sku: String(f.get("sku")).trim(),
            group: String(f.get("group")).trim(),
            name,
            brand,
            description,
            category: String(f.get("category")),
            price,
            oldPrice,
            stock,
            image,
            specs,
            isNew: f.has("isNew"),
            featured: f.has("featured"),
            active: f.has("active"),
          });
        }}
      >
        <div className="form-grid">
          <label className="field">
            SKU unique
            <input
              name="sku"
              required
              maxLength={100}
              defaultValue={product.sku || product.id}
            />
          </label>
          <label className="field">
            Groupe de variantes
            <input
              name="group"
              maxLength={100}
              defaultValue={product.group || ""}
              placeholder="Ex. iphone-13-pro"
            />
          </label>
          <label className="field full">
            Nom du produit
            <input
              name="name"
              required
              defaultValue={product.name}
              placeholder="Ex. Samsung Galaxy…"
              maxLength={100}
            />
          </label>
          <label className="field">
            Marque
            <input name="brand" required defaultValue={product.brand} />
          </label>
          <label className="field">
            Catégorie
            <select name="category" defaultValue={product.category}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Prix de vente (Ar)
            <input
              name="price"
              type="number"
              min="1"
              step="1"
              required
              defaultValue={product.price || ""}
            />
          </label>
          <label className="field">
            Ancien prix (0 = pas de promotion)
            <input
              name="oldPrice"
              type="number"
              min="0"
              step="1"
              defaultValue={product.oldPrice}
            />
          </label>
          <label className="field">
            Stock disponible
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={product.stock}
            />
          </label>
          <div className="field">
            <span>Image du produit</span>
            <div className="preview-upload">
              <Image
                width={700}
                height={600}
                src={image}
                alt="Aperçu du produit"
              />
              <label>
                <span style={{ fontSize: 11 }}>
                  JPEG, PNG ou WebP · max. 2 Mo
                </span>
                <input
                  aria-label="Choisir une image produit"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        file.type,
                      ) ||
                      file.size > 2 * 1024 * 1024
                    ) {
                      setError(
                        "Choisissez une image JPEG, PNG ou WebP de moins de 2 Mo.",
                      );
                      return;
                    }
                    setLoading(true);
                    setError("");
                    try {
                      const bitmap = await createImageBitmap(file);
                      const canvas = document.createElement("canvas");
                      const ratio = Math.min(
                        1,
                        700 / Math.max(bitmap.width, bitmap.height),
                      );
                      canvas.width = Math.round(bitmap.width * ratio);
                      canvas.height = Math.round(bitmap.height * ratio);
                      canvas
                        .getContext("2d")!
                        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                      setImage(canvas.toDataURL("image/webp", 0.8));
                      bitmap.close();
                    } catch {
                      setError("Cette image ne peut pas être lue.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <label className="field full">
            Description
            <textarea
              name="description"
              required
              defaultValue={product.description}
            />
          </label>
          <label className="field full">
            Caractéristiques (une par ligne : Libellé : Valeur)
            <textarea
              name="specs"
              defaultValue={Object.entries(product.specs)
                .map(([k, v]) => k + " : " + v)
                .join("\n")}
              placeholder={"Écran : 6,1 pouces\nStockage : 128 Go"}
            />
          </label>
          <div
            className="full"
            style={{ display: "flex", gap: 20, flexWrap: "wrap" }}
          >
            <label className="check-label">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product.active}
              />
              En ligne
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                name="isNew"
                defaultChecked={product.isNew}
              />
              Nouveauté
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product.featured}
              />
              Incontournable
            </label>
          </div>
        </div>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="button outline" onClick={onClose}>
            Annuler
          </button>
          <button className="button dark" disabled={loading}>
            {loading ? "Préparation de l’image…" : "Enregistrer le produit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
