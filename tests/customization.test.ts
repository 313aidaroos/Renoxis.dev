import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  catalog,
  DEFAULT_CIXY_NAME,
  ESSENTIALS_ID,
  defaultLook,
  normalizeLook,
  normalizePrefs,
  ownsCatalogItem,
  validLook,
} from "../lib/renoxis/customization.ts";
import {
  Region,
  buildSpriteMask,
  frameRect,
  hairCoverage,
  isNaturalSignature,
  paintSpriteCosmetics,
  tintChannel,
} from "../lib/renoxis/sprite-cosmetics.ts";

test("legacy illustrated looks load as signature preferences", () => {
  const saved = {
    style: "illustrated",
    skin: "#AABBCC",
    hair: "#503021",
    eyes: "#654224",
    outfit: "#075d4b",
    hairstyle: "bun",
    room: "sunset",
    motion: false,
  };
  const look = normalizeLook(saved);
  assert.ok(look);
  assert.equal("style" in look, false);
  assert.equal(look.skin, "#aabbcc");
  assert.equal(look.hairstyle, "bun");
  assert.equal(look.room, "sunset");
  assert.equal(look.motion, false);
  assert.equal(validLook(saved), true);
  assert.equal(normalizeLook({ ...defaultLook, style: "stick" }), null);
  assert.equal(normalizeLook({ ...defaultLook, style: "signature" })?.hair, defaultLook.hair);
  assert.deepEqual(normalizeLook({ ...defaultLook }), defaultLook);
});

test("default look is the unmodified signature sprite", () => {
  assert.equal(defaultLook.hairstyle, "long");
  assert.equal(isNaturalSignature(defaultLook), true);
  assert.equal(
    isNaturalSignature({ ...defaultLook, hairstyle: "bun" }),
    false,
  );
  assert.equal(catalog[0].price, 0);
  assert.equal(catalog[0].status, "included");
  for (const item of catalog.slice(1)) {
    assert.equal(item.price, null);
    assert.equal(item.status, "coming-soon");
  }
});

test("hair style changes coverage without a new silhouette", () => {
  assert.equal(hairCoverage("long", 10, 100), 1);
  assert.equal(hairCoverage("long", 80, 100), 1);
  assert.equal(hairCoverage("short", 10, 100), 1);
  assert.ok(hairCoverage("short", 80, 100) < 0.3);
  assert.equal(hairCoverage("bun", 10, 100), 1);
  assert.ok(hairCoverage("bun", 70, 100) < hairCoverage("short", 70, 100));
});

test("tint keeps lightness and moves hue", () => {
  const [r, , b] = tintChannel(30, 80, 50, [20, 40, 180], 0.9);
  assert.ok(b > r);
  assert.ok(b > 30);
  const painted: [number, number, number] = [30, 80, 50];
  const same = tintChannel(painted[0], painted[1], painted[2], painted, 0);
  assert.deepEqual(same, painted);
});

test("sprite mask separates skin, hair, eyes, blazer, and room", () => {
  const fw = 40;
  const fh = 40;
  const width = fw * 5;
  const height = fh * 2;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = 220;
    pixels[i * 4 + 1] = 210;
    pixels[i * 4 + 2] = 200;
    pixels[i * 4 + 3] = 255;
  }
  const put = (x: number, y: number, rgb: [number, number, number]) => {
    const o = (y * width + x) * 4;
    pixels[o] = rgb[0];
    pixels[o + 1] = rgb[1];
    pixels[o + 2] = rgb[2];
  };
  put(20, 8, [70, 36, 20]);
  put(20, 16, [232, 168, 130]);
  put(20, 28, [28, 58, 48]);
  put(20, 22, [245, 240, 238]);
  put(14, 18, [0, 0, 0]);
  put(26, 18, [0, 0, 0]);
  put(14, 17, [180, 112, 84]);
  const mask = buildSpriteMask(pixels, width, height);
  const at = (x: number, y: number) => mask[y * width + x];
  assert.equal(at(2, 2), Region.room);
  assert.equal(at(20, 8), Region.hair);
  assert.equal(at(20, 16), Region.skin);
  assert.equal(at(20, 28), Region.outfit);
  assert.equal(at(20, 22), Region.keep);
  assert.equal(at(14, 18), Region.keep);
  assert.equal(at(14, 17), Region.eyes);
  const rect = frameRect(width, height, 0, 0);
  assert.equal(rect.fw, fw);
  assert.equal(rect.fh, fh);
});

test("cosmetics recolor the masked channel and leave the shirt", () => {
  const width = 2;
  const height = 2;
  const pixels = new Uint8ClampedArray([
    232, 168, 130, 255, 245, 240, 238, 255, 28, 58, 48, 255, 220, 210, 200, 255,
  ]);
  const original = new Uint8ClampedArray(pixels);
  const mask = new Uint8Array([
    Region.skin,
    Region.keep,
    Region.outfit,
    Region.room,
  ]);
  paintSpriteCosmetics(
    pixels,
    width,
    height,
    mask,
    { ...defaultLook, skin: "#88aadd", outfit: "#2244aa", room: "night" },
  );
  assert.ok(pixels[2] > original[2]);
  assert.deepEqual(Array.from(pixels.slice(4, 8)), [245, 240, 238, 255]);
  assert.ok(pixels[10] > original[10]);
  assert.notDeepEqual(Array.from(pixels.slice(12, 15)), [220, 210, 200]);
});

test("avatar and desk do not render an illustrated svg person", () => {
  const avatar = readFileSync(
    new URL("../components/CixyAvatar.tsx", import.meta.url),
    "utf8",
  );
  const desk = readFileSync(
    new URL("../components/CommandDesk.tsx", import.meta.url),
    "utf8",
  );
  const css = readFileSync(
    new URL("../components/command-desk.css", import.meta.url),
    "utf8",
  );
  assert.equal(avatar.includes("<svg"), false);
  assert.equal(avatar.includes("illustrated"), false);
  assert.equal(desk.includes("illustrated"), false);
  assert.equal(css.includes("illustrated-avatar"), false);
  assert.match(avatar, /cixy-sprites\.png/);
  assert.match(avatar, /data-cixy="signature"/);
});


test("prefs migrate legacy look and keep Essentials owned", () => {
  const legacy = normalizePrefs({
    style: "illustrated",
    skin: "#dca580",
    hair: "#503021",
    eyes: "#654224",
    outfit: "#075d4b",
    hairstyle: "long",
    room: "mint",
    motion: true,
  });
  assert.equal(legacy.displayName, DEFAULT_CIXY_NAME);
  assert.deepEqual(legacy.wardrobe, [ESSENTIALS_ID]);
  assert.equal(ownsCatalogItem(legacy.wardrobe, ESSENTIALS_ID), true);
  assert.equal(ownsCatalogItem(legacy.wardrobe, "outfits-professional"), false);

  const named = normalizePrefs({
    look: defaultLook,
    displayName: "  Nora  ",
    wardrobe: ["outfits-professional", "fake-sku"],
  });
  assert.equal(named.displayName, "Nora");
  assert.ok(named.wardrobe.includes(ESSENTIALS_ID));
  assert.ok(named.wardrobe.includes("outfits-professional"));
  assert.equal(named.wardrobe.includes("fake-sku"), false);
  assert.equal(normalizePrefs({ displayName: "" }).displayName, DEFAULT_CIXY_NAME);
});
