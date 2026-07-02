/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-leaflet è ESM-only: lo transpiliamo per sicurezza con Next 14.
  transpilePackages: ["react-leaflet", "@react-leaflet/core"],
};

module.exports = nextConfig;
