// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})


/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  images: {
    domains: ['scdoramzssnimcbsojml.supabase.co'],
  },
  // include mdx so next/link & friends can resolve .md/.mdx pages
  pageExtensions: ['js', 'jsx', 'md', 'mdx'],
}

module.exports = withBundleAnalyzer(
)