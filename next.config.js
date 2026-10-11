// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// `page.dev.jsx` routes (the community seed preview) exist under `next dev`
// and on Vercel preview deployments, never on the production site.
const seedPreview = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'scdoramzssnimcbsojml.supabase.co',
    ],
  },
  pageExtensions: seedPreview ? ['dev.jsx', 'js', 'jsx'] : ['js', 'jsx'],
  // Shows the admin panel's preview button only where the routes exist.
  env: { NEXT_PUBLIC_SEED_PREVIEW: seedPreview ? '1' : '' },
  // The preview reads seed Markdown from disk at request time; ship it with the functions.
  outputFileTracingIncludes: {
    '/community/preview': ['./content/community-seed/**'],
    '/community/preview/[n]': ['./content/community-seed/**'],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
