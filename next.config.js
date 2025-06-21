// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['scdoramzssnimcbsojml.supabase.co'],
  },
  // any other Next.js config options…
}

module.exports = withBundleAnalyzer(nextConfig)
