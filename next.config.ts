import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    domains: ['avatars.githubusercontent.com', 'example.com', 'yourdomain.com'], // Replace with your actual domains
     // Add any other external image domains here
  }
};

export default nextConfig;
