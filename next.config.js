// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'scdoramzssnimcbsojml.supabase.co',
    ],
  },
  pageExtensions: ['js', 'jsx'],
};

module.exports = withBundleAnalyzer(nextConfig);
