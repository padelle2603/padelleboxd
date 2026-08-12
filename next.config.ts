import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }],
  },
  allowedDevOrigins: ["192.168.1.58"],
};

export default nextConfig;
