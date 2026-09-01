import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: '.next-static',
  // Disable experimental features that cause issues with export
  experimental: {
    optimizePackageImports: undefined,
  },
  turbopack: {
    root: process.cwd(),
  },
  // Required for static export with dynamic routes
  trailingSlash: true,
  generateEtags: false,
};

export default nextConfig;
