// Ixis is the Apixis native points unit. Null prices cannot be purchased.
export const currency = "Ixis";
export const catalog = [
  {
    id: "basics",
    name: "Cixy Essentials",
    category: "basics",
    description:
      "Signature Cixy: skin, eyes, hair, and blazer tints on the original artwork, plus office palettes.",
    price: 0,
    status: "included",
  },
  {
    id: "outfits-professional",
    name: "The Professional Collection",
    category: "outfits",
    description:
      "Tailored suits, modest coordinated sets and polished workwear.",
    price: null,
    status: "coming-soon",
  },
  {
    id: "outfits-casual",
    name: "Off-Duty Cixy",
    category: "outfits",
    description: "Relaxed everyday looks and weekend styles.",
    price: null,
    status: "coming-soon",
  },
  {
    id: "office-city",
    name: "City View Office",
    category: "offices",
    description: "Premium skyline workspace templates.",
    price: null,
    status: "coming-soon",
  },
  {
    id: "office-garden",
    name: "Garden Studio",
    category: "offices",
    description: "Warm natural light, plants and a peaceful workspace.",
    price: null,
    status: "coming-soon",
  },
  {
    id: "backgrounds",
    name: "Around the World",
    category: "backgrounds",
    description: "Regional cityscapes and seasonal backgrounds.",
    price: null,
    status: "coming-soon",
  },
  {
    id: "accessories",
    name: "The Finishing Touch",
    category: "accessories",
    description: "Glasses, jewelry, mugs and desk accessories.",
    price: null,
    status: "coming-soon",
  },
  {
    id: "animation-packs",
    name: "A Little More Personality",
    category: "animations",
    description: "Additional gestures, celebrations and activity loops.",
    price: null,
    status: "coming-soon",
  },
] as const;

export type Look = {
  skin: string;
  hair: string;
  eyes: string;
  outfit: string;
  hairstyle: "bun" | "long" | "short";
  room: "mint" | "sunset" | "night";
  motion: boolean;
};

/** Painted signature cut. Reset and first visit stay on the unmodified sprite. */
export const defaultLook: Look = {
  skin: "#dca580",
  hair: "#503021",
  eyes: "#654224",
  outfit: "#075d4b",
  hairstyle: "long",
  room: "mint",
  motion: true,
};

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Accept a saved look, including a legacy `style` of signature or illustrated.
 * Illustrated used to swap in a different drawing. It now loads as this look
 * and renders on the signature sprite. Any other style is rejected.
 */
export function normalizeLook(v: unknown): Look | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  if (
    "style" in x &&
    x.style != null &&
    x.style !== "signature" &&
    x.style !== "illustrated"
  )
    return null;
  const skin = String(x.skin ?? "");
  const hair = String(x.hair ?? "");
  const eyes = String(x.eyes ?? "");
  const outfit = String(x.outfit ?? "");
  if (![skin, hair, eyes, outfit].every((c) => HEX.test(c))) return null;
  if (x.hairstyle !== "bun" && x.hairstyle !== "long" && x.hairstyle !== "short")
    return null;
  if (x.room !== "mint" && x.room !== "sunset" && x.room !== "night") return null;
  if (typeof x.motion !== "boolean") return null;
  return {
    skin: skin.toLowerCase(),
    hair: hair.toLowerCase(),
    eyes: eyes.toLowerCase(),
    outfit: outfit.toLowerCase(),
    hairstyle: x.hairstyle,
    room: x.room,
    motion: x.motion,
  };
}

export function validLook(v: unknown): v is Look {
  return normalizeLook(v) !== null;
}

/** Null and non-integers stay unpriced. Zero is the free essentials line. */
export function catalogPriceLabel(price: number | null): string {
  if (price === 0) return `Included · 0 ${currency}`;
  if (price == null || !Number.isInteger(price) || price < 0)
    return `Price to be set · ${currency}`;
  return `${price} ${currency}`;
}
