import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['avatars.githubusercontent.com', 'example.com', 'yourdomain.com'],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Use fallback instead of alias to disable canvas and encoding modules on client
      config.resolve = {
        ...(config.resolve || {}),
        fallback: {
          ...(config.resolve?.fallback || {}),
          canvas: false,
          encoding: false,
        },
      };

      // Ignore canvas module to prevent bundling it on client
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );
    }

    return config;
  },

  // Prevent Next.js from bundling these native packages for serverless environments
  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;
