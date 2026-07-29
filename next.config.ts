import path from "path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

const projectRoot = path.resolve(process.cwd());

loadEnvConfig(projectRoot);

const nextConfig: NextConfig = {
  // Parent lab-saas/ has a package-lock.json; pin Turbopack to this package.
  turbopack: {
    root: projectRoot,
  },
  distDir: ".next",
};

export default nextConfig;
