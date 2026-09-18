import { z } from "zod";
export const text = (min = 1, max = 200) => z.string().trim().min(min).max(max);
export const amount = z.number().int().min(0).max(1_000_000_000);
export const productSchema = z
  .object({
    id: text(1, 100).regex(/^[a-zA-Z0-9_-]+$/),
    sku: text(1, 100),
    group: text(0, 100).default(""),
    name: text(2),
    brand: text(),
    category: text(),
    price: amount,
    oldPrice: amount,
    stock: z.number().int().min(0).max(1000000),
    image: z
      .string()
      .max(1500000)
      .refine(
        (s) =>
          /^\/images\/[\w./-]+\.(webp|png|jpg|jpeg)$/.test(s) ||
          /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(s),
        "Image non autorisée",
      ),
    description: text(5, 10000),
    specs: z.record(text(1, 80), text(0, 500)),
    isNew: z.boolean(),
    featured: z.boolean(),
    active: z.boolean(),
    version: z.number().int().optional(),
  })
  .strict()
  .refine(
    (p) => p.oldPrice === 0 || p.oldPrice >= p.price,
    "Ancien prix inférieur au prix courant",
  );
export const settingsSchema = z
  .object({
    name: text(2, 35),
    email: z.string().email(),
    phone: text(8, 30),
    address: text(5, 400),
    heroTitle: text(1, 150),
    heroText: text(1, 500),
    shipping: amount,
    freeShipping: amount,
    taxBps: z.number().int().min(0).max(10000),
    taxLabel: text(1, 100),
    commerceReady: z.boolean(),
    zones: z
      .array(z.object({ city: text(2, 100), fee: amount }))
      .min(1)
      .max(200),
    legalText: text(0, 20000),
    returnsText: text(0, 10000),
    version: z.number().int().optional(),
  })
  .strict();
export const checkoutSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    items: z
      .array(
        z
          .object({
            id: text(1, 100),
            quantity: z.number().int().min(1).max(1000),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    customer: text(2, 150),
    email: z.string().email().max(254),
    phone: text(8, 30).regex(/^[+\d ()-]+$/),
    address: text(5, 500),
    city: text(2, 100),
    method: z.enum(["MVola", "Orange Money", "Airtel Money", "Carte bancaire"]),
    coupon: text(0, 40).default(""),
    acceptedTerms: z.literal(true),
  })
  .strict();
export const promotionSchema = z
  .object({
    code: text(2, 40)
      .transform((s) => s.toUpperCase())
      .refine((s) => /^[A-Z0-9_-]+$/.test(s)),
    percent: z.number().int().min(1).max(90),
    minimum: amount,
    limit: z.number().int().min(1).max(100000),
    starts: z.string().datetime(),
    ends: z.string().datetime(),
    active: z.boolean(),
  })
  .strict()
  .refine((p) => p.ends > p.starts);
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
  name: text(2, 150).optional(),
});
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireValue(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
