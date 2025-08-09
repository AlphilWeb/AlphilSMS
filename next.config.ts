import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['avatars.githubusercontent.com', 'example.com', 'yourdomain.com'],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;

      // Only ignore canvas (not pdfjs-dist)
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );
    }

    return config;
  },
  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;
