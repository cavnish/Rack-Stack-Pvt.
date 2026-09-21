import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const metadata: Metadata = { title: { default: "Rack & Stack Storage Systems", template: "%s | Rack & Stack" }, description: "Industrial storage systems engineered around space, load requirements and operational workflow.", metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en" className={geist.variable}><body>{children}</body></html>; }
