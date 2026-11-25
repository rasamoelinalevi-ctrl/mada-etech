const contactLine =
  /(contact|t[ée]l[ée]phone|disponible [àa]|livraison|frais de d[ée]placement|lieu\s*:|modes? de paiement|mvola|orange money|airtel money|and[r]?ondra|terminus|034\s*\d|032\s*\d)/i;

export function pricesFromText(source: string) {
  const prices: number[] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!/prix/i.test(line)) continue;
    const after = line.slice(line.toLowerCase().indexOf("prix") + 4);
    const match = after.match(/(\d[\d\s\u00a0\u202f.,]{2,})/);
    if (!match) continue;
    const value = Number(match[1].replace(/\D/g, ""));
    if (Number.isSafeInteger(value) && value > 0) prices.push(value);
  }
  return [...new Set(prices)];
}

export function priceFromText(source: string) {
  return pricesFromText(source)[0] || 0;
}

export function cleanProductDescription(source: string) {
  const firstSection = source.split(/^\s*MARKETPLACE\s*:/im)[0];
  const lines = firstSection
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^PAGE\s*:/i.test(line))
    .filter((line) => !/\bprix\s*:/i.test(line))
    .filter((line) => !/^#/.test(line))
    .filter((line) => !contactLine.test(line));
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, 9000);
}

export function categoryFor(name: string, description = "") {
  const value = `${name} ${description}`.toLowerCase();
  const heading = `${name} ${description.split(/\r?\n/, 1)[0]}`.toLowerCase();
  if (
    /adaptateur|adapteur|hub\b|c[âa]ble|clavier|souris|cl[ée]\s*wi-?fi|ssd|disque dur|sac(?:oche)?|chargeur|support/.test(
      heading,
    )
  )
    return "Accessoires";
  if (/smartphone|t[ée]l[ée]phone|iphone|galaxy|itel\s+[aps]\d/.test(value))
    return "Smartphones";
  if (
    /ordinateur|laptop|notebook|chromebook|mini\s*pc|moniteur|[ée]cran|imprimante|scanner|projecteur/.test(
      value,
    )
  )
    return "Ordinateurs";
  if (
    /casque|[ée]couteur|speaker|haut-parleur|audio|micro|barre? de son/.test(
      value,
    )
  )
    return "Audio & son";
  if (
    /montre|watch|bracelet connect[ée]|tracker|cam[ée]ra corporelle/.test(value)
  )
    return "Objets connectés";
  return "Accessoires";
}

export function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 88);
}

export function specsFromText(source: string) {
  const specs: Record<string, string> = {};
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    const match = line.match(/^([^:#]{2,80})\s*:\s*(.{1,500})$/);
    if (!match || /prix|contact|lieu|disponible|paiement/i.test(match[1]))
      continue;
    const key = match[1].trim();
    const value = match[2].trim();
    if (!(key in specs)) specs[key] = value;
    if (Object.keys(specs).length === 8) break;
  }
  return specs;
}
