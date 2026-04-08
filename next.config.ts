import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Evita aviso de "multiple lockfiles" quando existe pnpm-lock.yaml acima (ex.: home)
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
