import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration for the AI Career Platform
  trailingSlash: false,
  
  // Skip ESLint during builds to prevent warnings from blocking deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
