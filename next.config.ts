import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: ["code", "error"].map((key) => ({
        source: "/",
        has: [{ type: "query" as const, key }],
        destination: "/api/auth/callback",
      })),
    };
  },
};

export default nextConfig;
