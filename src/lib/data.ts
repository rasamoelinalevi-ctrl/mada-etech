export type Product = {
  sku?: string;
  group?: string;
  version?: number;
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number;
  stock: number;
  image: string;
  description: string;
  specs: Record<string, string>;
  isNew: boolean;
  featured: boolean;
  active: boolean;
};
export type CartItem = { id: string; quantity: number };
export type Order = {
  paymentStatus?: string;
  discount?: number;
  coupon?: string;
  tax?: number;
  taxLabel?: string;
  currency?: string;
  tracking?: string;
  id: string;
  date: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  method: string;
  total: number;
  shipping: number;
  status: string;
  items: {
    id?: string;
    sku?: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};
export type Settings = {
  taxBps?: number;
  taxLabel?: string;
  commerceReady?: boolean;
  zones?: { city: string; fee: number }[];
  legalText?: string;
  returnsText?: string;
  version?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  heroTitle: string;
  heroText: string;
  shipping: number;
  freeShipping: number;
};
export const categories = [
  "Smartphones",
  "Ordinateurs",
  "Audio & son",
  "Objets connectés",
  "Accessoires",
];
export const money = (value: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) +
  " Ar";
export const initialSettings: Settings = {
  name: "MADA E-TECH",
  email: "contact@mada-etech.example",
  phone: "+261 34 00 000 00",
  address: "Antananarivo, Madagascar",
  heroTitle: "Connectez-vous\nà l’essentiel.",
  heroText:
    "Votre musique. Vos projets. Votre quotidien.\nExplorez la sélection MADA E-TECH.",
  shipping: 15000,
  freeShipping: 1000000,
};
export const initialProducts: Product[] = [
  {
    id: "airpods-max",
    name: "AirPods Max",
    brand: "Apple",
    category: "Audio & son",
    price: 2490000,
    oldPrice: 2790000,
    stock: 12,
    image: "/images/airpods-max.webp",
    description:
      "Un son immersif, un design enveloppant et une réduction active du bruit. Le compagnon idéal pour votre musique, vos films et vos moments à vous.",
    specs: {
      Connexion: "Bluetooth",
      Coloris: "Argent",
      Format: "Casque circum-auriculaire",
      "Réduction du bruit": "Active",
    },
    isNew: false,
    featured: true,
    active: true,
  },
  {
    id: "iphone-13-pro",
    name: "iPhone 13 Pro · 128 Go",
    brand: "Apple",
    category: "Smartphones",
    price: 3290000,
    oldPrice: 3790000,
    stock: 8,
    image: "/images/iphone.webp",
    description:
      "Un écran Super Retina XDR, un système photo Pro et toute la puissance de la puce A15 Bionic dans un format qui tient dans la main.",
    specs: {
      Écran: "6,1 pouces OLED",
      Stockage: "128 Go",
      Puce: "A15 Bionic",
      Réseau: "5G",
    },
    isNew: true,
    featured: true,
    active: true,
  },
  {
    id: "macbook-pro",
    name: "MacBook Pro 14″ · M1 Pro",
    brand: "Apple",
    category: "Ordinateurs",
    price: 8990000,
    oldPrice: 9490000,
    stock: 4,
    image: "/images/macbook.webp",
    description:
      "De la puissance pour vos projets. L’écran Liquid Retina XDR et la puce M1 Pro vous accompagnent du premier croquis au rendu final.",
    specs: {
      Écran: "14,2 pouces",
      Mémoire: "16 Go",
      Stockage: "512 Go SSD",
      Processeur: "Apple M1 Pro",
    },
    isNew: false,
    featured: true,
    active: true,
  },
  {
    id: "galaxy-s10",
    name: "Galaxy S10 · 128 Go",
    brand: "Samsung",
    category: "Smartphones",
    price: 1490000,
    oldPrice: 1790000,
    stock: 15,
    image: "/images/galaxy.webp",
    description:
      "Un smartphone élégant et polyvalent, avec un écran AMOLED lumineux et un triple appareil photo pour capturer le quotidien.",
    specs: {
      Écran: "6,1 pouces AMOLED",
      Stockage: "128 Go",
      Mémoire: "8 Go",
      Réseau: "4G",
    },
    isNew: false,
    featured: true,
    active: true,
  },
  {
    id: "apple-watch",
    name: "Apple Watch Series 4",
    brand: "Apple",
    category: "Objets connectés",
    price: 1290000,
    oldPrice: 0,
    stock: 6,
    image: "/images/watch.webp",
    description:
      "Vos activités, vos notifications et votre musique au poignet. Une montre connectée pour garder le rythme au quotidien.",
    specs: {
      Boîtier: "Aluminium",
      Coloris: "Or",
      Connexion: "Bluetooth / GPS",
      Compatibilité: "iPhone",
    },
    isNew: true,
    featured: true,
    active: true,
  },
  {
    id: "airpods",
    name: "AirPods · Boîtier de charge",
    brand: "Apple",
    category: "Accessoires",
    price: 649000,
    oldPrice: 799000,
    stock: 20,
    image: "/images/airpods.webp",
    description:
      "Des écouteurs sans fil simples à utiliser, avec un boîtier compact pour emporter votre musique partout.",
    specs: {
      Connexion: "Bluetooth",
      Format: "Écouteurs sans fil",
      Boîtier: "Inclus",
      Coloris: "Blanc",
    },
    isNew: true,
    featured: true,
    active: true,
  },
  {
    id: "homepod-mini",
    name: "HomePod mini",
    brand: "Apple",
    category: "Audio & son",
    price: 599000,
    oldPrice: 0,
    stock: 9,
    image: "/images/homepod.webp",
    description:
      "Une petite enceinte qui trouve sa place partout. Un son à 360° pour profiter de votre musique dans chaque pièce.",
    specs: {
      Connexion: "Wi-Fi / Bluetooth",
      Coloris: "Gris sidéral",
      Assistant: "Siri",
      Alimentation: "Secteur",
    },
    isNew: true,
    featured: false,
    active: true,
  },
  {
    id: "echo-plus",
    name: "Amazon Echo Plus",
    brand: "Amazon",
    category: "Objets connectés",
    price: 499000,
    oldPrice: 599000,
    stock: 0,
    image: "/images/echo.webp",
    description:
      "Une enceinte intelligente pour écouter votre musique et piloter vos appareils compatibles à la voix.",
    specs: {
      Connexion: "Wi-Fi / Bluetooth",
      Assistant: "Alexa",
      Alimentation: "Secteur",
      Coloris: "Noir",
    },
    isNew: false,
    featured: false,
    active: true,
  },
];
