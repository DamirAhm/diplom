/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["placeholder.com"],
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }] // required for three.js
    return config
  },
}

module.exports = nextConfig

