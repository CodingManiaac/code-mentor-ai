import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
};

export default nextConfig;
