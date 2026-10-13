import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import {
  GOOGLE_SITE_VERIFICATION,
  GoogleTagManager,
  GoogleTagManagerNoScript,
} from "@/components/site/google-tag-manager";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const metadata: Metadata = {
  title: { default: "Rack & Stack Storage Systems", template: "%s | Rack & Stack" },
  description: "Strong storage systems planned around your space, loads and the way you work.",
  metadataBase: siteUrl(),
  // Renders `<meta name="google-site-verification" content="…">`. The value is
  // the token alone; Next builds the tag, so there is no hand-written meta to
  // drift or double up.
  verification: { google: GOOGLE_SITE_VERIFICATION },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800;1,900&display=swap"
          rel="stylesheet"
        />
        {/* Consent Mode defaults, then the GTM container — in that order. */}
        <GoogleTagManager />
      </head>
      <body>
        {/* Must be the first element in <body>: Google's no-JS fallback. */}
        <GoogleTagManagerNoScript />
        {children}
      </body>
    </html>
  );
}
