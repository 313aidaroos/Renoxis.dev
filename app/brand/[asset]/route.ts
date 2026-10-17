import { brandAssets } from "@/lib/brand/assets";

// Serves the Renoxis logo PNGs at /brand/<name>.png (header, favicon, app icons, manifest).
export const dynamic = "force-static";

export function generateStaticParams() {
  return Object.keys(brandAssets).map((asset) => ({ asset }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  const data = brandAssets[asset];
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(data, "base64"), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
