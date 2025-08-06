import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['avatars.githubusercontent.com', 'example.com', 'yourdomain.com'],
  },
  // Add these configurations
  webpack: (config, { isServer, webpack }) => {
    // Exclude canvas from client bundles
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias['canvas'] = false;
      config.resolve.alias.encoding = false;
      
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /canvas|pdfjs-dist/,
          contextRegExp: /node_modules/
        })
      );
    }
    
    // For pdfjs-dist
    config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/legacy/build/pdf';
    config.resolve.alias['@react-pdf-viewer/core'] = false;
    
    return config;
  },
  // Experimental configuration
  experimental: {
    serverComponentsExternalPackages: ['canvas', 'pdfjs-dist'],
  },
  // Turbopack configuration
  turbo: {
    loaders: {
      '.pdf': ['arraybuffer-loader'],
    },
    rules: {
      '*.node': {
        loaders: ['file-loader'],
      },
    },
  },
};

export default nextConfig;