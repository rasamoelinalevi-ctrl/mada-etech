import { test } from "node:test";
import assert from "node:assert/strict";
import {
  categoryFor,
  cleanProductDescription,
  priceFromText,
  pricesFromText,
  priceVariantsFromText,
  slug,
  specsFromText,
} from "../scripts/product-import-lib";

test("extrait un prix en ariary avec espaces fines", () => {
  assert.equal(
    priceFromText("Prix : 3 200 000 Ar ou 16 000 000 fmg"),
    3_200_000,
  );
  assert.equal(priceFromText("512 Go / Prix : 280.000Ar"), 280_000);
  assert.deepEqual(
    pricesFromText("Prix : 280 000 Ar\n1 To / Prix : 385 000 Ar"),
    [280_000, 385_000],
  );
  assert.deepEqual(
    priceVariantsFromText("128 Go → 70 000 Ar\n64 Go → 45 000 Ar"),
    [
      { label: "128 Go", price: 70_000 },
      { label: "64 Go", price: 45_000 },
    ],
  );
  assert.equal(
    priceFromText("Prix : 1 900 000 Ar\nPrix : 1 568 000 Ar"),
    1_568_000,
  );
});

test("nettoie les informations commerciales non produit", () => {
  const text = `PAGE :\nProduit exemple\nPrix : 50 000 Ar\nDescription utile\nContactez-nous : 034 00 000 00\n#Promo`;
  assert.equal(
    cleanProductDescription(text),
    "Produit exemple\nDescription utile",
  );
});

test("classe les familles principales", () => {
  assert.equal(categoryFor("Acer Aspire laptop"), "Ordinateurs");
  assert.equal(categoryFor("Casque Bluetooth"), "Audio & son");
  assert.equal(categoryFor("Adaptateur USB"), "Accessoires");
  assert.equal(categoryFor("Clé wifi", "Pour votre ordinateur"), "Réseau & connectivité");
  assert.equal(categoryFor("Canon Pixma", "Imprimante multifonction"), "Impression & projection");
  assert.equal(categoryFor("SSD NVMe externe"), "Stockage");
  assert.equal(categoryFor("Power Bank 20000 mAh"), "Énergie & charge");
  assert.equal(
    categoryFor("Acer Aspire", "Ordinateur portable\nCâble USB inclus"),
    "Ordinateurs",
  );
});

test("génère un identifiant sûr et extrait des caractéristiques", () => {
  assert.equal(slug("Écran ASUS 15,6 pouces"), "ecran-asus-15-6-pouces");
  assert.deepEqual(specsFromText("Processeur : Intel Core i5\nPrix : 10 Ar"), {
    Processeur: "Intel Core i5",
  });
});
