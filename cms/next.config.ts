import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds (warnings don't block deployment)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript strict checking enabled
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
