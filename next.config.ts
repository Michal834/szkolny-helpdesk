import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Samodzielny build (mały obraz Dockera dla Coolify)
  output: "standalone",
};

export default nextConfig;
