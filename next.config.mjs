/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Static-export only (replaces `next export`)
  output: 'export',

  // 2. Emit /page/index.html rather than /page.html
  trailingSlash: true,

  // 3. Disable built-in font optimization so we don’t hit the ./-prefix bug
  // optimizeFonts: false,

  // 4. (Optional) If you’re using next/image, skip its loader entirely
  images: { unoptimized: true },

  // assetPrefix: './',

  // 5. Webpack override: tell the client bundle to request assets relatively
  webpack(config, { isServer, dev }) {
    if (!isServer && !dev) {
      // equivalently: assetPrefix: './' but bypasses Next’s validation
      config.output.publicPath = './_next/'
    }
    return config
  },
}

export default nextConfig
