/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.externals.push({
      '@exodus/bytes': 'commonjs @exodus/bytes'
    })
    return config
  }
}

module.exports = nextConfig
