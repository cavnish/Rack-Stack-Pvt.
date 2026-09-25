import { existsSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

const canonicalClientAssetFolder = join(process.cwd(), "public", "rack-and-stack-clients");
const legacyClientAssetFolder = join(process.cwd(), "public", "rack-and-stack-clients)");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "www.rackandstack.in" },
    ],
  },
  poweredByHeader: false,
  async rewrites() {
    if (!existsSync(canonicalClientAssetFolder) && existsSync(legacyClientAssetFolder)) {
      return [{ source: "/rack-and-stack-clients/:path*", destination: "/rack-and-stack-clients)/:path*" }];
    }
    return [];
  },
};

export default nextConfig;
