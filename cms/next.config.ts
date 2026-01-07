import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Keep TypeScript strict checking enabled
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
