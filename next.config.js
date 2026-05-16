/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: { dynamic: 0 }, // never keep /watch/[id] or /tv/[id] alive in router cache
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' }
    ]
  }
}

module.exports = nextConfig
