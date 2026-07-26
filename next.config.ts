import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.chat.z.ai"],
  turbopack: {
    root: "/home/z/xpayments-work",
  },
};

export default nextConfig;
