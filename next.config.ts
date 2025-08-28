import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'alphilsms.46697d0c4cf22940fd573b95841a13ea.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
    ],
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
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }

    return config;
  },
  serverExternalPackages: ['canvas', 'pdfjs-dist'],
};

export default nextConfig;