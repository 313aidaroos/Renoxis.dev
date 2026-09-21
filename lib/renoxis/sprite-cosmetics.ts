import { defaultLook, type Look } from "./customization.ts";

/** Signature sheet layout: five activities × two animation frames. */
export const SPRITE_COLS = 5;
export const SPRITE_ROWS = 2;

export const Region = {
  keep: 0,
  skin: 1,
  hair: 2,
  eyes: 3,
  outfit: 4,
  room: 5,
} as const;

export type FrameRect = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  fw: number;
  fh: number;
};

const ROOM_TINT = {
  sunset: "#e8c4a4",
  night: "#6d86a8",
} as const;

/** Equal frames. A leftover pixel on the sheet edge is outside every frame. */
export function frameRect(
  width: number,
  height: number,
  col: number,
  row: number,
): FrameRect {
  const fw = Math.floor(width / SPRITE_COLS);
  const fh = Math.floor(height / SPRITE_ROWS);
  return {
    x0: col * fw,
    y0: row * fh,
    x1: (col + 1) * fw,
    y1: (row + 1) * fh,
    fw,
    fh,
  };
}

/**
 * How much of the painted hair takes the chosen color.
 * Long uses the whole painted cut. Short and updo tint the crown more than
 * the length. The silhouette stays the signature pixels — filling erased hair
 * with a flat stand-in broke the painting.
 */
export function hairCoverage(
  style: Look["hairstyle"],
  localY: number,
  frameH: number,
): number {
  if (frameH <= 0) return 1;
  const t = localY / frameH;
  if (style === "long") return 1;
  if (style === "short") {
    if (t <= 0.34) return 1;
    if (t >= 0.52) return 0.18;
    return 1 - ((t - 0.34) / 0.18) * 0.82;
  }
  if (t <= 0.2) return 1;
  if (t >= 0.4) return 0.12;
  return 1 - ((t - 0.2) / 0.2) * 0.88;
}

export function isNaturalSignature(look: Look): boolean {
  return (
    sameHex(look.skin, defaultLook.skin) &&
    sameHex(look.hair, defaultLook.hair) &&
    sameHex(look.eyes, defaultLook.eyes) &&
    sameHex(look.outfit, defaultLook.outfit) &&
    look.hairstyle === "long" &&
    look.room === "mint"
  );
}

function sameHex(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function hexRgb(color: string): [number, number, number] {
  const n = Number.parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  if (h < 0) h += 6;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) {
    r = c;
    g = x;
  } else if (hp < 2) {
    r = x;
    g = c;
  } else if (hp < 3) {
    g = c;
    b = x;
  } else if (hp < 4) {
    g = x;
    b = c;
  } else if (hp < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const m = l - c / 2;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round((v + m) * 255)));
  return [clamp(r), clamp(g), clamp(b)];
}

/** Keep the pixel's lightness. Move hue toward the chosen color. */
export function tintChannel(
  r: number,
  g: number,
  b: number,
  target: [number, number, number],
  strength: number,
): [number, number, number] {
  const [th, ts] = rgbToHsl(target[0], target[1], target[2]);
  const [, s, l] = rgbToHsl(r, g, b);
  const ns = Math.min(1, s * (1 - strength) + ts * strength);
  return hslToRgb(th, ns, l);
}

function findEyes(
  pixels: Uint8ClampedArray,
  width: number,
  rect: FrameRect,
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const yStart = rect.y0 + Math.floor(rect.fh * 0.4);
  const yEnd = rect.y0 + Math.floor(rect.fh * 0.58);
  const xStart = rect.x0 + Math.floor(rect.fw * 0.32);
  const xEnd = rect.x0 + Math.floor(rect.fw * 0.7);
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const o = (y * width + x) * 4;
      if (pixels[o] + pixels[o + 1] + pixels[o + 2] < 24)
        pts.push([x - rect.x0, y - rect.y0]);
    }
  }
  const mid = rect.fw / 2;
  const center = (group: Array<[number, number]>) => {
    if (!group.length) return null;
    let sx = 0;
    let sy = 0;
    for (const p of group) {
      sx += p[0];
      sy += p[1];
    }
    return [sx / group.length, sy / group.length] as [number, number];
  };
  return [center(pts.filter((p) => p[0] < mid)), center(pts.filter((p) => p[0] >= mid))].filter(
    (p): p is [number, number] => p !== null,
  );
}

function classify(
  r: number,
  g: number,
  b: number,
  x: number,
  y: number,
  fw: number,
  fh: number,
  eyes: Array<[number, number]>,
): number {
  const l = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const radius = Math.max(4, Math.round(fw * 0.038));
  for (const [ex, ey] of eyes) {
    const dx = x - ex;
    const dy = y - ey;
    if (dx * dx + dy * dy <= radius * radius) {
      if (l < 26) return Region.keep;
      if (l < 200 && !(l > 175 && chroma < 22)) return Region.eyes;
      return Region.keep;
    }
  }
  if (l > 214 && chroma < 28) return Region.keep;
  if (r > 150 && r > g + 20 && r > b + 28 && l > 80 && l < 236 && g > 50)
    return Region.skin;
  if (l < 125 && r > g - 2 && r > b + 8 && r < 175 && g < 130 && r - b > 12)
    return Region.hair;
  if (l < 42 && r >= g - 2 && r + 6 >= b && r > 6 && r < 80) return Region.hair;
  if (
    x > fw * 0.18 &&
    x < fw * 0.84 &&
    y > fh * 0.5 &&
    y < fh * 0.98 &&
    l > 16 &&
    l < 130 &&
    g + 4 >= r &&
    b + 10 >= r &&
    r < 100 &&
    g < 155 &&
    g - r < 50 &&
    g - b < 32 &&
    b > 12
  )
    return Region.outfit;
  return Region.room;
}

/** One mask for the whole sheet. Regions follow the signature painting, not a new drawing. */
export function buildSpriteMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let row = 0; row < SPRITE_ROWS; row++) {
    for (let col = 0; col < SPRITE_COLS; col++) {
      const rect = frameRect(width, height, col, row);
      const eyes = findEyes(pixels, width, rect);
      for (let y = 0; y < rect.fh; y++) {
        for (let x = 0; x < rect.fw; x++) {
          const si = (rect.y0 + y) * width + (rect.x0 + x);
          const o = si * 4;
          mask[si] = classify(
            pixels[o],
            pixels[o + 1],
            pixels[o + 2],
            x,
            y,
            rect.fw,
            rect.fh,
            eyes,
          );
        }
      }
    }
  }
  return mask;
}

/** Tint one frame in place. Unchanged channels keep the original pixels. */
export function paintSpriteCosmetics(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  mask: Uint8Array,
  look: Look,
): void {
  const skinOn = !sameHex(look.skin, defaultLook.skin);
  const hairOn = !sameHex(look.hair, defaultLook.hair) || look.hairstyle !== "long";
  const eyesOn = !sameHex(look.eyes, defaultLook.eyes);
  const outfitOn = !sameHex(look.outfit, defaultLook.outfit);
  const room =
    look.room === "sunset" || look.room === "night"
      ? hexRgb(ROOM_TINT[look.room])
      : null;
  if (!skinOn && !hairOn && !eyesOn && !outfitOn && !room) return;
  const skin = hexRgb(look.skin);
  const hair = hexRgb(look.hair);
  const eyes = hexRgb(look.eyes);
  const outfit = hexRgb(look.outfit);
  for (let y = 0; y < height; y++) {
    const cover = hairCoverage(look.hairstyle, y, height);
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const region = mask[i];
      const o = i * 4;
      let r = pixels[o];
      let g = pixels[o + 1];
      let b = pixels[o + 2];
      if (region === Region.skin && skinOn) {
        [r, g, b] = tintChannel(r, g, b, skin, 0.88);
      } else if (region === Region.hair && hairOn) {
        const tinted = tintChannel(r, g, b, hair, 0.9);
        r = Math.round(r * (1 - cover) + tinted[0] * cover);
        g = Math.round(g * (1 - cover) + tinted[1] * cover);
        b = Math.round(b * (1 - cover) + tinted[2] * cover);
      } else if (region === Region.eyes && eyesOn) {
        [r, g, b] = tintChannel(r, g, b, eyes, 0.94);
      } else if (region === Region.outfit && outfitOn) {
        [r, g, b] = tintChannel(r, g, b, outfit, 0.9);
      } else if (region === Region.room && room) {
        [r, g, b] = tintChannel(r, g, b, room, 0.62);
      } else {
        continue;
      }
      pixels[o] = r;
      pixels[o + 1] = g;
      pixels[o + 2] = b;
    }
  }
}

/** Copy one signature frame and tint it. Source and mask stay unchanged. */
export function recolorFrame(
  source: Uint8ClampedArray,
  mask: Uint8Array,
  sheetWidth: number,
  rect: FrameRect,
  look: Look,
): Uint8ClampedArray {
  const frame = new Uint8ClampedArray(rect.fw * rect.fh * 4);
  const local = new Uint8Array(rect.fw * rect.fh);
  for (let y = 0; y < rect.fh; y++) {
    for (let x = 0; x < rect.fw; x++) {
      const si = (rect.y0 + y) * sheetWidth + (rect.x0 + x);
      const di = y * rect.fw + x;
      const so = si * 4;
      const d = di * 4;
      frame[d] = source[so];
      frame[d + 1] = source[so + 1];
      frame[d + 2] = source[so + 2];
      frame[d + 3] = source[so + 3];
      local[di] = mask[si];
    }
  }
  paintSpriteCosmetics(frame, rect.fw, rect.fh, local, look);
  return frame;
}
