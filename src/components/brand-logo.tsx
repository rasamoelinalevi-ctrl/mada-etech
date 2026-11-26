import Image from "next/image";

const logos: Record<string, string> = {
  ACER: "/images/brands/acer.webp",
  ASUS: "/images/brands/asus.webp",
  BLACKVIEW: "/images/brands/blackview.png",
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
      className="brand-logo-image"
      src={logo}
      alt={`Logo ${brand}`}
      width={160}
      height={60}
    />
  ) : (
    <strong className="brand-logo-fallback">{brand}</strong>
  );
}
