import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap", weight: ["400", "500", "600", "700", "800"] });
export const metadata: Metadata = { title: { default: "Rack & Stack Storage Systems", template: "%s | Rack & Stack" }, description: "Strong storage systems planned around your space, loads and the way you work.", metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en" className={inter.variable}><body>{children}</body></html>; }
