// Ixis is the Apixis native points unit. Null prices cannot be purchased.
export const currency = "Ixis";
export const catalog = [
  {
    id: "basics",
    name: "Cixy Essentials",
    category: "basics",
    description:
      "Illustrated avatar: skin, eyes, hair, blazer colors and three hairstyles.",
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
  style: "signature" | "illustrated";
  skin: string;
  hair: string;
  eyes: string;
  outfit: string;
  hairstyle: "bun" | "long" | "short";
  room: "mint" | "sunset" | "night";
  motion: boolean;
};
export const defaultLook: Look = {
  style: "signature",
  skin: "#dca580",
  hair: "#503021",
  eyes: "#654224",
  outfit: "#075d4b",
  hairstyle: "bun",
  room: "mint",
  motion: true,
};
export function validLook(v: unknown): v is Look {
  if (!v || typeof v !== "object") return false;
  const x = v as Look;
  return (
    ["signature", "illustrated"].includes(x.style) &&
    ["skin", "hair", "eyes", "outfit"].every((k) =>
      /^#[a-f\d]{6}$/i.test(String(x[k as keyof Look])),
    ) &&
    ["bun", "long", "short"].includes(x.hairstyle) &&
    ["mint", "sunset", "night"].includes(x.room) &&
    typeof x.motion === "boolean"
  );
}
