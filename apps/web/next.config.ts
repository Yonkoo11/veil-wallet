import type { NextConfig } from "next";

const isGHPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  ...(isGHPages && {
    output: "export",
    basePath: "/veil-wallet",
    images: { unoptimized: true },
  }),

  // Transpile workspace packages
  transpilePackages: ["@veil/core"],

  // WASM support for Railgun ZK proof generation
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },

  // Empty turbopack config so dev server works
  turbopack: {},

  // Security headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default nextConfig;
