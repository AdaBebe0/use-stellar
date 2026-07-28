/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["use-stellar"],
  experimental: {
    serverComponentsExternalPackages: ["sodium-native"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "sodium-native": false,
      };
    } else {
      config.externals = [...(config.externals ?? []), "sodium-native"];
    }
    return config;
  },
};

module.exports = nextConfig;
