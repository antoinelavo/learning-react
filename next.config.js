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
    // Teacher photos on R2. TeacherCard resizes them through next/image.
    remotePatterns: [
      { protocol: 'https', hostname: 'ibmaster.antoinelavo.com', pathname: '/teachers/**' },
    ],
    // R2 sends no Cache-Control, so without this the optimized copies expire
    // after 60s and get re-transformed. Upload filenames are unique, so a
    // changed photo always has a new URL.
    minimumCacheTTL: 2678400,
  },
  pageExtensions: ['js', 'jsx'],
};

module.exports = withBundleAnalyzer(nextConfig);
