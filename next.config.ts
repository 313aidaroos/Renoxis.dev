import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Canonical host. Only the exact production alias is matched, so
        // preview deployments (renoxis-*.vercel.app) keep working.
        source: "/:path*",
        has: [{ type: "host", value: "renoxis.vercel.app" }],
        destination: "https://renoxis.dev/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
