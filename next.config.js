const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/_offline",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Empty turbopack config to acknowledge Next.js 16 Turbopack default
  // PWA service worker generation handled by next-pwa webpack plugin
  turbopack: {},
};

module.exports = withPWA(nextConfig);
