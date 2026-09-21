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
/** Colors painted into public/cixy-sprites.png (green blazer). Used only to skip recolor. */
export const paintedSignatureLook: Look = {
  skin: "#dca580",
  hair: "#503021",
  eyes: "#654224",
  outfit: "#075d4b",
  hairstyle: "long",
  room: "mint",
  motion: true,
};

/** Product default: red coat. Recolor runs until the sheet itself is red. */
export const defaultLook: Look = {
  ...paintedSignatureLook,
  outfit: "#b91c1c",
};

export type DeskTheme = "red" | "emerald" | "sunset" | "night";

export type ThemeSpec = {
  id: DeskTheme;
  label: string;
  coat: string;
  accent: string;
  accentDark: string;
  soft: string;
};

export const themes: Record<DeskTheme, ThemeSpec> = {
  red: {
    id: "red",
    label: "Red",
    coat: "#b91c1c",
    accent: "#b91c1c",
    accentDark: "#7f1d1d",
    soft: "#fef2f2",
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    coat: "#075d4b",
    accent: "#075e4b",
    accentDark: "#04543e",
    soft: "#e2f4e9",
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    coat: "#c2410c",
    accent: "#ea580c",
    accentDark: "#9a3412",
    soft: "#fff7ed",
  },
  night: {
    id: "night",
    label: "Night",
    coat: "#1e3a5f",
    accent: "#1d4ed8",
    accentDark: "#1e3a8a",
    soft: "#eff6ff",
  },
};

export const DEFAULT_THEME: DeskTheme = "red";

export function normalizeTheme(v: unknown): DeskTheme {
  if (v === "red" || v === "emerald" || v === "sunset" || v === "night") return v;
  return DEFAULT_THEME;
}

export function themeFromOutfit(outfit: string): DeskTheme {
  const hex = outfit.toLowerCase();
  for (const spec of Object.values(themes)) {
    if (spec.coat === hex) return spec.id;
  }
  return DEFAULT_THEME;
}

export function applyThemeCoat(look: Look, theme: DeskTheme): Look {
  return { ...look, outfit: themes[theme].coat };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Exact coat match, else nearest theme coat by RGB distance. */
export function nearestTheme(hex: string): DeskTheme {
  const exact = themeFromOutfit(hex);
  if (themes[exact].coat === hex.toLowerCase()) return exact;
  const [r, g, b] = hexToRgb(hex);
  let best: DeskTheme = DEFAULT_THEME;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const spec of Object.values(themes)) {
    const [tr, tg, tb] = hexToRgb(spec.coat);
    const d = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = spec.id;
    }
  }
  return best;
}

/** Theme + coat always match: snap outfit to the theme coat. */
export function syncThemeAndCoat(
  look: Look,
  themeOrHex: DeskTheme | string,
): { look: Look; theme: DeskTheme } {
  const theme =
    typeof themeOrHex === "string" && !(themeOrHex in themes)
      ? nearestTheme(themeOrHex)
      : normalizeTheme(themeOrHex);
  return { theme, look: applyThemeCoat(look, theme) };
}

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


export const ESSENTIALS_ID = "basics";
export const DEFAULT_CIXY_NAME = "Cixy";

/** Per-user Cixy prefs: signature look + display name + wardrobe ownership. */
export type CixyPrefs = {
  look: Look;
  displayName: string;
  wardrobe: string[];
  theme: DeskTheme;
};

export function defaultWardrobe(): string[] {
  return [ESSENTIALS_ID];
}

export function normalizeDisplayName(v: unknown): string {
  const s = String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
  return s || DEFAULT_CIXY_NAME;
}

export function normalizeWardrobe(v: unknown): string[] {
  const ids = new Set<string>([ESSENTIALS_ID]);
  if (Array.isArray(v)) {
    for (const id of v) {
      if (typeof id !== "string") continue;
      if (catalog.some((item) => item.id === id)) ids.add(id);
    }
  }
  return [...ids];
}

export function ownsCatalogItem(wardrobe: string[], id: string): boolean {
  if (id === ESSENTIALS_ID) return true;
  return wardrobe.includes(id);
}

/**
 * Load prefs. A bare legacy Look (with or without style) becomes Essentials-only
 * wardrobe and the default display name "Cixy". Paid ownership is never invented.
 */
export function normalizePrefs(v: unknown): CixyPrefs {
  const bare = normalizeLook(v);
  if (bare) {
    return {
      look: bare,
      displayName: DEFAULT_CIXY_NAME,
      wardrobe: defaultWardrobe(),
      theme: themeFromOutfit(bare.outfit),
    };
  }
  if (!v || typeof v !== "object") {
    return defaultPrefs();
  }
  const o = v as Record<string, unknown>;
  const look = normalizeLook(o.look) ?? defaultLook;
  const theme =
    "theme" in o ? normalizeTheme(o.theme) : themeFromOutfit(look.outfit);
  return {
    look,
    displayName: normalizeDisplayName(o.displayName ?? o.cixyName),
    wardrobe: normalizeWardrobe(o.wardrobe),
    theme,
  };
}

export function defaultPrefs(): CixyPrefs {
  return {
    look: defaultLook,
    displayName: DEFAULT_CIXY_NAME,
    wardrobe: defaultWardrobe(),
    theme: DEFAULT_THEME,
  };
}
