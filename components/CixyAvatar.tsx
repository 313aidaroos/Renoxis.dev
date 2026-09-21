"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Look } from "@/lib/renoxis/customization";
import {
  buildSpriteMask,
  frameRect,
  isNaturalSignature,
  recolorFrame,
  SPRITE_ROWS,
} from "@/lib/renoxis/sprite-cosmetics";

export const moods = ["Smile", "Wave", "Sleep", "Snack", "Coffee"] as const;
export type Mood = (typeof moods)[number];

type Sheet = {
  width: number;
  height: number;
  source: Uint8ClampedArray;
  mask: Uint8Array;
};

let sheetPromise: Promise<Sheet> | null = null;

function loadSheet(): Promise<Sheet> {
  if (sheetPromise) return sheetPromise;
  sheetPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.src = "/cixy-sprites.png";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        sheetPromise = null;
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({
        width: canvas.width,
        height: canvas.height,
        source: image.data,
        mask: buildSpriteMask(image.data, canvas.width, canvas.height),
      });
    };
    img.onerror = () => {
      sheetPromise = null;
      reject(new Error("sprite"));
    };
  });
  return sheetPromise;
}

export default function CixyAvatar({ look, mood }: { look: Look; mood: Mood }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const natural = isNaturalSignature(look);
  useEffect(() => {
    if (natural) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancel = false;
    let timer = 0;
    const col = moods.indexOf(mood);
    const started = performance.now();
    void loadSheet()
      .then((sheet) => {
        if (cancel) return;
        const frames = Array.from({ length: SPRITE_ROWS }, (_, row) => {
          const rect = frameRect(sheet.width, sheet.height, col, row);
          return {
            rect,
            pixels: recolorFrame(sheet.source, sheet.mask, sheet.width, rect, look),
          };
        });
        let shown = -1;
        const draw = (row: number) => {
          if (row === shown) return;
          const frame = frames[row] ?? frames[0];
          if (!frame) return;
          shown = row;
          if (canvas.width !== frame.rect.fw) canvas.width = frame.rect.fw;
          if (canvas.height !== frame.rect.fh) canvas.height = frame.rect.fh;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const pixels = new Uint8ClampedArray(frame.pixels);
          ctx.putImageData(new ImageData(pixels, frame.rect.fw, frame.rect.fh), 0, 0);
        };
        const tick = () => {
          if (!look.motion) {
            draw(0);
            return;
          }
          const p = ((performance.now() - started) % 4000) / 4000;
          draw(p >= 0.43 && p < 0.85 ? 1 : 0);
        };
        tick();
        if (look.motion) timer = window.setInterval(tick, 120);
      })
      .catch(() => {
        /* The signature sheet underneath stays visible. */
      });
    return () => {
      cancel = true;
      window.clearInterval(timer);
    };
  }, [
    natural,
    look,
    look.skin,
    look.hair,
    look.eyes,
    look.outfit,
    look.hairstyle,
    look.room,
    look.motion,
    mood,
  ]);
  const pose = {
    "--frame-x": `${moods.indexOf(mood) * 25}%`,
  } as CSSProperties;
  return (
    <div className="signature-wrap">
      <div
        role="img"
        aria-label={`Cixy ${mood.toLowerCase()}`}
        data-cixy="signature"
        data-room={look.room}
        data-hairstyle={look.hairstyle}
        className={"signature-avatar" + (look.motion ? " animated" : "")}
        style={pose}
      />
      {natural ? null : (
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
