import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  categoryFor,
  cleanProductDescription,
  priceFromText,
  pricesFromText,
  priceVariantsFromText,
  slug,
  specsFromText,
} from "./product-import-lib";

type Candidate = {
  brand: string;
  folder: string;
  idPath: string;
  textFile: string;
  imageFiles: string[];
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
const importAll = process.argv.includes("--all");
const limit = importAll
  ? 1000
  : Math.min(Math.max(Number(option("limit") || 10), 1), 1000);
const commit = process.argv.includes("--commit");
const skipped: { brand: string; folder: string; reason: string }[] = [];
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

function imageScore(file: string, productDirectory: string) {
  const normalized = file.toLowerCase();
  return (
    (path.dirname(file) === productDirectory ? 180 : 0) +
    (normalized.includes(`${path.sep}photos reel${path.sep}`) ? 350 : 0) +
    (/[/\\]img[_-]?\d/i.test(file) ? 250 : 0) +
    (normalized.includes("capture d") ? 120 : 0) +
    (normalized.includes(`${path.sep}montage${path.sep}`) ? -1000 : 100) +
    (normalized.includes("mada e-tech") ? -500 : 0) +
    (normalized.includes("marketplace") ? -800 : 0) +
    (normalized.includes("story") ? -700 : 0) +
    (normalized.includes("logo") ? -900 : 0)
  );
}

function productDirectory(textFile: string) {
  const parent = path.dirname(textFile);
  return path.basename(parent).toUpperCase() === "MONTAGE"
    ? path.dirname(parent)
    : parent;
}

async function directFiles(directory: string) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(directory, entry.name));
}

async function candidates() {
  const brands = (await readdir(root!, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const byBrand: Candidate[][] = [];
  for (const brand of brands) {
    const brandPath = path.join(root!, brand.name);
    const brandFiles = await filesBelow(brandPath);
    const groupedTexts = new Map<string, string[]>();
    for (const text of brandFiles.filter(
      (file) => path.extname(file).toLowerCase() === ".txt",
    )) {
      const directory = productDirectory(text);
      groupedTexts.set(directory, [...(groupedTexts.get(directory) || []), text]);
    }
    const found: Candidate[] = [];
    for (const [folderPath, texts] of groupedTexts) {
      const usableText: { file: string; descriptionLength: number; score: number }[] = [];
      for (const text of texts.sort((a, b) => a.localeCompare(b, "fr"))) {
        const source = await readFile(text, "utf8");
        const prices = pricesFromText(source);
        const variants = priceVariantsFromText(source);
        if (!prices.length && !variants.length) continue;
        const normalized = text.toLowerCase();
        usableText.push({
          file: text,
          descriptionLength: cleanProductDescription(source).length,
          score:
            (normalized.includes("marketplace") ? -500 : 0) +
            (normalized.includes(`${path.sep}montage${path.sep}`) ? -200 : 0),
        });
      }
      if (!usableText.length) {
        skipped.push({
          brand: brand.name,
          folder: path.relative(brandPath, folderPath) || brand.name,
          reason: "Aucun texte avec un prix unique",
        });
        continue;
      }
      const direct = await directFiles(folderPath);
      let imagePool = direct.filter((file) =>
        imageExtensions.has(path.extname(file).toLowerCase()),
      );
      if (!imagePool.length) {
        imagePool = (await filesBelow(folderPath)).filter((file) =>
          imageExtensions.has(path.extname(file).toLowerCase()),
        );
      }
      const images = imagePool
        .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
        .sort(
          (a, b) =>
            imageScore(b, folderPath) - imageScore(a, folderPath) ||
            a.localeCompare(b, "fr"),
        );
      usableText.sort(
        (a, b) => b.score - a.score || b.descriptionLength - a.descriptionLength,
      );
      if (images.length)
        found.push({
          brand: brand.name,
          folder:
            folderPath === brandPath
              ? brand.name
              : path.basename(folderPath),
          idPath:
            folderPath === brandPath
              ? brand.name
              : path.relative(brandPath, folderPath),
          textFile: usableText[0].file,
          imageFiles: images.slice(0, 6),
        });
      else
        skipped.push({
          brand: brand.name,
          folder: path.relative(brandPath, folderPath) || brand.name,
          reason: "Aucune image exploitable",
        });
    }
    if (found.length) byBrand.push(found);
  }
  if (importAll) return byBrand.flat().sort((a, b) =>
    `${a.brand}-${a.folder}`.localeCompare(`${b.brand}-${b.folder}`, "fr"),
  );
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
    .webp({ quality: 78 })
    .toBuffer();
  if (bytes.length > 145_000)
    bytes = await sharp(file, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: 820,
        height: 820,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 62 })
      .toBuffer();
  if (bytes.length > 145_000)
    bytes = await sharp(file, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: 650,
        height: 650,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 50 })
      .toBuffer();
  return `data:image/webp;base64,${bytes.toString("base64")}`;
}

const selected = await candidates();
if (!importAll && selected.length < limit)
  throw new Error(
    `Seulement ${selected.length} produits exploitables trouvés sur ${limit}.`,
  );

const products = [];
for (const candidate of selected) {
  const source = await readFile(candidate.textFile, "utf8");
  const price = priceFromText(source);
  const priceVariants = priceVariantsFromText(source);
  const description = cleanProductDescription(source);
  if ((!price && !priceVariants.length) || description.length < 5)
    throw new Error(`Prix ou description introuvable : ${candidate.textFile}`);
  const baseId = `import-${slug(`${candidate.brand}-${candidate.idPath}`)}`;
  const image = await imageData(candidate.imageFiles[0]);
  const images = [];
  for (const file of candidate.imageFiles.slice(1)) images.push(await imageData(file));
  const baseName = (/^(nouveau dossier|montage)$/i.test(candidate.folder.trim())
    ? description.split("\n")[0]
    : candidate.folder
  ).trim().slice(0, 160);
  const entries = priceVariants.length
    ? priceVariants
    : [{ label: "", price }];
  for (const entry of entries) {
    const id = entry.label ? `${baseId}-${slug(entry.label)}` : baseId;
    const capacity = /(?:go|gb|to|tb)$/i.test(entry.label);
    products.push({
      id,
      sku: id.toUpperCase(),
      group: priceVariants.length ? baseId : "",
      variantOptions: entry.label
        ? { [capacity ? "Capacité" : "Modèle"]: entry.label }
        : {},
      name: `${baseName}${entry.label ? ` — ${entry.label}` : ""}`.slice(0, 180),
      brand: candidate.brand.trim(),
      category: categoryFor(candidate.folder, description),
      price: entry.price,
      oldPrice: 0,
      stock: 0,
      image,
      images,
      description,
      specs: specsFromText(source),
      isNew: true,
      featured: false,
      active: false,
      source: {
        textFile: candidate.textFile,
        imageFiles: candidate.imageFiles,
      },
    });
  }
}

await mkdir(".data", { recursive: true });
await writeFile(
  importAll ? ".data/import-preview-all.json" : `.data/import-preview-${limit}.json`,
  JSON.stringify(
    products.map(({ image, images, ...product }) => ({
      ...product,
      imageBytes: image.length,
      galleryBytes: images.map((item) => item.length),
    })),
    null,
    2,
  ),
);
await writeFile(
  ".data/import-skipped.json",
  JSON.stringify(skipped, null, 2),
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
if (skipped.length)
  console.log(
    `${skipped.length} dossier(s) à corriger, détails dans .data/import-skipped.json.`,
  );

if (!commit) {
  console.log(
    `Aperçu généré pour ${products.length} produits. Aucun produit importé.`,
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
