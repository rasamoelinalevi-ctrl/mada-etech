import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  categoryFor,
  cleanProductDescription,
  priceFromText,
  pricesFromText,
  slug,
  specsFromText,
} from "./product-import-lib";

type Candidate = {
  brand: string;
  folder: string;
  textFile: string;
  imageFile: string;
};

const option = (name: string) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
const root = option("root") || process.env.PRODUCT_IMPORT_ROOT;
const target = (option("url") || process.env.IMPORT_APP_URL || "").replace(
  /\/$/,
  "",
);
const limit = Math.min(Math.max(Number(option("limit") || 10), 1), 1000);
const commit = process.argv.includes("--commit");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

if (!root) throw new Error("Indiquez --root=... ou PRODUCT_IMPORT_ROOT.");
if (commit && !target) throw new Error("Indiquez --url=... ou IMPORT_APP_URL.");

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(full)));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function imageScore(file: string) {
  const normalized = file.toLowerCase();
  return (
    (normalized.includes(`${path.sep}montage${path.sep}`) ? -1000 : 100) +
    (normalized.includes("mada e-tech") ? -500 : 0) +
    (normalized.includes("marketplace") ? -500 : 0)
  );
}

async function candidates() {
  const brands = (await readdir(root!, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const byBrand: Candidate[][] = [];
  for (const brand of brands) {
    const brandPath = path.join(root!, brand.name);
    const folders = (await readdir(brandPath, { withFileTypes: true }))
      .filter(
        (entry) =>
          entry.isDirectory() && entry.name.toUpperCase() !== "MONTAGE",
      )
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
    const found: Candidate[] = [];
    for (const folder of folders) {
      const folderPath = path.join(brandPath, folder.name);
      const files = await filesBelow(folderPath);
      const texts = files.filter(
        (file) => path.extname(file).toLowerCase() === ".txt",
      );
      const images = files
        .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
        .sort(
          (a, b) => imageScore(b) - imageScore(a) || a.localeCompare(b, "fr"),
        );
      const usableText = [];
      for (const text of texts.sort((a, b) => a.localeCompare(b, "fr"))) {
        const prices = pricesFromText(await readFile(text, "utf8"));
        if (prices.length === 1) usableText.push(text);
      }
      if (usableText.length && images.length)
        found.push({
          brand: brand.name,
          folder: folder.name,
          textFile: usableText[0],
          imageFile: images[0],
        });
    }
    if (found.length) byBrand.push(found);
  }
  const selected: Candidate[] = [];
  for (let round = 0; selected.length < limit; round++) {
    let added = false;
    for (const brand of byBrand) {
      if (brand[round]) {
        selected.push(brand[round]);
        added = true;
        if (selected.length === limit) break;
      }
    }
    if (!added) break;
  }
  return selected;
}

async function imageData(file: string) {
  let bytes = await sharp(file, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: 1100,
      height: 1100,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  if (bytes.length > 1_050_000)
    bytes = await sharp(file, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: 900,
        height: 900,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 65 })
      .toBuffer();
  return `data:image/webp;base64,${bytes.toString("base64")}`;
}

const selected = await candidates();
if (selected.length < limit)
  throw new Error(
    `Seulement ${selected.length} produits exploitables trouvés sur ${limit}.`,
  );

const products = [];
for (const candidate of selected) {
  const source = await readFile(candidate.textFile, "utf8");
  const price = priceFromText(source);
  const description = cleanProductDescription(source);
  if (!price || description.length < 5)
    throw new Error(`Prix ou description introuvable : ${candidate.textFile}`);
  const id = `import-${slug(`${candidate.brand}-${candidate.folder}`)}`;
  products.push({
    id,
    sku: id.toUpperCase(),
    group: "",
    name: candidate.folder.trim(),
    brand: candidate.brand.trim(),
    category: categoryFor(candidate.folder, description),
    price,
    oldPrice: 0,
    stock: 0,
    image: await imageData(candidate.imageFile),
    description,
    specs: specsFromText(source),
    isNew: true,
    featured: false,
    active: false,
    source: {
      textFile: candidate.textFile,
      imageFile: candidate.imageFile,
    },
  });
}

await mkdir(".data", { recursive: true });
await writeFile(
  ".data/import-preview-10.json",
  JSON.stringify(
    products.map(({ image, ...product }) => ({
      ...product,
      imageBytes: image.length,
    })),
    null,
    2,
  ),
);

console.table(
  products.map((product) => ({
    id: product.id,
    marque: product.brand,
    nom: product.name,
    categorie: product.category,
    prix: product.price,
  })),
);

if (!commit) {
  console.log(
    "Aperçu généré dans .data/import-preview-10.json. Aucun produit importé.",
  );
  process.exit(0);
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password)
  throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD sont requis.");

const login = await fetch(`${target}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: target },
  body: JSON.stringify({ email, password }),
});
if (!login.ok)
  throw new Error(`Connexion administrateur refusée (${login.status}).`);
const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("Session administrateur absente.");
const storeResponse = await fetch(`${target}/api/store`, {
  headers: { cookie },
});
if (!storeResponse.ok)
  throw new Error(`Catalogue inaccessible (${storeResponse.status}).`);
const store = (await storeResponse.json()) as {
  admin?: boolean;
  products?: { id: string }[];
};
if (!store.admin)
  throw new Error("Le compte connecté n'est pas administrateur.");
const existing = new Set((store.products || []).map((product) => product.id));

let imported = 0;
for (const product of products) {
  if (existing.has(product.id)) {
    console.log(`Déjà présent, ignoré : ${product.id}`);
    continue;
  }
  const payload = Object.fromEntries(
    Object.entries(product).filter(([key]) => key !== "source"),
  );
  const response = await fetch(`${target}/api/admin/product`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: target, cookie },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      `${product.id} : ${result.error || `HTTP ${response.status}`}`,
    );
  }
  imported++;
  console.log(`Importé comme brouillon : ${product.name}`);
}
console.log(
  `${imported} produit(s) importé(s), inactifs et avec un stock à 0.`,
);
