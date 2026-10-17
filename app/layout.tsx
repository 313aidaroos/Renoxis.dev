import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

// Renoxis brand type (2026-10-17 logo refresh): Montserrat ExtraBold matches the RENOXIS wordmark.
const heading = Montserrat({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-heading", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
export const metadata: Metadata = {
  title: "Renoxis — Your Real Estate Workspace",
  description:
    "People. Properties. A brighter tomorrow. Meet Cixy, your real estate assistant.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://renoxis.dev"),
  applicationName: "Renoxis",
  openGraph: {
    title: "Renoxis — Your Real Estate Workspace",
    description: "People. Properties. A brighter tomorrow. Meet Cixy, your real estate assistant.",
    siteName: "Renoxis",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: "Renoxis" }],
  },
  twitter: { card: "summary_large_image", images: ["/brand/og-image.png"] },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Renoxis" },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/brand/favicon.ico",
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1854d0",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
