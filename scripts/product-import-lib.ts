const contactLine =
  /(contact|t[ée]l[ée]phone|disponible [àa]|livraison|frais de d[ée]placement|lieu\s*:|modes? de paiement|mvola|orange money|airtel money|and[r]?ondra|terminus|034\s*\d|032\s*\d)/i;

export function pricesFromText(source: string) {
  const prices: number[] = [];
  for (const line of source.split(/\r?\n/)) {
    const marker = line.match(/\b(?:p?rix)\s*[:/=-]/i);
    if (!marker?.index && marker?.index !== 0) continue;
    const after = line.slice(marker.index + marker[0].length);
    const match = after.match(/(\d[\d\s\u00a0\u202f.,]{2,})/);
    if (!match) continue;
    const value = Number(match[1].replace(/\D/g, ""));
    if (Number.isSafeInteger(value) && value >= 1000) prices.push(value);
  }
  return [...new Set(prices)];
}

export function priceFromText(source: string) {
  return pricesFromText(source).at(-1) || 0;
}

export function priceVariantsFromText(source: string) {
  const variants: { label: string; price: number }[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    const price = Number(
      (line.match(/(\d[\d\s\u00a0\u202f.,]{2,})\s*(?:Ar|ariary)\b/i)?.[1] || "").replace(
        /\D/g,
        "",
      ),
    );
    if (!Number.isSafeInteger(price) || price < 1000) continue;
    const capacity = line.match(/\b(\d+(?:[.,]\d+)?\s*(?:Go|GB|To|TB))\b/i)?.[1];
    const arrowLabel = line.match(/^\s*[-•]?\s*([A-Za-z]{1,5}\d[A-Za-z0-9-]{1,20})\s+(?=\d)/)?.[1];
    const label = capacity || arrowLabel;
    if (label && !variants.some((variant) => variant.label.toLowerCase() === label.toLowerCase()))
      variants.push({ label: label.replace(/\s+/g, " "), price });
  }
  return variants.length > 1 ? variants : [];
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
  const printing = /imprimante|scanner|projecteur|laserjet|pixma|i-sensys/;
  const network = /routeur|r[ée]p[ée]teur|switch|point d.acc[èe]s|wi-?fi|mesh|modem|poe|rj45|fibre|gbic|cpl\b|coffret de brassage|traceur de c[âa]ble/;
  const storage = /ssd|disque dur|flash disque|cl[ée]\s*usb|carte m[ée]moire|stockage|nvme/;
  const energy = /batterie|power\s*bank|chargeur|onduleur|allume.cigare/;
  const mobile = /smartphone|tablette|\btab\b|t[ée]l[ée]phone|iphone|galaxy|itel\s+[aps]\d/;
  const computer = /ordinateur|laptop|notebook|chromebook|mini\s*pc|moniteur|[ée]cran/;
  const audio = /casque|[ée]couteur|speaker|haut-parleur|audio|micro(?:phone|\s|$)|barre? de son/;
  const connected = /montre|watch|bracelet connect[ée]|tracker|smart\s*tag|cam[ée]ra|tapo/;
  const accessory = /adaptateur|adapteur|hub\b|c[âa]ble|clavier|souris|sac(?:oche)?|malette|housse|support|pointeur|webcam|pince|rack|pochette/;

  if (printing.test(heading))
    return "Impression & projection";
  if (network.test(heading))
    return "Réseau & connectivité";
  if (storage.test(heading))
    return "Stockage";
  if (energy.test(heading))
    return "Énergie & charge";
  if (mobile.test(heading))
    return "Smartphones & tablettes";
  if (computer.test(heading))
    return "Ordinateurs";
  if (audio.test(heading))
    return "Audio & son";
  if (connected.test(heading))
    return "Objets connectés";
  if (accessory.test(heading))
    return "Accessoires";
  if (printing.test(value)) return "Impression & projection";
  if (mobile.test(value)) return "Smartphones & tablettes";
  if (computer.test(value)) return "Ordinateurs";
  if (audio.test(value)) return "Audio & son";
  if (connected.test(value)) return "Objets connectés";
  if (network.test(value)) return "Réseau & connectivité";
  if (storage.test(value)) return "Stockage";
  if (energy.test(value)) return "Énergie & charge";
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
