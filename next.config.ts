import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['avatars.githubusercontent.com', 'example.com', 'yourdomain.com'],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
      };

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );
    } else {
      // Mark canvas as external on server to prevent bundling native code
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }

    return config;
  },
  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;
