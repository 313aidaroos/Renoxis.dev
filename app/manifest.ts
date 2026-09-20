import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Renoxis — Your Real Estate Workspace",
    short_name: "Renoxis",
    description: "Your properties, clients and Cixy, together.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f7f3",
    theme_color: "#075e4b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
