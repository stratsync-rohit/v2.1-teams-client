import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep module discovery scoped to this app when a parent workspace also has
  // a lockfile (for example, during local development).
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
