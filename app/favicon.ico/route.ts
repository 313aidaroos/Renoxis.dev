import { faviconIco } from "@/lib/brand/assets";

export const dynamic = "force-static";

export function GET() {
  return new Response(Buffer.from(faviconIco, "base64"), {
    headers: { "Content-Type": "image/x-icon", "Cache-Control": "public, max-age=86400" },
  });
}
