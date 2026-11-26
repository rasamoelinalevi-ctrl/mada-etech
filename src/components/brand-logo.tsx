import Image from "next/image";

const logos: Record<string, string> = {
  ACER: "/images/brands/acer.webp",
  AIGO: "/images/brands/aigo.webp",
  ASUS: "/images/brands/asus.webp",
  AWEI: "/images/brands/awei.webp",
  BLACKVIEW: "/images/brands/blackview.png",
  BOYA: "/images/brands/boya.webp",
  CANON: "/images/brands/canon.webp",
  "D-LINK": "/images/brands/dlink.webp",
  DELL: "/images/brands/dell.webp",
  EDIFIER: "/images/brands/edifier.webp",
};

export function hasBrandLogo(brand: string) {
  return Boolean(logos[brand.trim().toUpperCase()]);
}

export function BrandLogo({ brand }: { brand: string }) {
  const logo = logos[brand.trim().toUpperCase()];
  return logo ? (
    <Image
      className={`brand-logo-image${["AIGO", "AWEI", "BOYA"].includes(brand.trim().toUpperCase()) ? " brand-logo-square" : ""}`}
      src={logo}
      alt={`Logo ${brand}`}
      width={160}
      height={60}
    />
  ) : (
    <span className="brand-logo-fallback" role="img" aria-label={`Logo ${brand}`}>
      {brand}
    </span>
  );
}
