import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Renoxis — Your Real Estate Workspace",
  description:
    "People. Properties. A brighter tomorrow. Meet Cixy, your real estate assistant.",
  applicationName: "Renoxis",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Renoxis" },
  icons: { icon: "/app-icon.svg", apple: "/icon-180.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#075e4b",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
