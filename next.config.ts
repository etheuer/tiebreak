import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: '.next-static',
  images: {
    // Static export has no image optimizer; we pre-generate derived thumbs.
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['posthog-js'],
  },
  turbopack: {
    root: process.cwd(),
  },
  // Required for static export with dynamic routes
  trailingSlash: true,
  generateEtags: false,
};

export default nextConfig;
