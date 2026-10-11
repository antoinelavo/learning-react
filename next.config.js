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
  // `page.dev.jsx` routes (the community seed preview) exist only under
  // `next dev`; production builds don't include them, so they 404.
  pageExtensions: process.env.NODE_ENV === 'production' ? ['js', 'jsx'] : ['dev.jsx', 'js', 'jsx'],
};

module.exports = withBundleAnalyzer(nextConfig);
