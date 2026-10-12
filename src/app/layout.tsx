import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const metadata: Metadata = { title: { default: "Rack & Stack Storage Systems", template: "%s | Rack & Stack" }, description: "Strong storage systems planned around your space, loads and the way you work.", metadataBase: siteUrl() };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en" className={inter.variable} data-scroll-behavior="smooth"><body>{children}</body></html>; }
